import * as Cesium from "cesium";
import {ShaderLoader} from "../ShaderLoader.js";

/**
 * MagoDepth
 * @example
 * const magoDepth = new MagoDepth(viewer);
 * magoDepth.on();
 */
export class MagoDepth {
    constructor(viewer) {
        this.viewer = viewer;

        /**
         * Global configuration options.
         * @typedef {Object} GlobalOptions
         * @property {number} grayScale - Whether to apply grayscale to the depth texture.
         */

        /** @type {GlobalOptions} */
        this.globalOptions = {
            grayScale: false,
        };
        this.composite = null;
        this.customShaderLoader = new ShaderLoader("/src/customShaders/render");
        this.init(viewer);
    }

    /**
     * Initializes the Screen Space Ambient Occlusion effect.
     * @param viewer
     * @returns {Promise<void>}
     */
    async init(viewer) {
        if (this.composite) {
            viewer.scene.postProcessStages.remove(this.composite);
            this.composite = null;
        }
        this.composite = null;
        this.setup(viewer);
    }

    /**
     * Sets up the Screen Space Ambient Occlusion effect.
     * @param viewer
     * @returns {Promise<void>}
     */
    async setup(viewer) {
        const globalOptions = this.globalOptions;
        /*const depthFragmentShader = await this.customShaderLoader.getShaderSource(
            "depth-fragment-shader.frag");
        const depthProcess = new Cesium.PostProcessStage({
            fragmentShader: depthFragmentShader,
            inputPreviousStageTexture: true,
            name: "magoDepthTextureForSsao",
        });*/

        const depthGrayFragmentShader = await this.customShaderLoader.getShaderSource(
            "depth-gray-fragment-shader.frag");
        const depthGrayScaleProcess = new Cesium.PostProcessStage({
            fragmentShader: depthGrayFragmentShader,
            inputPreviousStageTexture: false,
            name: "magoDepthGrayTextureForSsao",
            uniforms: {
                grayScale: function() {
                    return globalOptions.grayScale;
                },
            },
        });
        const createdComposite = new Cesium.PostProcessStageComposite({
            name: "depthComposite",
            inputPreviousStageTexture: false,
            stages: [
                //depthProcess,
                depthGrayScaleProcess,
            ],
        });
        viewer.scene.postProcessStages.add(createdComposite);
        this.composite = createdComposite;
        this.off();
    }

    /**
     * Turns on the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    on() {
        if (!this.composite) {
            console.warn("MagoDepth composite is not initialized.");
            return;
        }
        this.composite.enabled = true;
    }

    /**
     * Turns off the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    off() {
        this.composite.enabled = false;
    }

    /**
     * Toggles the Screen Space Ambient Occlusion effect on or off.
     * @returns {void}
     */
    toggle() {
        if (this.composite.enabled) {
            this.off();
        } else {
            this.on();
        }
    }
}