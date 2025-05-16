/**
 * MeasureAngle class for measuring angles in a Cesium viewer.
 * @class MeasureAngle
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Optional parameters for the measurement.
 * @example
 * const measureAngle = new MeasureAngle(viewer);
 * measureAngle.on();
 * // To disable the measurement tool and clear entities:
 * measureAngle.off();
 */
export class MeasureAngle {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: Cesium.Color;
    status: boolean;
    startCartesian: Cesium.Cartesian3;
    upCartesian: Cesium.Cartesian3;
    endCartesian: Cesium.Cartesian3;
    startEntity: any;
    endEntity: any;
    lineEntity: any;
    verticalLineEntity: any;
    horizontalLineEntity: any;
    /**
     * Enables the measurement tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    highThanUp: boolean;
    /**
     * Disables the measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
}
import * as Cesium from "cesium";
