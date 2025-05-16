/**
 * MeasureMultiDistance class for measuring multi distances in a Cesium viewer.
 * @class MeasureMultiDistance
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @param {boolean} [options.clampToGround] - Whether to clamp the measurement to the ground.
 * @example
 * const measureMultiDistance = new MeasureMultiDistance(viewer, { color: Cesium.Color.RED });
 * measureMultiDistance.on();
 * // To disable the measurement tool and clear entities:
 * measureMultiDistance.off();
 */
export class MeasureMultiDistance {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    clampToGround: any;
    status: boolean;
    cartesians: any[];
    endCartesian: any;
    polylineEntity: any;
    pointEntities: any[];
    /**
     * Enables the measurement tool.
     * Click to start measuring, and click again drawing the lines.
     * Left click to add points, right click to finish.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    pickedObject: any;
    /**
     * Disables the measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
    clearCartesians: () => void;
    calculateDistance: (cartesians: any) => number;
}
import * as Cesium from "cesium";
