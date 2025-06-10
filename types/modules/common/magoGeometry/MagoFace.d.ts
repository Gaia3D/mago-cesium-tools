export class MagoFace {
    constructor(vertexArray: any);
    vertexArray: any;
    indices: any[];
    faceNormal: MagoPoint3;
    faceColor: MagoPoint4;
    calculateFaceNormal(): any;
    setFaceNormal(nx: any, ny: any, nz: any): void;
    setVertexNormalFromFaceNormal(): void;
    setFaceColor(r: any, g: any, b: any, a: any): void;
    calculateTriangleIndices(): any;
    getVertices(): any;
    getIndices(): any[];
}
import { MagoPoint3 } from "./MagoPoint3.js";
import { MagoPoint4 } from "./MagoPoint4.js";
