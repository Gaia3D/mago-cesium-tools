import {MagoVbo} from "../magoVbo/MagoVbo";

export class MagoPrimitive {
    constructor() {
        this.surfaces = [];
    }

    addSurface(surface) {
        this.surfaces.push(surface);
    }

    calculateFacesNormals() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.calculateFacesNormals();
        }
    }

    calculateFacesTriangleIndices() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.calculateFacesTriangleIndices();
        }
    }

    getVbo() {
        if (this.surfaces.length === 0) {
            console.warn("No surfaces available in MagoPrimitive.");
            return undefined;
        }

        let magoVboMaster = new MagoVbo();

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

    setVertexNormalFromFaceNormal() {
        for (let i = 0; i < this.surfaces.length; i++) {
            const surface = this.surfaces[i];
            surface.setVertexNormalFromFaceNormal();
        }
    }
}