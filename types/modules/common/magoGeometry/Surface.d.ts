export class Surface {
    /**
     * Array of faces that compose this surface.
     * @type {Array<Face>}
     */
    faces: Array<Face>;
    /**
     * Adds a face to the surface.
     * @param face {Face} The face to be added.
     */
    addFace(face: Face): void;
    /**
     * Calculates the normals for each face in the surface.
     * This method iterates through all the faces and calls their `calculateFaceNormal` method.
     * This is essential for rendering the surface correctly with lighting effects.
     * @returns {void}
     */
    calculateFacesNormals(): void;
    /**
     * Calculates the triangle indices for each face in the surface.
     * This method iterates through all the faces and calls their `calculateTriangleIndices` method.
     * This is essential for rendering the surface correctly with triangle-based rendering.
     * @return {void}
     */
    calculateFacesTriangleIndices(): void;
    /**
     * Returns the number of faces in the surface.
     * @returns {number}
     */
    getFacesCount(): number;
    /**
     * Returns the face at the specified index.
     * @param index
     * @returns {undefined|Face}
     */
    getFace(index: any): undefined | Face;
    /**
     * Returns an array of vertices that compose the surface.
     * @returns {Array<Vertex>} Array of vertices
     */
    getVertices(): Array<Vertex>;
    getVbo(): VertexBufferObject;
    setVertexNormalFromFaceNormal(): void;
}
import { VertexBufferObject } from "../magoVbo/VertexBufferObject.js";
