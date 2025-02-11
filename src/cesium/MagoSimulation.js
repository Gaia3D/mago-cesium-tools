import * as Cesium from 'cesium';
import grid from '../assets/128x128.gltf';
import {MagoEdgeRender} from "./MagoEdgeRender.js";

const modelUrl = new URL(grid, import.meta.url).href;

/**
 * MagoSimulation is a class that creates a simulation of a 3D model.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoSimulation = new MagoSimulation(viewer);
 * magoSimulation.init();
 */
export class MagoSimulation {
    constructor(viewer) {
        this.viewer = viewer;
    }

    init() {
        const model = this.viewer.entities.add({
            name: 'Model', position: Cesium.Cartesian3.fromDegrees(0, 0, 0), model: {
                uri: modelUrl, scale: 1.0,
            }
        });

        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0, 0, 10000), orientation: {
                heading: Cesium.Math.toRadians(0.0), pitch: Cesium.Math.toRadians(-90.0)
            }, duration: 0
        });
    }

    outline() {
        setTimeout(() => {
            const magoEdgeRender = new MagoEdgeRender(this.viewer);
            magoEdgeRender.on();
        }, 1000);
    }
}