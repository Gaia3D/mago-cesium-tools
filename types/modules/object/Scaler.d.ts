export class Scaler {
    constructor(viewer: any, handler?: {});
    viewer: any;
    scene: any;
    handler: {};
    flag: boolean;
    plane: Cesium.Plane;
    on: (currentPickedObject: any) => void;
    off: () => void;
}
import * as Cesium from "cesium";
