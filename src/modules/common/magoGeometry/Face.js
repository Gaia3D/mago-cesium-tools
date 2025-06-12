import * as Cesium from "cesium";

export class Face {
    constructor(vertices) {
        /**
         * Array of vertices that compose this face.
         * @type {Array<Vertex>}
         */
        this.vertices = [];
        if (vertices) {
            this.vertices = vertices;
        }

        /**
         * Array of indices that compose this face.
         * @type {Array<number>}
         */
        this.indices = [];

        /**
         * The face normal.
         * @type {Cesium.Cartesian3}
         */
        this.faceNormal = undefined;

        /**
         * The face color.
         * @type {Cesium.Color}
         */
        this.faceColor = undefined;
    }

    calculateFaceNormal() {
        const vertexCount = this.vertices.length;
        if (vertexCount < 3) {
            return undefined;
        }

        const v0 = this.vertices[0];
        const v1 = this.vertices[1];
        const v2 = this.vertices[2];

        const a = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(v1.position, v0.position, a);
        const b = new Cesium.Cartesian3();
        Cesium.Cartesian3.subtract(v2.position, v0.position, b);

        const normal = new Cesium.Cartesian3();
        Cesium.Cartesian3.cross(a, b, normal);
        Cesium.Cartesian3.normalize(normal, normal);

        if (this.faceNormal === undefined) {
            this.faceNormal = new Cesium.Cartesian3();
        }
        this.faceNormal.x = normal.x;
        this.faceNormal.y = normal.y;
        this.faceNormal.z = normal.z;
        //this.faceNormal.set(normal.x, normal.y, normal.z);
    }

    /**
     * Sets the face normal.
     * @param nx normal x component
     * @param ny normal y component
     * @param nz normal z component
     */
    setFaceNormal(nx, ny, nz) {
        if (this.faceNormal === undefined) {
            this.faceNormal = new Cesium.Cartesian3();
        }
        this.faceNormal.x = nx;
        this.faceNormal.y = ny;
        this.faceNormal.z = nz;
        //this.faceNormal.set(nx, ny, nz);
    }

    /**
     * Sets the vertex normal from the face normal.
     */
    setVertexNormalFromFaceNormal() {
        const vertexCount = this.vertices.length;
        for (let i = 0; i < vertexCount; i++) {
            const vertex = this.vertices[i];
            if (vertex.normal === undefined) {
                vertex.normal = new Cesium.Cartesian3();
            }
            vertex.normal.x = this.faceNormal.x;
            vertex.normal.y = this.faceNormal.y;
            vertex.normal.z = this.faceNormal.z;
            //vertex.normal.set(this.faceNormal.x, this.faceNormal.y, this.faceNormal.z);
        }
    }

    /**
     * Sets the face color.
     * @param {number} red Red component (0-1)
     * @param {number} green Green component (0-1)
     * @param {number} blue Blue component (0-1)
     * @param {number} [alpha=1.0] Alpha component (0-1)
     */
    setFaceColor(red, green, blue, alpha = 1.0) {
        if (this.faceColor === undefined) {
            this.faceColor = new Cesium.Color();
        }
        this.faceColor.red = red;
        this.faceColor.green = green;
        this.faceColor.blue = blue;
        this.faceColor.alpha = alpha;
        //this.faceColor.set(r, g, b, a);
    }

    /**
     * Calculates the indices of the triangles that compose this face.
     * note: consider that the face is convex
     * and the vertices are ordered in counter-clockwise order
     * @returns {undefined}
     */
    calculateTriangleIndices() {
        const vertexCount = this.vertices.length;
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
            this.indices.push(i + 1);
            this.indices.push(i + 2);
        }
    }

    /**
     * Returns the vertices of this face.
     * @returns {Array<Vertex>} Array of vertices
     */
    getVertices() {
        return this.vertices;
    }

    /**
     * Returns the indices of the triangles that compose this face.
     * @returns {Array<number>} Array of indices
     */
    getIndices() {
        if (this.indices === undefined) {
            this.calculateTriangleIndices();
        }
        return this.indices;
    }
}