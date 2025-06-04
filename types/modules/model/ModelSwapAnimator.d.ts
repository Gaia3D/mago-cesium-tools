export class ModelSwapAnimator {
    /**
     * Constructor for the ModelSwapAnimator class.
     * @constructor
     * @param viewer Cesium Viewer instance.
     * @param options
     */
    constructor(viewer: any, options: any);
    viewer: any;
    options: any;
    center: any;
    currentModel: Cesium.Model;
    loadModel(url: any, maxValue?: number): Promise<void>;
}
import * as Cesium from "cesium";
