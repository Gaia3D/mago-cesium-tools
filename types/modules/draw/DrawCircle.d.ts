/**
 * DrawCircle
 * @class DrawCircle
 */
export class DrawCircle {
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
