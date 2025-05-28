import * as Cesium from "cesium";
import camera from "@/assets/camera.glb";

/**
 * SubViewer
 */
export class SubViewer {
    constructor(refViewer) {
        this.refViewer = refViewer;
        this.cesiumContainer = undefined;
        this.viewer = undefined;
        this.isSync = true;
        this.isLookAtCamera = false;

        this.refCameraModel = undefined;
        this.cameraModel = undefined;
        this.init();
    }

    init() {
        this.clear();
        // invisible the default cesium viewer

        let width = window.innerWidth;
        let height = window.innerHeight;
        let minWidth = width / 3;
        let minHeight = height / 3;

        // random id
        const randomId = "container-" + Math.floor(Math.random() * 1000000);
        this.cesiumContainer = document.createElement("div");
        this.cesiumContainer.id = randomId;
        //this.cesiumContainer.display = "none";
        this.cesiumContainer.style.position = "absolute";
        this.cesiumContainer.style.top = "0px";
        this.cesiumContainer.style.right = "0px";
        this.cesiumContainer.style.width = minWidth + "px";
        this.cesiumContainer.style.height = minHeight + "px";
        this.cesiumContainer.style.zIndex = "9999";
        document.body.appendChild(this.cesiumContainer);

        this.viewer = new Cesium.Viewer(randomId, {
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
            sceneMode: Cesium.SceneMode.SCENE3D,
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
        //console.log("positionWC", refCamera.positionWC);
        //console.log("viewMatrix", this.refViewer.camera.viewMatrix);
        //console.log("modelMatrix", modelMatrix);
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

        // 3. target 위치에서의 ENU 좌표계
        const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(targetPos);

        // 4. ENU 행렬에서 기본 축 추출
        const xAxis = Cesium.Matrix4.getColumn(enuTransform, 0, new Cesium.Cartesian3()); // east → right
        const yAxis = Cesium.Matrix4.getColumn(enuTransform, 1, new Cesium.Cartesian3()); // north → up
        const zAxis = Cesium.Matrix4.getColumn(enuTransform, 2, new Cesium.Cartesian3()); // up → back (보정 필요)

        // direction: refCamera를 바라보는 방향
        const direction = Cesium.Cartesian3.subtract(refPos, targetPos, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(direction, direction);

        // 기존 up에서 roll 없이 새 방향에 맞는 up을 투영
        //const tempUp = Cesium.Cartesian3.clone(refCamera.up);

        // up 벡터를 direction에 직교하도록 정리
        const right = Cesium.Cartesian3.cross(direction, zAxis, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(right, right);

        const up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(up, up);

        // 최종 적용
        targetCamera.direction = direction;
        targetCamera.up = up;
        targetCamera.right = right;
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