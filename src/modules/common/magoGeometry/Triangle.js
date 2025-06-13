import * as Cesium from "cesium";
import {Segment2D} from "@/modules/common/magoGeometry/Segment.js";

export class Triangle {
    constructor(point1, point2, point3) {
        this.set(point1, point2, point3);
    }

    set(pointA, pointB, pointC) {
        this.vertices = [];
        this.vertices.push(pointA || new Cesium.Cartesian3());
        this.vertices.push(pointB || new Cesium.Cartesian3());
        this.vertices.push(pointC || new Cesium.Cartesian3());

        const segmentA = Segment2D.fromCartesian3(pointA, pointB, new Segment2D());
        const segmentB = Segment2D.fromCartesian3(pointB, pointC, new Segment2D());
        const segmentC = Segment2D.fromCartesian3(pointC, pointA, new Segment2D());
        this.segments = [segmentA, segmentB, segmentC];
    }

    containsPoint(point) {
        // Check if the point is inside the triangle using barycentric coordinates
        const v0 = Cesium.Cartesian3.subtract(this.vertices[1], this.vertices[0], new Cesium.Cartesian3());
        const v1 = Cesium.Cartesian3.subtract(this.vertices[2], this.vertices[0], new Cesium.Cartesian3());
        const v2 = Cesium.Cartesian3.subtract(point, this.vertices[0], new Cesium.Cartesian3());

        const dot00 = Cesium.Cartesian3.dot(v0, v0);
        const dot01 = Cesium.Cartesian3.dot(v0, v1);
        const dot02 = Cesium.Cartesian3.dot(v0, v2);
        const dot11 = Cesium.Cartesian3.dot(v1, v1);
        const dot12 = Cesium.Cartesian3.dot(v1, v2);

        const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v <= 1);
    }

    getArea() {
        // Calculate the area of the triangle using the cross product
        const v0 = Cesium.Cartesian3.subtract(this.vertices[1], this.vertices[0], new Cesium.Cartesian3());
        const v1 = Cesium.Cartesian3.subtract(this.vertices[2], this.vertices[0], new Cesium.Cartesian3());
        const crossProduct = Cesium.Cartesian3.cross(v0, v1, new Cesium.Cartesian3());
        return 0.5 * Cesium.Cartesian3.magnitude(crossProduct);
    }

    /**
     * Generates indices for the triangles.
     * @param triangles
     * @returns {*[]}
     */
    static generateIndices(triangles) {
        const indices = [];
        for (let i = 0; i < triangles.length; i++) {
            const triangle = triangles[i];
            indices.push(i * 3, i * 3 + 1, i * 3 + 2);
        }
        return indices;
    }

    /**
     * Generates vertices from the provided triangles.
     * @param triangles
     * @returns {*[]}
     */
    static generateVertices(triangles) {
        const vertices = [];
        for (let i = 0; i < triangles.length; i++) {
            const triangle = triangles[i];
            vertices.push(...triangle.vertices);
        }
        return vertices;
    }

    /**
     * Generates north, east, south, and west indices based on the provided vertices.
     * @param vertices
     * @returns {{north: (*|*[]), east: (*|*[]), south: (*|*[]), west: (*|*[])}}
     */
    static generateNorthEastSouthWestIndices(vertices) {
        let northIndices = [];
        let eastIndices = [];
        let southIndices = [];
        let westIndices = [];

        const minX = Math.min(...vertices.map(v => v.x));
        const maxX = Math.max(...vertices.map(v => v.x));
        const minY = Math.min(...vertices.map(v => v.y));
        const maxY = Math.max(...vertices.map(v => v.y));

        for (let i = 0; i < vertices.length; i++) {
            if (vertices[i].x === minX) {
                westIndices.push(i);
            }
            if (vertices[i].x === maxX) {
                eastIndices.push(i);
            }
            if (vertices[i].y === minY) {
                southIndices.push(i);
            }
            if (vertices[i].y === maxY) {
                northIndices.push(i);
            }
        }

        // Ensure unique indices
        const unique = (arr) => Array.from(new Set(arr));
        northIndices = unique(northIndices);
        eastIndices = unique(eastIndices);
        southIndices = unique(southIndices);
        westIndices = unique(westIndices);

        // Sort indices to maintain order
        const sortIndices = (arr) => arr.sort((a, b) => a - b);
        northIndices = sortIndices(northIndices);
        eastIndices = sortIndices(eastIndices);
        southIndices = sortIndices(southIndices);
        westIndices = sortIndices(westIndices);

        return {
            north: northIndices,
            east: eastIndices,
            south: southIndices,
            west: westIndices,
        };
    }

    /**
     * Generates unique vertices and indices from the provided vertices and indices.
     * @param vertices
     * @param indices
     * @returns {{uniqueVertices: *[], newIndices: *}}
     */
    static uniqueVerticesAndIndices(vertices, indices) {
        const uniqueVertices = [];
        const vertexMap = new Map();

        for (let i = 0; i < vertices.length; i++) {
            const vertex = vertices[i];
            const key = `${vertex.x},${vertex.y},${vertex.z}`;
            if (!vertexMap.has(key)) {
                vertexMap.set(key, uniqueVertices.length);
                uniqueVertices.push(vertex);
            }
        }

        const newIndices = indices.map(index => vertexMap.get(`${vertices[index].x},${vertices[index].y},${vertices[index].z}`));
        return {
            vertices: uniqueVertices,
            indices: newIndices,
        };
    }

    /**
     * Generates triangles from the provided vertices and indices.
     * @param {Array<Cesium.Cartesian3>} vertices
     * @param {Array<number>} indices
     * @returns {module:cesium.PolygonHierarchy}
     */
    static generateTrianglesFromVerticesWithIndices(vertices, indices) {
        if (indices.length === 0 && indices.length % 3 !== 0) {
            console.warn("CesiumTerrainEditor.sampleTriangles: No indices generated or indices length is not a multiple of 3.");
        }

        const triangles = [];
        for (let i = 0; i < indices.length; i += 3) {
            const index1 = indices[i];
            const index2 = indices[i + 1];
            const index3 = indices[i + 2];

            if (index1 < vertices.length && index2 < vertices.length && index3 < vertices.length) {
                const triangle = new Triangle(vertices[index1], vertices[index2], vertices[index3]);
                triangles.push(triangle);
            } else {
                console.warn(`Index out of bounds: ${index1}, ${index2}, ${index3}`);
            }
        }
        return triangles;
    }
}