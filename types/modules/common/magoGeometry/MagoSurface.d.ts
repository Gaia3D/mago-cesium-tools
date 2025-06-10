export class MagoSurface {
    faces: any[];
    addFace(face: any): void;
    calculateFacesNormals(): void;
    calculateFacesTriangleIndices(): void;
    getFacesCount(): number;
    getFace(index: any): any;
    getVertices(): any[];
    getVbo(): MagoVbo;
    setVertexNormalFromFaceNormal(): void;
}
import { MagoVbo } from "../magoVbo/MagoVbo.js";
