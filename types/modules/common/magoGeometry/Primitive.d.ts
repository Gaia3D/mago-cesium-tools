/**
 * Primitive class represents a geometric primitive composed of multiple surfaces.
 * It provides methods to manage surfaces, calculate normals, and retrieve vertex buffer objects (VBOs).
 * This class is used in 3D rendering applications to handle complex geometries efficiently.
 * @class Primitive
 */
export class Primitive {
    /**
     * Array of surfaces that compose this primitive.
     * @type {Array<Surface>}
     */
    surfaces: Array<Surface>;
    /**
     * Adds a surface to the primitive.
     * @param surface
     */
    addSurface(surface: any): void;
    /**
     * Calculates the normals for each face in all surfaces of the primitive.
     * This method iterates through all the surfaces and calls their `calculateFacesNormals` method.
     */
    calculateFacesNormals(): void;
    /**
     * Calculates the triangle indices for each face in all surfaces of the primitive.
     * This method iterates through all the surfaces and calls their `calculateFacesTriangleIndices` method.
     */
    calculateFacesTriangleIndices(): void;
    /**
     * Returns the number of surfaces in the primitive.
     * @returns {VertexBufferObject|undefined}
     */
    getVbo(): VertexBufferObject | undefined;
    /**
     * Sets the vertex normals for each vertex in all surfaces of the primitive
     */
    setVertexNormalFromFaceNormal(): void;
}
import { VertexBufferObject } from "../magoVbo/VertexBufferObject.js";
