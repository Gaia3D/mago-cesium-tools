import * as Cesium from "cesium";
import camera from "@/assets/camera.glb";

/**
 * SubViewer
 */
export class SubViewer {
    constructor(refViewer, cesiumContainer) {
        this.refViewer = refViewer;
        this.cesiumContainer = cesiumContainer;
        this.viewer = undefined;
        this.isShow = false;
        this.isSync = false;
        this.isLookAtCamera = false;

        this.refCameraModel = undefined;
        this.cameraModel = undefined;
    }

    createCesiumContainer() {
        let minWidth = 400;
        let minHeight = 300;
        const randomId = "container-" + Math.floor(Math.random() * 1000000);
        this.cesiumContainer = document.createElement("div");
        this.cesiumContainer.id = randomId;
        if (this.isShow) {
            this.cesiumContainer.style.zIndex = "9999";
        } else {
            this.cesiumContainer.style.zIndex = "-1";
        }
        this.cesiumContainer.style.position = "absolute";
        this.cesiumContainer.style.top = "5px";
        this.cesiumContainer.style.right = "5px";
        this.cesiumContainer.style.width = minWidth + "px";
        this.cesiumContainer.style.height = minHeight + "px";
        this.cesiumContainer.style.border = "1px solid #000";
        this.cesiumContainer.style.borderRadius = "5px";
        this.cesiumContainer.style.overflow = "hidden";
        this.cesiumContainer.style.zIndex = "9999";
        document.body.appendChild(this.cesiumContainer);
    }

    init() {
        let minWidth = 400;
        let minHeight = 300;

        if (!this.cesiumContainer) {
            this.createCesiumContainer();
        }

        this.viewer = new Cesium.Viewer(this.cesiumContainer.id, {
            geocoder: false,
            baseLayerPicker: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            animation: false,
            timeline: false,
            navigationHelpButton: false,
            selectionIndicator: false,
            fullscreenButton: false,
            baseLayer: false,
            //sceneMode: Cesium.SceneMode.SCENE3D,
            selectedEntity: undefined,
            selectedEntityChanged: undefined,
            selectedEntityChangedEvent: undefined,
            selectedEntityChangedEventArgs: undefined,
        });
        this.viewer.scene.globe.depthTestAgainstTerrain = true;
        this.viewer.scene.logarithmicDepthBuffer = true;

        const refCamera = this.refViewer.camera;
        refCamera.percentageChanged = 0.01;
        this.viewer.scene.screenSpaceCameraController.enableRotate = false;
        this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
        this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        this.viewer.scene.screenSpaceCameraController.enableTilt = false;
        this.viewer.scene.screenSpaceCameraController.enableLook = false;
        this.viewer.scene.screenSpaceCameraController.enableInputs = false;
        this.viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
        this.viewer._cesiumWidget._creditContainer.style.display = "none";

        let modelMatrix = Cesium.Matrix4.inverse(this.refViewer.camera.viewMatrix, new Cesium.Matrix4());
        modelMatrix = this.finalModelMatrix(modelMatrix);

        Cesium.Model.fromGltfAsync({
            url: camera,
            modelMatrix: modelMatrix,
            scale: 1.0,
            shadows: Cesium.ShadowMode.DISABLED,
            minimumPixelSize: 16,
            allowPicking: false,
            show: false,
        }).then((model) => {
            console.log("targetModel", model);
            this.cameraModel = model;
            this.refViewer.scene.primitives.add(model);
        });

        Cesium.Model.fromGltfAsync({
            url: camera,
            modelMatrix: modelMatrix,
            scale: 1.0,
            shadows: Cesium.ShadowMode.DISABLED,
            minimumPixelSize: 16,
            allowPicking: false,
            show: false,
        }).then((model) => {
            console.log("refModel", model);
            this.refCameraModel = model;
            this.viewer.scene.primitives.add(model);
        });

        this.refViewer.camera.changed.addEventListener(this.syncCamera, this);
    }

    clear() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = undefined;
        }
        if (this.cesiumContainer) {
            this.cesiumContainer.remove();
            this.cesiumContainer = undefined;
        }
    }

    takeScreenshot() {
        this.viewer.render();
        let image = this.viewer.canvas.toDataURL();
        let aLink = document.createElement("a");
        aLink.download = "map.png";
        aLink.href = image;
        aLink.click();
    }

    getCameraModelMatrix(camera) {
        const position = camera.positionWC;
        const direction = camera.directionWC;
        const up = camera.upWC;
        const right = camera.rightWC;

        return new Cesium.Matrix4(
            right.x, up.x, -direction.x, 0,
            right.y, up.y, -direction.y, 0,
            right.z, up.z, -direction.z, 0,
            position.x, position.y, position.z, 1,
        );
    }

    // lookAtReference() {
    lookAtCamera() {
        if (!this.refViewer || !this.viewer) {
            return;
        }

        const refCamera = this.refViewer.camera;
        const targetCamera = this.viewer.camera;

        const targetPos = targetCamera.positionWC;
        const refPos = refCamera.positionWC;

        if (Cesium.Cartesian3.equals(targetPos, refPos)) {
            //console.warn("Target camera position is the same as reference camera position. No adjustment needed.");
            return;
        }

        const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(targetPos);
        //const xAxis = Cesium.Matrix4.getColumn(enuTransform, 0, new Cesium.Cartesian3()); // east → right
        //const yAxis = Cesium.Matrix4.getColumn(enuTransform, 1, new Cesium.Cartesian3()); // north → up
        const zAxis = Cesium.Matrix4.getColumn(enuTransform, 2, new Cesium.Cartesian3()); // up → back (보정 필요)

        const direction = Cesium.Cartesian3.subtract(refPos, targetPos, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(direction, direction);

        const right = Cesium.Cartesian3.cross(direction, zAxis, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(right, right);

        const up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(up, up);

        // 최종 적용
        targetCamera.direction = direction;
        targetCamera.up = up;
        targetCamera.right = right;
    }

    toggleShow() {
        this.isShow = !this.isShow;
        if (this.isShow) {
            //this.cesiumContainer.style.display = "block";
            this.cesiumContainer.style.zIndex = "9999";
        } else {
            //this.cesiumContainer.style.display = "none"
            this.cesiumContainer.style.zIndex = "-1";
        }
    }

    setLookAtCamera() {
        this.isLookAtCamera = !this.isLookAtCamera;

        if (this.isLookAtCamera) {
            this.lookAtCamera();
        }
    }

    setSync() {
        this.isSync = !this.isSync;

        if (this.isSync) {
            this.syncCamera();
        }
    }

    yUpToZUp() {
        return Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(-90)));
    }

    finalModelMatrix(modelMatrix) {
        return Cesium.Matrix4.multiply(
            modelMatrix,
            this.yUpToZUp(),
            new Cesium.Matrix4(),
        );
    }

    syncCamera() {
        if (!this.refViewer || !this.viewer) {
            return;
        }

        if (this.isLookAtCamera) {
            this.lookAtCamera();
        }

        if (this.isSync) {
            const refViewer = this.refViewer;
            const target = this.viewer;
            target.camera.setView({
                destination: refViewer.camera.position,
                orientation: {
                    heading: refViewer.camera.heading,
                    pitch: refViewer.camera.pitch,
                    roll: refViewer.camera.roll,
                },
            });

            if (this.cameraModel) {
                let modelMatrix = Cesium.Matrix4.inverse(this.viewer.camera.viewMatrix, new Cesium.Matrix4());
                modelMatrix = this.finalModelMatrix(modelMatrix);
                this.cameraModel.modelMatrix = modelMatrix;
                this.cameraModel.show = false;
            }
            if (this.refCameraModel) {
                let modelMatrix = Cesium.Matrix4.inverse(this.refViewer.camera.viewMatrix, new Cesium.Matrix4());
                modelMatrix = this.finalModelMatrix(modelMatrix);
                this.refCameraModel.modelMatrix = modelMatrix;
                this.refCameraModel.show = false;
            }
        } else {
            if (this.cameraModel) {
                let modelMatrix = Cesium.Matrix4.inverse(this.viewer.camera.viewMatrix, new Cesium.Matrix4());
                modelMatrix = this.finalModelMatrix(modelMatrix);
                this.cameraModel.modelMatrix = modelMatrix;
                this.cameraModel.show = true;
            }
            if (this.refCameraModel) {
                let modelMatrix = Cesium.Matrix4.inverse(this.refViewer.camera.viewMatrix, new Cesium.Matrix4());
                modelMatrix = this.finalModelMatrix(modelMatrix);
                this.refCameraModel.modelMatrix = modelMatrix;
                this.refCameraModel.show = true;
            }
        }
    }
}