import * as Cesium from "cesium";

export class CesiumTerrainEditor {

    // Cesium.PolygonPipeline.triangulate

    constructor(options) {
        this.terrainProvider = options.terrainProvider;
        this.polygons = [];
        this.init();
    }

    init() {
        const terrainProvider = this.terrainProvider;

        const originalRequestTileGeometry = Cesium.CesiumTerrainProvider.prototype.requestTileGeometry;
        this.terrainProvider.requestTileGeometry = function(x, y, level) {
            //console.log("EditableCesiumTerrainProvider.requestTileGeometry called with x:", x, "y:", y, "level:", level);
            let terrainData = originalRequestTileGeometry.call(terrainProvider, x, y, level);
            terrainData.then((data) => {

                let newQuantizedMeshTerrainData = new Cesium.QuantizedMeshTerrainData({
                    indices: data._indices,
                    quantizedVertices: data._quantizedVertices,
                    boundingSphere: data._boundingSphere,
                    horizonOcclusionPoint: data._horizonOcclusionPoint,
                    westIndices: data._westIndices,
                    eastIndices: data._eastIndices,
                    southIndices: data._southIndices,
                    northIndices: data._northIndices,
                    minimumHeight: data._minimumHeight,
                    maximumHeight: data._maximumHeight,
                    westSkirtHeight: data._westSkirtHeight,
                    eastSkirtHeight: data._eastSkirtHeight,
                    southSkirtHeight: data._southSkirtHeight,
                    northSkirtHeight: data._northSkirtHeight,
                });
                terrainData = newQuantizedMeshTerrainData;

                //console.log("Terrain data received for x:", x, "y:", y, "level:", level);

                /*console.log("Start");
                let test = 100000000;
                for (let i = 0; i < test; i++) {

                }
                console.log("End");*/

                //data._maximumHeight = data._maximumHeight;
                console.log("Terrain data:", data);
            }).catch((error) => {
                console.error("Error fetching terrain data for x:", x, "y:", y, "level:", level, error);
            });
            //console.log("terrainData : ", terrainData);
            return terrainData;
        };
        //console.log("EditableCesiumTerrainProvider initialized with custom requestTileGeometry");
    }

}