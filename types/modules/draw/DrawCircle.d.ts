/**
 * DrawLineString class for drawing a line string in a Cesium viewer.
 * @class DrawLineString
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the line string.
 * @param {boolean} [options.clampToGround] - Whether to clamp the line string to the ground.
 * @example
 * const drawLineString = new DrawLineString(viewer, { color: Cesium.Color.RED });
 * drawLineString.on();
 * // To disable the drawing tool and clear entities
 * drawLineString.off();
 */
export class DrawLineString {
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
     * Enables the line string drawing tool.
     * Left click to add points, right click to finish.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    pickedObject: any;
    /**
     * Disables the drawing tool and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
    clearCartesians: () => void;
}
import * as Cesium from "cesium";
