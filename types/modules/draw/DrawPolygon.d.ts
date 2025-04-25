/**
 * DrawPolygon class for drawing a polygon in a Cesium viewer.
 * @class DrawPolygon
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the polygon.
 * @param {boolean} [options.clampToGround] - Whether to clamp the polygon to the ground.
 * @example
 * const drawPolygon = new DrawPolygon(viewer, { color: Cesium.Color.RED });
 * drawPolygon.on();
 * // To disable the drawing tool and clear entities
 * drawPolygon.off();
 */
export class DrawPolygon {
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
     * Enables the polygon drawing tool.
     * Left click to add points, right click to finish.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on: boolean;
    recentPositions: any[];
    pickedObject: any;
    /**
     * Disables the polygon drawing tool. and clears the entities.
     * @function
     * @returns {void}
     */
    off: () => void;
    /**
     * get position of the polygon
     * @function
     * @returns {Array} cartesians - Array of Cesium.Cartesian3 positions
     */
    getPositions: () => any[];
    clearEntities: () => void;
    clearCartesians: () => void;
}
import * as Cesium from "cesium";
