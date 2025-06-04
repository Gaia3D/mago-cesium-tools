export class ObjectController {
    constructor(viewer: any, options?: {});
    viewer: any;
    scene: any;
    handler: Cesium.ScreenSpaceEventHandler;
    movePickedObject: any;
    moveTempStyle: any;
    currentPickedObject: any;
    infomation: any[];
    selectionColor: any;
    translator: any;
    rotator: any;
    scaler: any;
    selectCallback: any;
    /**
     * Selects an object from the tileset.
     * @param tileset {Cesium.Cesium3DTileset} The tileset from which to select the object.
     */
    selectObject: (tileset: Cesium.Cesium3DTileset) => void;
    getPickedObject(): any;
    getInformation(selectedObject: any): void;
    offAll: () => void;
    translate: () => void;
    rotate: () => void;
    scale: () => void;
    /**
     * Enables the position measurement tool.
     * Click to start measuring
     * @function
     * @returns {void}
     */
    on: () => void;
    clear: () => void;
    off: () => void;
}
import * as Cesium from "cesium";
