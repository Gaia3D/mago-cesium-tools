import * as Cesium from 'cesium';
import grid from '../assets/128x128.gltf';
import tree from '../assets/lowpoly-tree.glb';

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

    createAsset() {
        const model = this.viewer.entities.add({
            name: 'Model', position: Cesium.Cartesian3.fromDegrees(0, 0, 0), model: {
                uri: tree,
                scale: 1.0,
            }
        });
        let hpr = new Cesium.HeadingPitchRange(0.0, -90.0, 0.0);
        this.viewer.zoomTo(model, hpr)
    }
}