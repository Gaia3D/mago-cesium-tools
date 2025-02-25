import * as Cesium from 'cesium';
import {ShaderLoader} from "./ShaderLoader.js";

/**
 * MagoSSAO is a class that creates a Screen Space Ambient Occlusion effect.
 * @example
 * const magoSsao = new MagoSSAO(viewer);
 * magoSsao.on();
 */
class MagoSSAO {
    constructor(viewer) {
        this.viewer = viewer;
        this.globalOptions = {
            gridSize: 5, // grid size
            threshold: 5, // depth threshold
            intensity: 0.9, // intensity
            radius: 1.0, // radius
        }
        this.composite = null;
        this.customShaderLoader = new ShaderLoader("/src/customShaders");
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
        const depthFragmentShader = await this.customShaderLoader.getShaderSource("depth-fragment-shader.frag");
        const depthProcess = new Cesium.PostProcessStage({
            fragmentShader: depthFragmentShader,
            inputPreviousStageTexture: true,
            name: 'magoDepthTextureForSsao',
        });

        const normalFragmentShader = await this.customShaderLoader.getShaderSource("normal-fragment-shader-ssao.frag");
        const normalProcess = new Cesium.PostProcessStage({
            fragmentShader: normalFragmentShader,
            inputPreviousStageTexture: true,
            name: 'magoNormalTextureForSsao',
        });

        const ssaoFragmentShader = await this.customShaderLoader.getShaderSource("ssao-fragment-shader.frag");
        const ssaoProcess = new Cesium.PostProcessStage({
            fragmentShader: ssaoFragmentShader,
            uniforms: {
                magoNormalTextureForSsao: 'magoNormalTextureForSsao',
                magoDepthTextureForSsao: 'magoDepthTextureForSsao',
                aspectRatio: function () {
                    return viewer.scene.camera.frustum.aspectRatio;
                },
                fovy: function () {
                    return viewer.scene.camera.frustum.fovy;
                },
                tangentOfFovy: function () {
                    return Math.tan(viewer.scene.camera.frustum.fovy / 2);
                },
                near: function () {
                    return viewer.scene.camera.frustum.near;
                },
                far: function () {
                    return viewer.scene.camera.frustum.far;
                },
                uIntensity: function () {
                    return globalOptions.intensity;
                },
                uRadius: function () {
                    return globalOptions.radius;
                }
            }, inputPreviousStageTexture: true, name: 'ssaoTexture'
        });

        const ssaoAntiAliasingFragmentShader = await this.customShaderLoader.getShaderSource("ssao-aa-fragment-shader.frag");
        const ssaoAntiAliasing = new Cesium.PostProcessStage({
            fragmentShader: ssaoAntiAliasingFragmentShader,
            uniforms: {
                ssaoTexture: 'ssaoTexture', magoDepthTextureForSsao: 'magoDepthTextureForSsao', gridSize: function () {
                    return globalOptions.gridSize;
                }, threshold: function () {
                    return globalOptions.threshold;
                },
            }, inputPreviousStageTexture: true, name: 'ssaoAntiAliasingTexture'
        });

        const createdComposite = new Cesium.PostProcessStageComposite({
            name: 'ssaoComposite',
            inputPreviousStageTexture: false,
            stages: [depthProcess, normalProcess, ssaoProcess, ssaoAntiAliasing]
        })
        viewer.scene.postProcessStages.add(createdComposite);
        this.composite = createdComposite;
        this.off();
    }

    /**
     * Turns on the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    on() {
        this.composite.enabled = true;
    }

    /**
     * Turns off the Screen Space Ambient Occlusion effect.
     * @returns {void}
     */
    off() {
        this.composite.enabled = false;
    }
}

export {MagoSSAO};
