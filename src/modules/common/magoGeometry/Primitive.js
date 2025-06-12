import {VertexBufferObject} from "../magoVbo/VertexBufferObject.js";

/**
 * Primitive class represents a geometric primitive composed of multiple surfaces.
 * It provides methods to manage surfaces, calculate normals, and retrieve vertex buffer objects (VBOs).
 * This class is used in 3D rendering applications to handle complex geometries efficiently.
 * @class Primitive
 */
export class Primitive {

    /**
     * Creates an instance of MagoPrimitive.
     */
    constructor() {
        /**
         * Array of surfaces that compose this primitive.
         * @type {Array<Surface>}
         */
        this.surfaces = [];
    }

    /**
     * Adds a surface to the primitive.
     * @param surface
     */
    addSurface(surface) {
        this.surfaces.push(surface);
    }

    /**
     * Calculates the normals for each face in all surfaces of the primitive.
     * This method iterates through all the surfaces and calls their `calculateFacesNormals` method.
     */
    calculateFacesNormals() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.calculateFacesNormals();
        }
    }

    /**
     * Calculates the triangle indices for each face in all surfaces of the primitive.
     * This method iterates through all the surfaces and calls their `calculateFacesTriangleIndices` method.
     */
    calculateFacesTriangleIndices() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.calculateFacesTriangleIndices();
        }
    }

    /**
     * Returns the number of surfaces in the primitive.
     * @returns {VertexBufferObject|undefined}
     */
    getVbo() {
        if (this.surfaces.length === 0) {
            console.warn("No surfaces available in MagoPrimitive.");
            return undefined;
        }

        let magoVboMaster = new VertexBufferObject();

        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            let vbo = surface.getVbo();
            if (vbo === undefined) {
                console.warn("No VBO available in MagoSurface.");
                continue;
            }
            magoVboMaster.addVbo(vbo);
        }

        return magoVboMaster;
    }

    /**
     * Sets the vertex normals for each vertex in all surfaces of the primitive
     */
    setVertexNormalFromFaceNormal() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.setVertexNormalFromFaceNormal();
        }
    }
}