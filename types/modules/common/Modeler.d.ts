export class Modeler {
    newVertex(px: any, py: any, pz: any, nx: any, ny: any, nz: any, tx: any, ty: any): Vertex;
    /**
     * Creates a box defined by the minimum and maximum coordinates.
     * @param min {Cesium.Cartesian3} Minimum coordinates (x, y, z)
     * @param max {Cesium.Cartesian3} Maximum coordinates (x, y, z)
     * @returns {undefined|VertexBufferObject}
     */
    createBox(min: Cesium.Cartesian3, max: Cesium.Cartesian3): undefined | VertexBufferObject;
    createBoxBySize(sizeX: any, sizeY: any, sizeZ: any): any;
}
import { Vertex } from "./magoGeometry/Vertex.js";
import * as Cesium from "cesium";
