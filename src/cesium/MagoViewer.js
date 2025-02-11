import { Viewer, Entity, Cartesian3, Color } from "cesium";

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

    addPoint(longitude, latitude) {
        this.viewer.entities.add(
            new Entity({
                position: Cartesian3.fromDegrees(longitude, latitude),
                point: {
                    pixelSize: 5,
                    color: Color.RED
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
    sample(count) {
        for (let i = 0; i < count; i++) {
            // random points
            let randomX = (Math.random() * 360) - 180;
            let randomY = (Math.random() * 180) - 90;
            this.viewer.entities.add(
            new Entity({
                position: Cartesian3.fromDegrees(randomX, randomY),
                point: {
                    pixelSize: 5,
                    color: Color.BLUE
                },
            })
            );
        }
    }

    destroy() {
        this.viewer.destroy();
    }
}