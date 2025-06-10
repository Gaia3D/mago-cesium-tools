import {MagoVbo} from "../magoVbo/MagoVbo.js";

export class MagoSurface {
    constructor() {
        this.faces = [];
    }

    addFace(face) {
        this.faces.push(face);
    }

    calculateFacesNormals() {
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            face.calculateFaceNormal();
        }
    }

    calculateFacesTriangleIndices() {
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            face.calculateTriangleIndices();
        }
    }

    getFacesCount() {
        return this.faces.length;
    }

    getFace(index) {
        if (index < 0 || index >= this.faces.length) {
            return undefined;
        }
        return this.faces[index];
    }

    getVertices() {
        const vertices = [];
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            vertices.push(...face.getVertices());
        }
        return vertices;
    }

    getVbo() {
        if (this.faces.length === 0) {
            console.warn("No faces available in MagoSurface.");
            return undefined;
        }

        let positions = [];
        let normals = undefined;
        let colors = undefined;
        let uvs = undefined;
        let indices = [];

        let vertices = this.getVertices();
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];
            vertex.setIdx(i);

            positions.push(vertex.position.x);
            positions.push(vertex.position.y);
            positions.push(vertex.position.z);

            if (vertex.normal !== undefined) {
                if (normals === undefined) {
                    normals = [];
                }
                normals.push(vertex.normal.x);
                normals.push(vertex.normal.y);
                normals.push(vertex.normal.z);
            }

            if (vertex.color !== undefined) {
                if (colors === undefined) {
                    colors = [];
                }
                colors.push(vertex.color.r);
                colors.push(vertex.color.g);
                colors.push(vertex.color.b);
                colors.push(vertex.color.a);
            }

            if (vertex.texCoord !== undefined) {
                if (uvs === undefined) {
                    uvs = [];
                }
                uvs.push(vertex.texCoord.u);
                uvs.push(vertex.texCoord.v);
            }
        }

        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            const faceIndices = face.getIndices();
            if (faceIndices === undefined) {
                continue;
            }
            const indicesCount = faceIndices.length;
            for (let j = 0; j < indicesCount; j++) {
                let idx = faceIndices[j];
                let faceVertex = face.vertexArray[idx];
                if (faceVertex.idx !== undefined) {
                    indices.push(faceVertex.idx);
                }
            }
        }

        let magoVbo = new MagoVbo();

        magoVbo.setPositions(positions);
        if (normals !== undefined) {
            magoVbo.setNormals(normals);
        }
        if (colors !== undefined) {
            magoVbo.setColors(colors);
        }
        if (uvs !== undefined) {
            magoVbo.setUvs(uvs);
        }
        if (indices.length > 0) {
            magoVbo.setIndices(indices);
        }

        return magoVbo;
    }

    setVertexNormalFromFaceNormal() {
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            face.setVertexNormalFromFaceNormal();
        }
    }
}