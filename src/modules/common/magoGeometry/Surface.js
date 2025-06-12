import {VertexBufferObject} from "../magoVbo/VertexBufferObject.js";

export class Surface {
    constructor() {
        /**
         * Array of faces that compose this surface.
         * @type {Array<Face>}
         */
        this.faces = [];
    }

    /**
     * Adds a face to the surface.
     * @param face {Face} The face to be added.
     */
    addFace(face) {
        this.faces.push(face);
    }

    /**
     * Calculates the normals for each face in the surface.
     * This method iterates through all the faces and calls their `calculateFaceNormal` method.
     * This is essential for rendering the surface correctly with lighting effects.
     * @returns {void}
     */
    calculateFacesNormals() {
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            face.calculateFaceNormal();
        }
    }

    /**
     * Calculates the triangle indices for each face in the surface.
     * This method iterates through all the faces and calls their `calculateTriangleIndices` method.
     * This is essential for rendering the surface correctly with triangle-based rendering.
     * @return {void}
     */
    calculateFacesTriangleIndices() {
        for (let i = 0; i < this.faces.length; i++) {
            const face = this.faces[i];
            face.calculateTriangleIndices();
        }
    }

    /**
     * Returns the number of faces in the surface.
     * @returns {number}
     */
    getFacesCount() {
        return this.faces.length;
    }

    /**
     * Returns the face at the specified index.
     * @param index
     * @returns {undefined|Face}
     */
    getFace(index) {
        if (index < 0 || index >= this.faces.length) {
            return undefined;
        }
        return this.faces[index];
    }

    /**
     * Returns an array of vertices that compose the surface.
     * @returns {Array<Vertex>} Array of vertices
     */
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
        //console.log("MagoSurface.getVbo: vertices.length = " + vertices.length);
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];
            vertex.index = i;

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
                colors.push(vertex.color.red);
                colors.push(vertex.color.green);
                colors.push(vertex.color.blue);
                colors.push(vertex.color.alpha);
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
                let index = faceIndices[j];
                let faceVertex = face.vertices[index];
                if (faceVertex.index !== undefined) {
                    indices.push(faceVertex.index);
                }
            }
        }

        let magoVbo = new VertexBufferObject();

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