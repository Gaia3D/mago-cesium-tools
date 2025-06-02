import * as Cesium from "cesium";

export class Rotator {
    constructor(viewer, handler = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = handler;

        this.flag = false;
    }

    on = (currentPickedObject) => {
        if (!currentPickedObject) {
            console.warn("No object selected for translation.");
            return;
        }
        console.log("Rotator");

        this.scene.canvas.style.cursor = "crosshair";
        const viewer = this.viewer;
        const scene = viewer.scene;
        const handler = this.handler;

        const mouseLeftDownClickHandler = (event) => {
            const tempPickedObject = scene.pick(event.position);

            if (!currentPickedObject && !Cesium.defined(currentPickedObject)) {
                return;
            }

            const is3DTileFeature = tempPickedObject instanceof Cesium.Cesium3DTileFeature && tempPickedObject instanceof Cesium.Cesium3DTileFeature;
            const is3DModelFeature = tempPickedObject instanceof Cesium.Model3DTileContent && tempPickedObject?.content instanceof Cesium.Model3DTileContent;
            if (is3DTileFeature && currentPickedObject === tempPickedObject.tileset) {
                this.flag = true;
            } else if (is3DModelFeature && currentPickedObject === tempPickedObject.content.tileset) {
                this.flag = true;
            }

            if (this.flag && currentPickedObject) {
                scene.screenSpaceCameraController.enableRotate = false;
                scene.screenSpaceCameraController.enableTranslate = false;
                scene.screenSpaceCameraController.enableZoom = false;
                scene.screenSpaceCameraController.enableTilt = false;
                scene.screenSpaceCameraController.enableLook = false;
            }
        };

        const mouseLeftUpClickHandler = () => {
            this.flag = false;
            if (!currentPickedObject && !Cesium.defined(currentPickedObject)) {
                return;
            }
            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;
        };

        const mouseMoveHandler = (moveEvent) => {
            if (!currentPickedObject && !Cesium.defined(currentPickedObject)) {
                return;
            }
            if (!this.flag) {
                return;
            }

            const xOffset = moveEvent.endPosition.x - moveEvent.startPosition.x;
            const yOffset = moveEvent.endPosition.y - moveEvent.startPosition.y;

            let offset;
            if (Math.abs(xOffset) > Math.abs(yOffset)) {
                offset = xOffset;
            } else {
                offset = -yOffset;
            }

            const boundingSphere = currentPickedObject?.boundingSphere;
            const center = boundingSphere?.center ? boundingSphere.center : currentPickedObject._boundingSphereWC[0].center;
            const ellipsoid = viewer.scene.globe.ellipsoid;
            const computedTransformMatrix = Cesium.Transforms.northUpEastToFixedFrame(center, ellipsoid, new Cesium.Matrix4());

            const modelMatrix = currentPickedObject.modelMatrix;

            const translate = new Cesium.Cartesian3(computedTransformMatrix[12], computedTransformMatrix[13], computedTransformMatrix[14]);
            const translateNegate = Cesium.Cartesian3.negate(translate, new Cesium.Cartesian3());

            const translationMatrix = Cesium.Matrix4.fromTranslation(translate);
            const translationMatrixNegate = Cesium.Matrix4.fromTranslation(translateNegate);

            const axis = new Cesium.Cartesian3(computedTransformMatrix[4], computedTransformMatrix[5], computedTransformMatrix[6]);

            const angle = Cesium.Math.toRadians(offset / (boundingSphere.radius / 100.0));
            const quaternion = Cesium.Quaternion.fromAxisAngle(axis, angle, new Cesium.Quaternion());

            const rotationMatrix3 = Cesium.Matrix3.fromQuaternion(quaternion, new Cesium.Matrix3());
            const rotationMatrix4 = Cesium.Matrix4.fromRotation(rotationMatrix3, new Cesium.Matrix4());

            let transformedMatrix = modelMatrix.clone();
            transformedMatrix = Cesium.Matrix4.multiply(translationMatrixNegate, transformedMatrix, new Cesium.Matrix4());
            transformedMatrix = Cesium.Matrix4.multiply(rotationMatrix4, transformedMatrix, new Cesium.Matrix4());
            transformedMatrix = Cesium.Matrix4.multiply(translationMatrix, transformedMatrix, new Cesium.Matrix4());

            currentPickedObject.modelMatrix = transformedMatrix;
        };
        handler.setInputAction(mouseLeftDownClickHandler, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.setInputAction(mouseLeftUpClickHandler, Cesium.ScreenSpaceEventType.LEFT_UP);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

    off = () => {
        this.scene.canvas.style.cursor = "default";
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
        }
    };
}

