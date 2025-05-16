/**
 * DrawPoint class for drawing a point in a Cesium viewer.
 * @class drawPoint
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the drawing point.
 * @example
 * const drawPoint = new DrawPoint(viewer, { color: Cesium.Color.RED });
 * drawPoint.on();
 * // To disable the drawing tool and clear entities:
 * drawPoint.off();
 */
export class DrawPoint {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    textFormat: any;
    startHeight: any;
    startCartographic: any;
    startCartesian: any;
    endHeight: any;
    endCartesian: any;
    startEntity: any;
    endEntity: any;
    entities: any[];
    /**
     * Enables the point drawing tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    /**
     * Disables the point drawing tool.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
}
import * as Cesium from "cesium";
