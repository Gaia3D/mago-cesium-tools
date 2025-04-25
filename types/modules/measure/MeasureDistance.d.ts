/**
 * MeasureDistance class for measuring distances in a Cesium viewer.
 * This class provides methods to enable and disable the measurement tool,
 * as well as to calculate the distance between points.
 * @class MeasureDistance
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @param {boolean} [options.clampToGround] - Whether to clamp the measurement to the ground.
 * @example
 * const measureDistance = new MeasureDistance(viewer, { color: Cesium.Color.RED });
 * measureDistance.on();
 * // To disable the measurement tool and clear entities:
 * measureDistance.off();
 */
export class MeasureDistance {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    clampToGround: any;
    status: boolean;
    startCartesian: Cesium.Cartesian3;
    endCartesian: Cesium.Cartesian3;
    startEntity: any;
    endEntity: any;
    lineEntity: any;
    /**
     * Enables the distance measurement tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    /**
     * Disables the measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
}
import * as Cesium from "cesium";
