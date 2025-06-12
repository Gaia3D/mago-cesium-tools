export class VertexBufferObject {
    constructor() {
        /**
         * Array of positions for the vertices in Cartesian coordinates.
         * @type {Array<number>}
         */
        this.positions = null;

        /**
         * Array of normals for the vertices, represented as 3D vectors.
         * @type {Array<number>}
         */
        this.normals = null;

        /**
         * Array of colors for the vertices, represented as RGBA values.
         * @type {Array<number>}
         */
        this.colors = null;

        /**
         * Array of texture coordinates for the vertices.
         * @type {Array<number>}
         */
        this.uvs = null;

        /**
         * Array of indices for the vertices, defining the order in which they are connected.
         * @type {Array<number>}
         */
        this.indices = null;
    }

    setPositions(positions) {
        this.positions = positions;
    }

    setNormals(normals) {
        this.normals = normals;
    }

    setColors(colors) {
        this.colors = colors;
    }

    setUvs(uvs) {
        this.uvs = uvs;
    }

    setIndices(indices) {
        this.indices = indices;
    }

    addVbo(vbo) {
        if (this.positions === null) {
            this.positions = [];
        }
        const positionsCount = this.positions.length;
        const elementsCount = positionsCount / 3;

        if (vbo.positions !== undefined && vbo.positions !== null && vbo.positions.length > 0) {
            this.positions.push(...vbo.positions);
        }

        if (vbo.normals !== undefined && vbo.normals !== null && vbo.normals.length > 0) {
            if (this.normals === null) {
                this.normals = [];
            }
            this.normals.push(...vbo.normals);
        }

        if (vbo.colors !== undefined && vbo.colors !== null && vbo.colors.length > 0) {
            if (this.colors === null) {
                this.colors = [];
            }
            this.colors.push(...vbo.colors);
        }

        if (vbo.uvs !== undefined && vbo.uvs !== null && vbo.uvs.length > 0) {
            if (this.uvs === null) {
                this.uvs = [];
            }
            this.uvs.push(...vbo.uvs);
        }

        if (vbo.indices !== undefined && vbo.indices !== null && vbo.indices.length > 0) {
            if (this.indices === null) {
                this.indices = [];
            }
            const indicesCount = this.indices.length;
            for (let i = 0; i < vbo.indices.length; i++) {
                this.indices.push(vbo.indices[i] + elementsCount);
            }
        }

    }
}