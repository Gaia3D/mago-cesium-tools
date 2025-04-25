/**
 * MagoEdge is a class that creates a post-process effect to render edges of 3D models.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoEdge = new MagoEdge(viewer);
 * magoEdge.on();
 */
export class MagoEdge {
    constructor(viewer: any);
    viewer: any;
    composite: Cesium.PostProcessStageComposite;
    customShaderLoader: ShaderLoader;
    /**
     * Initializes the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     * @example
     * const outlineRender = new MagoEdge(viewer);
     * outlineRender.init();
     * outlineRender.on();
     */
    init(): void;
    /**
     * Turns on the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     */
    on(): void;
    /**
     * Turns off the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     */
    off(): void;
}
import * as Cesium from "cesium";
import { ShaderLoader } from "../ShaderLoader.js";
