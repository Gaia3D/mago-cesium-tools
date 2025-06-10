export class MagoVertex {
    position: MagoPoint3;
    normal: MagoPoint3;
    color: MagoPoint4;
    texCoord: MagoPoint2;
    idx: any;
    setPosition(px: any, py: any, pz: any): void;
    setNormal(nx: any, ny: any, nz: any): void;
    setColor(r: any, g: any, b: any, a: any): void;
    setTexCoord(u: any, v: any): void;
    clone(): MagoVertex;
    setIdx(idx: any): void;
}
import { MagoPoint3 } from "./MagoPoint3.js";
import { MagoPoint4 } from "./MagoPoint4.js";
import { MagoPoint2 } from "./MagoPoint2.js";
