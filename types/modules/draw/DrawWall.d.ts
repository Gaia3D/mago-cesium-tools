/**
 * DrawWall class for drawing a polygon in a Cesium viewer.
 * @class DrawWall
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the polygon.
 * @param {boolean} [options.clampToGround] - Whether to clamp the polygon to the ground.
 * @param {number} [options.gap] - The gap between points in meters.
 * @param {number} [options.height] - The height of the wall in meters.
 * @example
 * const drawWall = new DrawWall(viewer, { color: Cesium.Color.RED });
 * drawWall.on();
 * // To disable the drawing tool and clear entities
 * drawWall.off();
 */
export class DrawWall {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    gap: any;
    wallHeight: any;
    clampToGround: any;
    status: boolean;
    cartesians: any[];
    endCartesian: any;
    polygonEntities: any[];
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
    clearEntities: () => void;
    clearCartesians: () => void;
    calculateArea: (cartesians: any) => string;
}
import * as Cesium from "cesium";
