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
        this.isSync = false;

        this.refCameraModel = undefined;
        this.cameraModel = undefined;
        this.init();
    }

    init() {
        this.clear();
        // invisible the default cesium viewer

        // random id
        const randomId = "container-" + Math.floor(Math.random() * 1000000);
        this.cesiumContainer = document.createElement("div");
        this.cesiumContainer.id = randomId;
        //this.cesiumContainer.display = "none";
        this.cesiumContainer.style.position = "absolute";
        this.cesiumContainer.style.top = "0px";
        this.cesiumContainer.style.right = "0px";
        this.cesiumContainer.style.width = "800px";
        this.cesiumContainer.style.height = "600px";
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

        if (this.isSync) {
            this.refViewer.camera.changed.addEventListener(this.syncCamera);
        }

        // 카메라의 위치
        //const origin = Cesium.Cartesian3.clone(refCamera.positionWC);

        // 카메라의 방향을 HeadingPitchRoll로 변환
        //const hpr = new Cesium.HeadingPitchRoll(refCamera.heading, refCamera.pitch, refCamera.roll);

        // 모델 매트릭스 계산
        /*let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
            origin,
            hpr,
            Cesium.Ellipsoid.WGS84,
            Cesium.Transforms.eastNorthUpToFixedFrame,
        );*/

        let modelMatrix = Cesium.Matrix4.inverse(this.refViewer.camera.viewMatrix, new Cesium.Matrix4());
        modelMatrix = this.finalModelMatrix(modelMatrix);
        //let modelMatrix = this.getCameraModelMatrix(this.refViewer.camera);
        //modelMatrix = this.finalModelMatrix(modelMatrix);
        console.log("positionWC", refCamera.positionWC);
        console.log("viewMatrix", this.refViewer.camera.viewMatrix);
        console.log("modelMatrix", modelMatrix);
        Cesium.Model.fromGltfAsync({
            url: camera,
            modelMatrix: modelMatrix,
            scale: 1.0,
            shadows: Cesium.ShadowMode.DISABLED,
            minimumPixelSize: 32,
            allowPicking: false,
        }).then((model) => {
            console.log("cameraModel", model);
            this.cameraModel = model;
            this.refViewer.scene.primitives.add(model);
        });
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
        this.isSync = false;
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

    setSync() {
        if (!this.isSync) {
            this.refViewer.camera.changed.addEventListener(this.syncCamera, this);
        } else {
            this.refViewer.camera.changed.removeEventListener(this.syncCamera, this);
        }
        this.isSync = !this.isSync;
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
        console.log("syncCamera");
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
            let modelMatrix = Cesium.Matrix4.inverse(this.refViewer.camera.viewMatrix, new Cesium.Matrix4());
            modelMatrix = this.finalModelMatrix(modelMatrix);
            this.cameraModel.modelMatrix = modelMatrix;
        }

        /*const gltf = await Cesium.Model.fromGltfAsync({
            url: gridModelUrl,
            //url: grid,
            modelMatrix: transform,
            enableDebugWireframe: true,
            debugWireframe: false,
            backFaceCulling: false,
            shadows: Cesium.ShadowMode.RECEIVE_ONLY,
        });
        this.gridPrimitive = gltf;*/
    }
}