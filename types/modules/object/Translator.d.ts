export class Translator {
    constructor(viewer: any, handler?: {});
    viewer: any;
    scene: any;
    handler: {};
    flag: boolean;
    on: (currentPickedObject: any) => void;
    startCartesian: any;
    verticalPlane: Cesium.Plane;
    horizontalPlane: Cesium.Plane;
    startHeight: number;
    off: () => void;
}
import * as Cesium from "cesium";
