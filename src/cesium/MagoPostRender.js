import grid from '../assets/128x128.gltf';
import {OutlineRender} from "./OutlineRender.js";
import {ScreenSpaceOcclusion} from "./ScreenSpaceOcclusion.js";

const modelUrl = new URL(grid, import.meta.url).href;

/**
 * MagoPostRender is a class that creates a post-renderer to render edges of 3D models.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoPostRenderer = new MagoPostRender(viewer);
 * magoPostRenderer.toggleOutline();
 */
export class MagoPostRender {
    constructor(viewer) {
        this.viewer = viewer;
        this.isOutlined = false;
        this.isScreenSpaceOccluion = false;
        this.outlineRender = new OutlineRender(this.viewer);
        this.screenSpaceOcclusion = new ScreenSpaceOcclusion(this.viewer);
    }

    toggleOutline() {
        setTimeout(() => {
            if (this.isOutlined) {
                this.outlineRender.off();
            } else {
                this.outlineRender.on();
            }
            this.isOutlined = !this.isOutlined;
        }, 1000);
    }

    toggleScreenSpaceOcclusion() {
        setTimeout(() => {
            if (this.isScreenSpaceOccluion) {
                this.screenSpaceOcclusion.off();
            } else {
                this.screenSpaceOcclusion.on();
            }
            this.isScreenSpaceOccluion = !this.isScreenSpaceOccluion;
        }, 1000);
    }
}