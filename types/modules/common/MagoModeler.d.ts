export class MagoModeler {
    newVertex(px: any, py: any, pz: any, nx: any, ny: any, nz: any, tx: any, ty: any): MagoVertex;
    createBox(minX: any, minY: any, minZ: any, maxX: any, maxY: any, maxZ: any): import("./magoVbo/MagoVbo.js").MagoVbo;
    createBoxBySize(sizeX: any, sizeY: any, sizeZ: any): import("./magoVbo/MagoVbo.js").MagoVbo;
}
import { MagoVertex } from "./magoGeometry/MagoVertex.js";
