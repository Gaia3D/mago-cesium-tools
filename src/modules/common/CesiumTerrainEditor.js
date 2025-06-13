import * as Cesium from "cesium";
import {Quantizer} from "@/modules/common/Quantizer.js";

export class CesiumTerrainEditor {

    // Cesium.PolygonPipeline.triangulate

    constructor(viewer, options) {
        this.viewer = viewer;
        this.terrainProvider = options.terrainProvider;
        //this.polygon = undefined;
        this.triangles = this.sampleTriangles();
        this.init();
    }

    sampleTriangles() {
        const positions = [
            {
                "x": -3117510.192773539,
                "y": 4080559.0222043055,
                "z": 3770278.2288362617,
            },
            {
                "x": -3117603.6360362843,
                "y": 4080708.9799631587,
                "z": 3770040.2572422163,
            },
            {
                "x": -3117828.2701303754,
                "y": 4080541.505617175,
                "z": 3770035.7926142938,
            },
            {
                "x": -3117746.6370799667,
                "y": 4080433.8195271282,
                "z": 3770316.0611207928,
            },
        ];
        const cartesianPositions = positions.map(pos => new Cesium.Cartesian3(pos.x, pos.y, pos.z));

        let polylinePositions = [];
        polylinePositions = polylinePositions.concat(cartesianPositions, cartesianPositions[0]);
        this.viewer.entities.add({
            polyline: {
                positions: polylinePositions,
                width: 3,
                material: Cesium.Color.RED.withAlpha(0.8),
                clampToGround: true,
            },
        });

        //Cesium.PolygonPipeline.triangulate(positions, []);

        return new Cesium.PolygonHierarchy(cartesianPositions);
    }

    init() {
        const terrainProvider = this.terrainProvider;
        const originalRequestTileGeometry = Cesium.CesiumTerrainProvider.prototype.requestTileGeometry;
        this.terrainProvider.requestTileGeometry = function(x, y, level) {
            //console.log("EditableCesiumTerrainProvider.requestTileGeometry called with x:", x, "y:", y, "level:", level);
            let terrainData = originalRequestTileGeometry.call(terrainProvider, x, y, level);
            terrainData.then((data) => {
                console.log("[requestTileGeometry]", "level:", level, "x:", x, "y:", y);

                // Create a new Quantizer instance for the tile
                const tilingScheme = new Cesium.GeographicTilingScheme();
                const rectangle = tilingScheme.tileXYToRectangle(x, y, level);
                const quantizer = new Quantizer({
                    rectangle: rectangle,
                });
                const temp = quantizer.createSimpleTile(x, y, level);

                // Copy properties from temp to data
                data._minimumHeight = temp._minimumHeight;
                data._maximumHeight = temp._maximumHeight;
                //data._orientedBoundingBox = temp._orientedBoundingBox;
                //data._horizonOcclusionPoint = temp._horizonOcclusionPoint;
                data._boundingSphere = temp._boundingSphere;
                data._quantizedVertices = temp._quantizedVertices;
                data._indices = temp._indices;
                data._westIndices = temp._westIndices;
                data._eastIndices = temp._eastIndices;
                data._southIndices = temp._southIndices;
                data._northIndices = temp._northIndices;
            }).catch((error) => {
                console.error("Error in requestTileGeometry:", error);
            });
            return terrainData;
        };
    }
}