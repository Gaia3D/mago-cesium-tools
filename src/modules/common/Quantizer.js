import * as Cesium from "cesium";
import {Triangle} from "@/modules/common/magoGeometry/Triangle.js";

export class Quantizer {

    constructor(options) {

        /**
         * quantizationFactor for the vertices.
         * @description It is typically set to a value like 32767 which allows for 16-bit signed integers.
         * @type {number}
         */
        this.quantizationFactor = options.quantizationFactor || 32767;

        /**
         * The rectangle that defines the geographic area covered by the quantized data.
         * @type {Rectangle}
         */
        this.rectengle = options.rectangle || Cesium.Rectangle.MAX_VALUE;
        this.minHeight = options.minHeight || 0;
        this.maxHeight = options.maxHeight || 32767;
    }

    /**
     * @param {Array<Cesium.Cartesian3>} positions
     * @returns {Array<Cesium.Cartesian3>} quantized positions
     */
    quantize(positions) {
        const rectangle = this.rectengle;
        const minHeight = this.minHeight;
        const maxHeight = this.maxHeight;
        const maxLongitude = rectangle.east;
        const maxLatitude = rectangle.north;
        const minLongitude = rectangle.west;
        const minLatitude = rectangle.south;

        const longitudeRange = maxLongitude - minLongitude;
        const latitudeRange = maxLatitude - minLatitude;
        const heightRange = maxHeight - minHeight;

        const quantizedVertices = [];
        for (let i = 0; i < positions.length; i += 3) {
            const position = positions[i];

            const cartographic = Cesium.Cartographic.fromCartesian(position);
            const uNorm = (cartographic.longitude - minLongitude) / longitudeRange;
            const vNorm = (cartographic.latitude - minLatitude) / latitudeRange;
            const hNorm = (cartographic.height - minHeight) / heightRange;

            const quantizedX = Math.round(uNorm * this.quantizationFactor);
            const quantizedY = Math.round(vNorm * this.quantizationFactor);
            const quantizedZ = Math.round(hNorm * this.quantizationFactor);

            const quantizedPosition = new Cesium.Cartesian3(quantizedX, quantizedY, quantizedZ);
            quantizedVertices.push(quantizedPosition);
        }
        return quantizedVertices;
    }

    /**
     * Dequantizes the quantized positions back to Cartesian3 coordinates.
     * @param {Array<Cesium.Cartesian3>} quantizedPositions
     * @returns {Array<Cesium.Cartesian3>} dequantized positions
     */
    dequantize(quantizedPositions) {
        const rectangle = this.rectengle;
        const minHeight = this.minHeight;
        const maxHeight = this.maxHeight;
        const maxLongitude = rectangle.east;
        const maxLatitude = rectangle.north;
        const minLongitude = rectangle.west;
        const minLatitude = rectangle.south;

        const positions = [];
        for (let i = 0; i < quantizedPositions.length; ++i) {
            const vertex = quantizedPositions[i];
            const uNorm = vertex.x / this.quantizationFactor;
            const vNorm = vertex.y / this.quantizationFactor;
            const hNorm = vertex.z / this.quantizationFactor;

            const lon = Cesium.Math.lerp(minLongitude, minLatitude, uNorm);
            const lat = Cesium.Math.lerp(maxLongitude, maxLatitude, vNorm);
            const height = Cesium.Math.lerp(minHeight, maxHeight, hNorm);
            const carto = new Cesium.Cartographic(lon, lat, height);
            const cartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
            positions.push(cartesian);
        }

        return positions;
    }

    /**
     * Arranges the quantized positions into a Uint16Array.
     * @param quantizedPositions
     */
    quantizedPositionsToUint16Array(quantizedPositions) {
        const length = quantizedPositions.length;
        const uValue = [];
        const vValue = [];
        const hValue = [];

        for (let i = 0; i < length; ++i) {
            const vertex = quantizedPositions[i];
            uValue[i] = vertex.x;
            vValue[i] = vertex.y;
            hValue[i] = vertex.z;
        }

        let result = [];
        result = result.concat(uValue, vValue, hValue);
        return new Uint16Array(result);
    }

    /**
     * Converts the quantized positions to a uInt16Array.
     */
    uInt16ArrayFromQuantizedPositions(quantizedPositions) {
        const length = quantizedPositions.length;
        const uValue = [];
        const vValue = [];
        const hValue = [];
        const uint8Array = new Uint8Array(length * 3);

        for (let i = 0; i < length; ++i) {
            const vertex = quantizedPositions[i];
            uValue[i] = vertex.x;
            vValue[i] = vertex.y;
            hValue[i] = vertex.z;
        }

        for (let i = 0; i < length; ++i) {
            uint8Array[i * 3] = uValue[i];
            uint8Array[i * 3 + 1] = vValue[i];
            uint8Array[i * 3 + 2] = hValue[i];
        }

        return uint8Array;
    }

    createSimpleTile() {
        //let vertices = [];
        const minHeight = 0.0;
        const maxHeight = 100.0;

        let vertex0 = new Cesium.Cartesian3(0, 0, 32767); // SW 0
        let vertex1 = new Cesium.Cartesian3(32767, 0, 32767); // SE 1
        let vertex2 = new Cesium.Cartesian3(32767, 32767, 32767); // NE 2
        let vertex3 = new Cesium.Cartesian3(0, 32767, 32767); // NW 3
        let vertex4 = new Cesium.Cartesian3(16383, 16383, 0); // Center 4

        let triangleA = new Triangle(vertex0, vertex1, vertex4);
        let triangleB = new Triangle(vertex1, vertex2, vertex4);
        let triangleC = new Triangle(vertex2, vertex3, vertex4);
        let triangleD = new Triangle(vertex3, vertex0, vertex4);

        let triangles = [];
        triangles.push(triangleA);
        triangles.push(triangleB);
        triangles.push(triangleC);
        triangles.push(triangleD);

        // [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]
        let indices = Triangle.generateIndices(triangles);
        let vertices = Triangle.generateVertices(triangles);

        const uniqueVerticesAndIndices = Triangle.uniqueVerticesAndIndices(vertices, indices);
        vertices = uniqueVerticesAndIndices.vertices;
        indices = uniqueVerticesAndIndices.indices;

        let sideIndices = Triangle.generateNorthEastSouthWestIndices(vertices);

        // [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]
        let westIndices = sideIndices.west;
        let eastIndices = sideIndices.east;
        let southIndices = sideIndices.south;
        let northIndices = sideIndices.north;

        console.log("Quantizer.createMoreSimpleTile: vertices.length = " + vertices.length);

        const positions = this.dequantize(vertices);
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);

        // https://cesium.com/downloads/cesiumjs/releases/b29/Documentation/EllipsoidalOccluder.html?classFilter=EllipsoidalOccluder
        //console.log("ellipsoidalOccluder:", ellipsoidalOccluder);
        // const camera = this.viewer.camera;
        // const cameraPosition = camera.positionWC;
        // const ellipsoid = this.viewer.scene.globe.ellipsoid;
        // const ellipsoidalOccluder = new Cesium.EllipsoidalOccluder(ellipsoid, cameraPosition);
        const horizonOcclusionPoint = new Cesium.Cartesian3();
        //ellipsoidalOccluder.computeHorizonCullingPointFromVertices(cartesian, positions, 3, boundingSphere.center, horizonOcclusionPoint);
        let quantizedVertices = this.quantizedPositionsToUint16Array(vertices);

        return new Cesium.QuantizedMeshTerrainData({
            quantizedVertices: quantizedVertices,
            horizonOcclusionPoint: horizonOcclusionPoint,
            boundingSphere: boundingSphere,
            indices: new Uint16Array(indices),
            westIndices: new Uint16Array(westIndices),
            eastIndices: new Uint16Array(eastIndices),
            southIndices: new Uint16Array(southIndices),
            northIndices: new Uint16Array(northIndices),
            minimumHeight: minHeight,
            maximumHeight: maxHeight,
            westSkirtHeight: 1.0,
            eastSkirtHeight: 1.0,
            southSkirtHeight: 1.0,
            northSkirtHeight: 1.0,
        });
    }

    createMoreSimpleTile() {
        //let vertices = [];
        const minHeight = 0.0;
        const maxHeight = 100.0;

        let vertex0 = new Cesium.Cartesian3(0, 0, 32767); // SW 0
        let vertex1 = new Cesium.Cartesian3(32767, 0, 32767); // SE 1
        let vertex2 = new Cesium.Cartesian3(32767, 32767, 32767); // NE 2
        let vertex3 = new Cesium.Cartesian3(0, 32767, 32767); // NW 3

        let triangleA = new Triangle(vertex0, vertex1, vertex2);
        let triangleB = new Triangle(vertex0, vertex2, vertex3);

        let triangles = [];
        triangles.push(triangleA);
        triangles.push(triangleB);

        // [0, 1, 2], [0, 2, 3]
        let indices = Triangle.generateIndices(triangles);
        let vertices = Triangle.generateVertices(triangles);

        const uniqueVerticesAndIndices = Triangle.uniqueVerticesAndIndices(vertices, indices);
        vertices = uniqueVerticesAndIndices.vertices;
        indices = uniqueVerticesAndIndices.indices;

        let sideIndices = Triangle.generateNorthEastSouthWestIndices(vertices);

        let westIndices = sideIndices.west;
        let eastIndices = sideIndices.east;
        let southIndices = sideIndices.south;
        let northIndices = sideIndices.north;

        const positions = this.dequantize(vertices);
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);

        const horizonOcclusionPoint = new Cesium.Cartesian3();
        let quantizedVertices = this.quantizedPositionsToUint16Array(vertices);
        return new Cesium.QuantizedMeshTerrainData({
            horizonOcclusionPoint: horizonOcclusionPoint,
            boundingSphere: boundingSphere,
            quantizedVertices: quantizedVertices,
            indices: new Uint16Array(indices),
            westIndices: new Uint16Array(westIndices),
            eastIndices: new Uint16Array(eastIndices),
            southIndices: new Uint16Array(southIndices),
            northIndices: new Uint16Array(northIndices),
            minimumHeight: minHeight,
            maximumHeight: maxHeight,
            westSkirtHeight: 1.0,
            eastSkirtHeight: 1.0,
            southSkirtHeight: 1.0,
            northSkirtHeight: 1.0,
        });
    }
}