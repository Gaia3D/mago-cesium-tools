/**
 * MeasureHeight class for measuring height in a Cesium viewer.
 * @class MeasureHeight
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @example
 * const measureHeight = new MeasureHeight(viewer, { color: Cesium.Color.RED });
 * measureHeight.on();
 * // To disable the measurement tool and clear entities:
 * measureHeight.off();
 */
export class MeasureHeight {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    status: boolean;
    startHeight: any;
    startCartographic: Cesium.Cartographic;
    startCartesian: any;
    endHeight: any;
    endCartesian: any;
    startEntity: any;
    endEntity: any;
    lineEntity: any;
    /**
     * Enables the height measurement tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    /**
     * Disables the angle measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
}
import * as Cesium from "cesium";
