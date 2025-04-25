/**
 * MagoWind is a class that creates a wind effect.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const windOptions = {
 *     dimension: dimension, // grid count [x,y]
 *     levels: levels, // grid altitude [ (altitude of grid[0]), ... ]
 *     uvws: uvws, // uvw for each grid [ { u:[...], v:[...], w:[...] }, ... ]
 *     boundary: boundary, // lon lat boundary for grid [ [lon, lat](leftlow), (rightlow), (righthigh), (lefthigh) ]
 *     textureSize: 512, // particle count = (textureSize * textureSize)
 *     speedFactor: 500.0, // particle speed factor
 *     renderingType: 'triangle',  // Rendering Type (one of 'point', 'line', 'triangle')
 *     point: {
 *         pointSize: 2,
 *     },
 *     triangle: {
 *         lineWidth: 1000,
 *     }
 * }
 * const magoWind = new MagoWind(viewer);
 * magoWind.init(options);
 */
export class MagoWind {
    /**
     * Minimum trail length
     * @type {number}
     */
    static MIN_TRAIL_LENGTH: number;
    /**
     * Maximum trail length
     * @type {number}
     */
    static MAX_TRAIL_LENGTH: number;
    /**
     * Creates an instance of MagoWind.
     * @param viewer
     */
    constructor(viewer: any, baseUrl?: string);
    /**
     * Cesium Viewer instance
     */
    viewer: any;
    /**
     * Base URL for loading resources
     * @type {string}
     */
    baseUrl: string;
    context: any;
    shaderLoader: any;
    /**
     * Initializes the wind effect.
     * @function
     * @param options
     * @returns {Promise<void>}
     */
    init(options: any): Promise<void>;
    primitiveCollection: Cesium.PrimitiveCollection;
    /**
     * Returns the primitive collection.
     * @returns {Promise<module:cesium.PrimitiveCollection>}
     */
    getPrimitiveCollection(): Promise<NodeJS.Module>;
    /**
     * Creates a texture.
     * @param options
     * @param typedArray
     * @returns {Cesium.Texture}
     */
    createTexture(options: any, typedArray: any): Cesium.Texture;
    getFullscreenQuad(): Cesium.Geometry;
    createFramebuffer(context: any, colorTexture: any, depthTexture: any): any;
    createRawRenderState(options: any): any;
    createPointCloudGeometry(texture: any): Cesium.Geometry;
    createRenderingPoint(context: any, positionTexture: any, colorTexture: any, projectedTexture: any, projectedDepth: any): Promise<RenderPrimitive>;
    createRenderingLine(context: any, trailTextures: any, colorTexture: any, projectedTexture: any, projectedDepth: any): Promise<RenderPrimitive>;
    createRenderingTriangle(viewer: any, context: any, trailTextures: any, colorTexture: any, projectedTexture: any, projectedDepth: any): Promise<RenderPrimitive>;
    createLineStringGeometry(textures: any): Cesium.Geometry;
    createTriangleGeometry(textures: any): Cesium.Geometry;
}
import * as Cesium from "cesium";
import { RenderPrimitive } from "./RenderPrimitive";
