import * as Cesium from "cesium";

export class Vertex {

    /**
     * Vertex class for Mago3D geometry.
     * @constructor
     */
    constructor() {
        /**
         * Position of the vertex in Cartesian coordinates.
         * @type {Cesium.Cartesian3}
         */
        this.position = undefined;

        /**
         * Normal vector of the vertex.
         * @type {Cesium.Cartesian3}
         */
        this.normal = undefined;

        /**
         * Color of the vertex.
         * @type {Cesium.Color}
         */
        this.color = undefined;

        /**
         * Texture coordinates of the vertex.
         * @type {Cesium.Cartesian2}
         */
        this.texCoord = undefined;

        /**
         * Index of the vertex in the geometry.
         * @type {number}
         */
        this.index = undefined;
    }

    /**
     * Sets the position of the vertex.
     * @param px position x component
     * @param py position y component
     * @param pz position z component
     */
    setPosition(px, py, pz) {
        if (this.position === undefined) {
            this.position = new Cesium.Cartesian3();
        }
        this.position.x = px;
        this.position.y = py;
        this.position.z = pz;
    }

    /**
     * Sets the normal vector of the vertex.
     * @param nx normal x component
     * @param ny normal y component
     * @param nz normal z component
     */
    setNormal(nx, ny, nz) {
        if (this.normal === undefined) {
            this.normal = new Cesium.Cartesian3();
        }
        this.normal.x = nx;
        this.normal.y = ny;
        this.normal.z = nz;
    }

    /**
     * Sets the color of the vertex.
     * @param red
     * @param green
     * @param blue
     * @param alpha
     */
    setColor(red, green, blue, alpha = 1.0) {
        if (this.color === undefined) {
            this.color = new Cesium.Color();
        }
        this.color.red = red;
        this.color.green = green;
        this.color.blue = blue;
        this.color.alpha = alpha;
    }

    /**
     * Sets the texture coordinates of the vertex.
     * @param u texture coordinate u component
     * @param v texture coordinate v component
     */
    setTexCoord(u, v) {
        if (this.texCoord === undefined) {
            this.texCoord = new Cesium.Cartesian2();
        }
        this.texCoord.x = u;
        this.texCoord.y = v;
    }

    /**
     * Clones the vertex, creating a new instance with the same properties.
     * @returns {Vertex}
     */
    clone() {
        const vertex = new Vertex();
        if (this.position !== undefined) {
            vertex.position = this.position.clone();
        }
        if (this.normal !== undefined) {
            vertex.normal = this.normal.clone();
        }
        if (this.color !== undefined) {
            vertex.color = this.color.clone();
        }
        if (this.texCoord !== undefined) {
            vertex.texCoord = this.texCoord.clone();
        }
        return vertex;
    }
}