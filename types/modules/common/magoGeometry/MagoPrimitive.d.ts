export class MagoPrimitive {
    surfaces: any[];
    addSurface(surface: any): void;
    calculateFacesNormals(): void;
    calculateFacesTriangleIndices(): void;
    getVbo(): MagoVbo;
    setVertexNormalFromFaceNormal(): void;
}
import { MagoVbo } from "../magoVbo/MagoVbo";
