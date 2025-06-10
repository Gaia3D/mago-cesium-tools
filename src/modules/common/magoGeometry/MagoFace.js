import {MagoPoint3} from "./MagoPoint3.js";
import {MagoPoint4} from "./MagoPoint4.js";

export class MagoFace {
    constructor(vertexArray) {
        this.vertexArray = [];
        if (vertexArray === undefined) {
            this.vertexArray = [];
        } else {
            this.vertexArray = vertexArray;
        }
        this.indices = undefined;
        this.faceNormal = undefined;
        this.faceColor = undefined;
    }

    calculateFaceNormal() {
        const vertexCount = this.vertexArray.length;
        if (vertexCount < 3) {
            return undefined;
        }

        const v0 = this.vertexArray[0];
        const v1 = this.vertexArray[1];
        const v2 = this.vertexArray[2];

        const a = new MagoPoint3();
        a.sub(v1.position, v0.position);
        const b = new MagoPoint3();
        b.sub(v2.position, v0.position);

        const normal = new MagoPoint3();
        normal.cross(a, b);
        normal.normalize();

        if (this.faceNormal === undefined) {
            this.faceNormal = new MagoPoint3();
        }
        this.faceNormal.set(normal.x, normal.y, normal.z);
    }

    setFaceNormal(nx, ny, nz) {
        if (this.faceNormal === undefined) {
            this.faceNormal = new MagoPoint3();
        }
        this.faceNormal.set(nx, ny, nz);
    }

    setVertexNormalFromFaceNormal() {
        const vertexCount = this.vertexArray.length;
        for (let i = 0; i < vertexCount; i++) {
            const vertex = this.vertexArray[i];
            if (vertex.normal === undefined) {
                vertex.normal = new MagoPoint3();
            }
            vertex.normal.set(this.faceNormal.x, this.faceNormal.y, this.faceNormal.z);
        }
    }

    setFaceColor(r, g, b, a) {
        if (this.faceColor === undefined) {
            this.faceColor = new MagoPoint4();
        }
        this.faceColor.set(r, g, b, a);
    }

    calculateTriangleIndices() {
        //********************************************************
        // note: consider that the face is convex
        // and the vertices are ordered in counter-clockwise order
        //********************************************************
        const vertexCount = this.vertexArray.length;
        if (vertexCount < 3) {
            return undefined;
        }

        if (this.indices !== undefined) {
            this.indices.length = 0;
        } else {
            this.indices = [];
        }

        for (let i = 0; i < vertexCount - 2; i++) {
            this.indices.push(0);
            this.indices.push((i + 1));
            this.indices.push((i + 2));
        }
    }

    getVertices() {
        return this.vertexArray;
    }

    getIndices() {
        if (this.indices === undefined) {
            this.calculateTriangleIndices();
        }
        return this.indices;
    }
}