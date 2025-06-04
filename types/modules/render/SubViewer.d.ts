/**
 * SubViewer
 */
export class SubViewer {
    constructor(refViewer: any, cesiumContainer: any);
    refViewer: any;
    cesiumContainer: any;
    viewer: Cesium.Viewer;
    isShow: boolean;
    isSync: boolean;
    isLookAtCamera: boolean;
    refCameraModel: Cesium.Model;
    cameraModel: Cesium.Model;
    createCesiumContainer(): void;
    init(): void;
    clear(): void;
    takeScreenshot(): void;
    getCameraModelMatrix(camera: any): Cesium.Matrix4;
    lookAtCamera(): void;
    toggleShow(): void;
    setLookAtCamera(): void;
    setSync(): void;
    yUpToZUp(): Cesium.Matrix4;
    finalModelMatrix(modelMatrix: any): Cesium.Matrix4;
    syncCamera(): void;
}
import * as Cesium from "cesium";
