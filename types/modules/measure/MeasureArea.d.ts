/**
 * MeasureArea class for measuring area in a Cesium viewer.
 * @class MeasureArea
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Optional parameters for the measurement.
 * @example
 * const measureArea = new MeasureArea(viewer, { color: Cesium.Color.RED });
 * measureArea.on();
 * // To disable the measurement tool and clear entities:
 * measureArea.off();
 */
export class MeasureArea {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    clampToGround: any;
    status: boolean;
    cartesians: any[];
    endCartesian: any;
    polygonEntity: any;
    polylineEntity: any;
    pointEntities: any[];
    /**
     * Enables the area measurement tool.
     * Click to start measuring, and click again drawing the polygon.
     * Left click to add points, right click to finish.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    pickedObject: any;
    /**
     * Disables the angle measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
    clearCartesians: () => void;
    calculateArea: (cartesians: any) => string;
}
import * as Cesium from "cesium";
