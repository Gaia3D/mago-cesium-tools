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

        const createSimpleTerrainData = this.createSimpleTerrainData.bind(this);

        const originalRequestTileGeometry = Cesium.CesiumTerrainProvider.prototype.requestTileGeometry;
        this.terrainProvider.requestTileGeometry = function(x, y, level) {
            //console.log("EditableCesiumTerrainProvider.requestTileGeometry called with x:", x, "y:", y, "level:", level);
            let terrainData = originalRequestTileGeometry.call(terrainProvider, x, y, level);
            terrainData.then((data) => {

                /*let newQuantizedMeshTerrainData = new Cesium.QuantizedMeshTerrainData({
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
                });*/
                console.log("EditableCesiumTerrainProvider.requestTileGeometry called with x:", x, "y:", y, "level:", level);

                const temp = createSimpleTerrainData();
                terrainData = temp; // Use the simple terrain data for testing

                console.log("temp:", temp);

                data._indices = temp._indices;
                data._quantizedVertices = temp._quantizedVertices;
                data._minimumHeight = temp._minimumHeight;
                data._maximumHeight = temp._maximumHeight;
                //data._orientedBoundingBox = temp._orientedBoundingBox;
                data._boundingSphere = temp._boundingSphere;
                //data._horizonOcclusionPoint = temp._horizonOcclusionPoint;
                data._westIndices = temp._westIndices;
                data._eastIndices = temp._eastIndices;
                data._southIndices = temp._southIndices;
                data._northIndices = temp._northIndices;
                /*                data._westSkirtHeight = temp._westSkirtHeight;
                                data._eastSkirtHeight = temp._eastSkirtHeight;
                                data._southSkirtHeight = temp._southSkirtHeight;
                                data._northSkirtHeight = temp._northSkirtHeight;*/
                //data._encodedNormals = undefined; // temp._encodedNormals; // Not used in this example

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

    /*
        Terrain data for a single tile where the terrain data is represented as a quantized mesh.
        A quantized mesh consists of three vertex attributes, longitude, latitude, and height.  All attributes are expressed as 16-bit values in the range 0 to 32767.
        Longitude and latitude are zero at the southwest corner of the tile and 32767 at the northeast corner.
        Height is zero at the minimum height in the tile and 32767 at the maximum height in the tile.
        [from Cesium.QuantizedMeshTerrainData.js]
     */
    createSimpleTerrainData() {
        let vertices = []; // 65535
        let indices = [];

        let vertex1 = new Cesium.Cartesian3(0, 0, 0); // SW
        let vertex2 = new Cesium.Cartesian3(0, 1, 0); // NW
        let vertex3 = new Cesium.Cartesian3(1, 0, 0); // SE
        let vertex4 = new Cesium.Cartesian3(1, 1, 0); // NE
        vertices.push(vertex1);
        vertices.push(vertex2);
        vertices.push(vertex3);
        vertices.push(vertex4);

        const boundingSphere = Cesium.BoundingSphere.fromPoints(vertices);
        //const center = boundingSphere.center;
        //const direction = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());

        let xArray = [];
        let yArray = [];
        let zArray = [];
        vertices.forEach((vertex) => {
            const lon = vertex.x * 32767;
            const lat = vertex.y * 32767;
            const height = vertex.z * 32767;
            xArray.push(lon);
            yArray.push(lat);
            zArray.push(height);
        });
        let verticesArray = xArray.concat(yArray);
        verticesArray = verticesArray.concat(zArray);
        let quantizedVertices = new Uint16Array(verticesArray);

        indices = new Uint16Array([
            0, 3, 1,
            0, 2, 3,
        ]);

        let westIndices = [
            0, 1,
        ];
        let eastIndices = [
            2, 3,
        ];
        let southIndices = [
            0, 1,
        ];
        let northIndices = [
            1, 3,
        ];

        return new Cesium.QuantizedMeshTerrainData({
            indices: indices,
            quantizedVertices: quantizedVertices,
            //boundingSphere: new Cesium.BoundingSphere(new Cesium.Cartesian3(1, 2, 3), 10000),
            //orientedBoundingBox: new Cesium.OrientedBoundingBox(new Cesium.Cartesian3(1.0, 2.0, 3.0), Cesium.Matrix3.fromRotationX(Cesium.Math.PI, new Cesium.Matrix3())),
            horizonOcclusionPoint: new Cesium.Cartesian3(),
            boundingSphere: boundingSphere,

            westIndices: westIndices,
            eastIndices: eastIndices,
            southIndices: southIndices,
            northIndices: northIndices,
            minimumHeight: 0.0,
            maximumHeight: 100.0,
            westSkirtHeight: 1.0,
            eastSkirtHeight: 1.0,
            southSkirtHeight: 1.0,
            northSkirtHeight: 1.0,
        });
    }
}