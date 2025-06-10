import {MagoPoint3} from "./MagoPoint3.js";
import {MagoPoint2} from "./MagoPoint2.js";
import {MagoPoint4} from "./MagoPoint4.js";

export class MagoVertex {
    constructor() {
        this.position = undefined;
        this.normal = undefined;
        this.color = undefined;
        this.texCoord = undefined;
        this.idx = undefined;
    }

    setPosition(px, py, pz) {
        if (this.position === undefined) {
            this.position = new MagoPoint3();
        }
        this.position.set(px, py, pz);
    }

    setNormal(nx, ny, nz) {
        if (this.normal === undefined) {
            this.normal = new MagoPoint3();
        }
        this.normal.set(nx, ny, nz);
    }

    setColor(r, g, b, a) {
        if (this.color === undefined) {
            this.color = new MagoPoint4();
        }
        this.color.set(r, g, b, a);
    }

    setTexCoord(u, v) {
        if (this.texCoord === undefined) {
            this.texCoord = new MagoPoint2();
        }
        this.texCoord.set(u, v);
    }

    clone() {
        const vertex = new MagoVertex();
        if (this.position !== undefined) {
            vertex.position = this.position.clone();
        }
        if (this.normal !== undefined) {
            vertex.normal = this.normal.clone();
        }
        if (this.color !== undefined) {
            vertex.color = this.color.clone();
        }
        if (this.texCoord !== undefined) {
            vertex.texCoord = this.texCoord.clone();
        }
        return vertex;
    }

    setIdx(idx) {
        this.idx = idx;
    }
}