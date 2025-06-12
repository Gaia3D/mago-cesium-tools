export class VertexBufferObject {
    /**
     * Array of positions for the vertices in Cartesian coordinates.
     * @type {Array<number>}
     */
    positions: Array<number>;
    /**
     * Array of normals for the vertices, represented as 3D vectors.
     * @type {Array<number>}
     */
    normals: Array<number>;
    /**
     * Array of colors for the vertices, represented as RGBA values.
     * @type {Array<number>}
     */
    colors: Array<number>;
    /**
     * Array of texture coordinates for the vertices.
     * @type {Array<number>}
     */
    uvs: Array<number>;
    /**
     * Array of indices for the vertices, defining the order in which they are connected.
     * @type {Array<number>}
     */
    indices: Array<number>;
    setPositions(positions: any): void;
    setNormals(normals: any): void;
    setColors(colors: any): void;
    setUvs(uvs: any): void;
    setIndices(indices: any): void;
    addVbo(vbo: any): void;
}
