export class Face {
    constructor(vertices: any);
    /**
     * Array of vertices that compose this face.
     * @type {Array<Vertex>}
     */
    vertices: Array<Vertex>;
    /**
     * Array of indices that compose this face.
     * @type {Array<number>}
     */
    indices: Array<number>;
    /**
     * The face normal.
     * @type {Cesium.Cartesian3}
     */
    faceNormal: Cesium.Cartesian3;
    /**
     * The face color.
     * @type {Cesium.Color}
     */
    faceColor: Cesium.Color;
    calculateFaceNormal(): any;
    /**
     * Sets the face normal.
     * @param nx normal x component
     * @param ny normal y component
     * @param nz normal z component
     */
    setFaceNormal(nx: any, ny: any, nz: any): void;
    /**
     * Sets the vertex normal from the face normal.
     */
    setVertexNormalFromFaceNormal(): void;
    /**
     * Sets the face color.
     * @param {number} red Red component (0-1)
     * @param {number} green Green component (0-1)
     * @param {number} blue Blue component (0-1)
     * @param {number} [alpha=1.0] Alpha component (0-1)
     */
    setFaceColor(red: number, green: number, blue: number, alpha?: number): void;
    /**
     * Calculates the indices of the triangles that compose this face.
     * note: consider that the face is convex
     * and the vertices are ordered in counter-clockwise order
     * @returns {undefined}
     */
    calculateTriangleIndices(): undefined;
    /**
     * Returns the vertices of this face.
     * @returns {Array<Vertex>} Array of vertices
     */
    getVertices(): Array<Vertex>;
    /**
     * Returns the indices of the triangles that compose this face.
     * @returns {Array<number>} Array of indices
     */
    getIndices(): Array<number>;
}
import * as Cesium from "cesium";
