import { Viewer, Entity, Cartesian3, Color } from "cesium";
import * as Cesium from 'cesium'

/**
 * MagoViewer is a class that creates a viewer to render points on a globe.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoViewer = new MagoViewer(viewer);
 * magoViewer.sample(100);
 */
export class MagoViewer {
    constructor(viewer) {
        this.viewer = viewer;
    }

    /**
     * Initializes the viewer to render points on a globe.
     * @function
     * @returns {void}
     */
    init() {
        const initPosition = Cesium.Cartesian3.fromDegrees(0, 0, 1000);
        this.viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#111133");
        /*this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(initPosition.x, initPosition.y, initPosition.z),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0)
            },
            duration: 0
        })*/
        const grid = new Cesium.GridImageryProvider({
            cells: 8,
            color : Cesium.Color.WHITE.withAlpha(0.25),
            glowColor : Cesium.Color.BLACK.withAlpha(0.0),
            glowWidth : 4,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.05),
            maximumLevel: 5
        })
        this.viewer.scene.imageryLayers.addImageryProvider(grid)
    }

    /**
     * Adds a point to the globe.
     * @param cssColor - CSS color string (e.g., "#ff0000")
     */
    addRandomPoint(cssColor = "#ff0000") {
        let randomX = (Math.random() * 360) - 180;
        let randomY = (Math.random() * 180) - 90;
        this.viewer.entities.add(
            new Entity({
                position: Cartesian3.fromDegrees(randomX, randomY),
                point: {
                    pixelSize: 3,
                    color: Color.fromCssColorString(cssColor)
                },
            })
        );
    }

    /**
     * Samples random points on the globe.
     * @param count
     * @function
     * @returns {void}
     */
    addRandomPoints(count, cssColor = "#0000ff") {
        for (let i = 0; i < count; i++) {
            this.addRandomPoint(cssColor);
        }
    }

    destroy() {
        this.viewer.destroy();
    }
}