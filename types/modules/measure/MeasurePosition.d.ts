/**
 * MeasurePosition class for measuring position in a Cesium viewer.
 * @class MeasurePosition
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {string} [options.textFormat] - The format of the measurement text. e.g. "({lon}, {lat}, {height})".
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @example
 * const measurePosition = new MeasurePosition(viewer, { color: Cesium.Color.RED });
 * measurePosition.on();
 * // To disable the measurement tool and clear entities:
 * measurePosition.off();
 */
export class MeasurePosition {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    color: any;
    textFormat: any;
    startHeight: any;
    startCartographic: Cesium.Cartographic;
    startCartesian: any;
    endHeight: any;
    endCartographic: any;
    endCartesian: any;
    startEntity: any;
    endEntity: any;
    entities: any[];
    /**
     * Enables the position measurement tool.
     * Click to start measuring
     * @function
     * @returns {void}
     */
    on: () => void;
    /**
     * Disables the position measurement tool.
     * @function
     * @returns {void}
     */
    off: () => void;
    clearEntities: () => void;
}
import * as Cesium from "cesium";
