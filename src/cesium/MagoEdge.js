import * as Cesium from 'cesium';
import {ShaderLoader} from "./ShaderLoader.js";

/**
 * MagoEdge is a class that creates a post-process effect to render edges of 3D models.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoEdge = new MagoEdge(viewer);
 * magoEdge.on();
 */
export class MagoEdge {
    constructor(viewer) {
        this.viewer = viewer;
        this.composite = null;
        this.customShaderLoader = new ShaderLoader("/src/customShaders");
        this.init();
    }

    /**
     * Initializes the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     * @example
     * const outlineRender = new MagoEdge(viewer);
     * outlineRender.init();
     * outlineRender.on();
     */
    async init() {
        /* DepthTexture 생성 */

        const depthFragmentShader = await this.customShaderLoader.getShaderSource("depth-fragment-shader.frag");
        console.log(depthFragmentShader);
        const depthProcess = new Cesium.PostProcessStage({
            fragmentShader: depthFragmentShader,
            inputPreviousStageTexture: true,
            name: 'highDepthTexture',
        });

        /* NormalTexture 생성 */
        const normalFragmentShader = await this.customShaderLoader.getShaderSource("normal-fragment-shader.frag");
        const normalProcess = new Cesium.PostProcessStage({
            fragmentShader: normalFragmentShader,
            inputPreviousStageTexture: true,
            name: 'normalTexture',
        });

        /* EdgeTexture 생성 */
        const edgeFragmentShader = await this.customShaderLoader.getShaderSource("edge-fragment-shader.frag");
        const edgeProcess = new Cesium.PostProcessStage({
            fragmentShader: edgeFragmentShader,
            uniforms: {
                normalTexture: 'normalTexture',
                highDepthTexture: 'highDepthTexture',
                edgeWidth : 1.0,
            },
        });
        this.composite = new Cesium.PostProcessStageComposite({
            inputPreviousStageTexture: false,
            stages: [depthProcess, normalProcess, edgeProcess],
        });

        this.viewer.scene.postProcessStages.add(this.composite);
        this.off();
    }

    /**
     * Turns on the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     */
    on() {
        if (this.composite) this.composite.enabled = true;
    }

    /**
     * Turns off the post-process effect to render edges of 3D models.
     * @function
     * @returns {void}
     */
    off() {
        if (this.composite) this.composite.enabled = false;
    }
}