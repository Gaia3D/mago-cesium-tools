/**
 * MagoDepth
 * @example
 * const magoDepth = new MagoDepth(viewer);
 * magoDepth.on();
 */
export class MagoDepth {
    constructor(viewer: any);
    viewer: any;
    /**
     * Global configuration options.
     * @typedef {Object} GlobalOptions
     * @property {number} grayScale - Whether to apply grayscale to the depth texture.
     */
    /** @type {GlobalOptions} */
    globalOptions: {
        /**
         * - Whether to apply grayscale to the depth texture.
         */
        grayScale: number;
    };
    composite: Cesium.PostProcessStageComposite;
    customShaderLoader: ShaderLoader;
    /**
     * Initializes the Screen Space Ambient Occlusion effect.
     * @param viewer
     * @returns {Promise<void>}
     */
    init(viewer: any): Promise<void>;
    /**
     * Sets up the Screen Space Ambient Occlusion effect.
     * @param viewer
     * @returns {Promise<void>}
     */
    setup(viewer: any): Promise<void>;
    /**
     * Turns on the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    on(): void;
    /**
     * Turns off the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    off(): void;
    /**
     * Toggles the Screen Space Ambient Occlusion effect on or off.
     * @returns {void}
     */
    toggle(): void;
}
import * as Cesium from "cesium";
import { ShaderLoader } from "../ShaderLoader.js";
