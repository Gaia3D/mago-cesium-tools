import * as Cesium from "cesium";

export class ModelSwapAnimator {

    /**
     * Constructor for the ModelSwapAnimator class.
     * @constructor
     * @param viewer Cesium Viewer instance.
     * @param options
     */
    constructor(viewer, options) {
        this.viewer = viewer;
        this.options = options || {};
        this.center = options.center || Cesium.Cartesian3.fromDegrees(127.3839550536586, 36.46552371257934);
        this.currentModel = null;
    }

    async loadModel(url, maxValue = 1.0) {
        const viewer = this.viewer;

        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.center);
        const model = await Cesium.Model.fromGltfAsync({
            url: url,
            modelMatrix: modelMatrix,
            upAxis: Cesium.Cartesian3.UNIT_Z,
            forwardAxis: Cesium.Cartesian3.UNIT_X,
            //show: false,
        });

        const customShader = new Cesium.CustomShader({
            lightingModel: Cesium.LightingModel.UNLIT,
            uniforms: {
                u_maxValue: {
                    type: Cesium.UniformType.FLOAT,
                    value: maxValue,
                },
            },
            fragmentShaderText: `
              //uniform float u_maxValue;
            
              float linearOpacity(float value) {
                float minValue = 0.0;
                float maxValue = u_maxValue;
                float opacity = (value - minValue) / (maxValue - minValue);
                return clamp(opacity, 0.0, 1.0);
              }
            
              vec3 colorRamp(vec3 color1, vec3 color2, vec3 color3, float value) {
                float minValue = 0.0;
                float maxValue = u_maxValue;
                vec3 finalColor;
                if (value <= minValue) {
                    finalColor = color1;
                } else if (value >= maxValue) {
                    finalColor = color3;
                } else {
                    float mid = (minValue + maxValue) * 0.5;
            
                    if (value < mid) {
                        float t = (value - minValue) / (mid - minValue);
                        finalColor = mix(color1, color2, t);
                    } else {
                        float t = (value - mid) / (maxValue - mid);
                        finalColor = mix(color2, color3, t);
                    }
                }
                return finalColor;
              }
            
              float unpackDepth(const in vec4 rgba_depth) {
                return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
              }
            
              float decode2(vec4 color) {
                return color.r * 256.0 * 256.0 * 256.0 +
                       color.g * 256.0 * 256.0 +
                       color.b * 256.0 +
                       color.a;
              }
              
              float decode(vec4 color) {
                return color.a * 256.0 * 256.0 * 256.0 +
                       color.b * 256.0 * 256.0 +
                       color.g * 256.0 +
                       color.r;
              }
              
              void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec4 color = vec4(material.diffuse, material.alpha);
                
                float value = unpackDepth(color);

                vec3 color1 = vec3(1.0, 0.0, 0.0);
                vec3 color2 = vec3(0.0, 1.0, 0.0);
                vec3 color3 = vec3(0.0, 0.0, 1.0);
                
                material.diffuse = colorRamp(color3, color2, color1, value);
                material.alpha = linearOpacity(value);
              }
            `,
        });
        model.customShader = customShader;

        viewer.scene.primitives.add(model);

        model.readyEvent.addEventListener(() => {

            const currentModel = this.currentModel;
            if (currentModel) {
                viewer.scene.primitives.remove(currentModel);
            }
            this.currentModel = model;

            /*const boundingSphere = model.boundingSphere;
            viewer.camera.flyTo({
                destination: boundingSphere.center, duration: 1.0, complete: () => {
                    console.log("Camera fly completed");
                },
            });*/
        });

        /*const currentModel = this.currentModel;
        if (currentModel) {
            viewer.scene.primitives.remove(currentModel);
        }
        this.currentModel = model;*/
    }
}