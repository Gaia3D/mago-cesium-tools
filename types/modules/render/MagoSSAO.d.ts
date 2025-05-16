/**
 * MagoSSAO is a class that creates a Screen Space Ambient Occlusion effect.
 * @example
 * const magoSsao = new MagoSSAO(viewer);
 * magoSsao.on();
 */
export class MagoSSAO {
    constructor(viewer: any);
    viewer: any;
    /**
     * Global configuration options.
     * @typedef {Object} GlobalOptions
     * @property {number} gridSize - Grid size of the simulation.
     * @property {number} threshold - Depth threshold for filtering.
     * @property {number} intensity - Effect intensity from 0 to 1.
     * @property {number} radius - Influence radius.
     */
    /** @type {GlobalOptions} */
    globalOptions: {
        /**
         * - Grid size of the simulation.
         */
        gridSize: number;
        /**
         * - Depth threshold for filtering.
         */
        threshold: number;
        /**
         * - Effect intensity from 0 to 1.
         */
        intensity: number;
        /**
         * - Influence radius.
         */
        radius: number;
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
}
import * as Cesium from "cesium";
import { ShaderLoader } from "../ShaderLoader.js";
