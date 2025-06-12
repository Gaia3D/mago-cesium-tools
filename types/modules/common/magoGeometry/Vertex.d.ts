export class Vertex {
    /**
     * Position of the vertex in Cartesian coordinates.
     * @type {Cesium.Cartesian3}
     */
    position: Cesium.Cartesian3;
    /**
     * Normal vector of the vertex.
     * @type {Cesium.Cartesian3}
     */
    normal: Cesium.Cartesian3;
    /**
     * Color of the vertex.
     * @type {Cesium.Color}
     */
    color: Cesium.Color;
    /**
     * Texture coordinates of the vertex.
     * @type {Cesium.Cartesian2}
     */
    texCoord: Cesium.Cartesian2;
    /**
     * Index of the vertex in the geometry.
     * @type {number}
     */
    index: number;
    /**
     * Sets the position of the vertex.
     * @param px position x component
     * @param py position y component
     * @param pz position z component
     */
    setPosition(px: any, py: any, pz: any): void;
    /**
     * Sets the normal vector of the vertex.
     * @param nx normal x component
     * @param ny normal y component
     * @param nz normal z component
     */
    setNormal(nx: any, ny: any, nz: any): void;
    /**
     * Sets the color of the vertex.
     * @param red
     * @param green
     * @param blue
     * @param alpha
     */
    setColor(red: any, green: any, blue: any, alpha?: number): void;
    /**
     * Sets the texture coordinates of the vertex.
     * @param u texture coordinate u component
     * @param v texture coordinate v component
     */
    setTexCoord(u: any, v: any): void;
    /**
     * Clones the vertex, creating a new instance with the same properties.
     * @returns {Vertex}
     */
    clone(): Vertex;
}
import * as Cesium from "cesium";
