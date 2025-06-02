import * as Cesium from "cesium";

export class Translator {
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
        console.log("Translator");

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

            let localStartCartesian;
            if (scene.pickPositionSupported) {
                localStartCartesian = viewer.scene.pickPosition(event.position);
            }
            if (!localStartCartesian) {
                localStartCartesian = viewer.camera.pickEllipsoid(event.position, scene.globe.ellipsoid);
            }
            this.startCartesian = localStartCartesian;
            const cameraPosition = viewer.camera.positionWC;

            const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(this.startCartesian);
            const zAxis = Cesium.Matrix4.getColumn(enuTransform, 2, new Cesium.Cartesian3());

            const direction = Cesium.Cartesian3.subtract(cameraPosition, localStartCartesian, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(direction, direction);

            const right = Cesium.Cartesian3.cross(direction, zAxis, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(right, right);

            const up = Cesium.Cartesian3.cross(right, direction, new Cesium.Cartesian3());
            Cesium.Cartesian3.normalize(up, up);

            const originCartographic = Cesium.Cartographic.fromCartesian(localStartCartesian);

            this.verticalPlane = Cesium.Plane.fromPointNormal(localStartCartesian, zAxis, new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0));
            this.horizontalPlane = Cesium.Plane.fromPointNormal(localStartCartesian, direction, new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0));
            this.startHeight = originCartographic.height;

            if (this.flag && currentPickedObject) {
                scene.screenSpaceCameraController.enableRotate = false;
                scene.screenSpaceCameraController.enableTranslate = false;
                scene.screenSpaceCameraController.enableZoom = false;
                scene.screenSpaceCameraController.enableTilt = false;
                scene.screenSpaceCameraController.enableLook = false;
            }
        };

        const mouseLeftUpClickHandler = (event) => {
            this.flag = false;
            if (!currentPickedObject && !Cesium.defined(currentPickedObject)) {
                return;
            }
            this.verticalPlane = undefined;
            this.horizontalPlane = undefined;
            this.startCartesian = undefined;
            this.startHeight = undefined;

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

            const startRay = viewer.camera.getPickRay(moveEvent.startPosition);
            const startIntersection = Cesium.IntersectionTests.rayPlane(startRay, this.verticalPlane, new Cesium.Cartesian3());

            const endRay = viewer.camera.getPickRay(moveEvent.endPosition);
            const endIntersection = Cesium.IntersectionTests.rayPlane(endRay, this.verticalPlane, new Cesium.Cartesian3());

            const translation = Cesium.Cartesian3.subtract(
                endIntersection,
                startIntersection,
                new Cesium.Cartesian3(),
            );

            const modelMatrix = currentPickedObject.modelMatrix;
            const translationMatrix = Cesium.Matrix4.fromTranslation(translation);
            currentPickedObject.modelMatrix = Cesium.Matrix4.multiply(translationMatrix, modelMatrix, new Cesium.Matrix4());
        };

        const mouseMoveWithCtrlHandler = (moveEvent) => {
            if (!currentPickedObject && !Cesium.defined(currentPickedObject)) {
                return;
            }
            if (!this.flag) {
                return;
            }

            const ray = viewer.camera.getPickRay(moveEvent.endPosition);
            const intersection = Cesium.IntersectionTests.rayPlane(ray, this.horizontalPlane, new Cesium.Cartesian3());

            const startMatrix = Cesium.Transforms.northUpEastToFixedFrame(this.startCartesian, Cesium.Ellipsoid.WGS84, new Cesium.Matrix4());
            const inverseMatrix = new Cesium.Matrix4();
            Cesium.Matrix4.inverse(startMatrix, inverseMatrix);

            const startRay = viewer.camera.getPickRay(moveEvent.startPosition);
            const startIntersection = Cesium.IntersectionTests.rayPlane(startRay, this.horizontalPlane, new Cesium.Cartesian3());
            const startRayHeight = -startIntersection.z;
            const startTempHeight = this.startHeight + startRayHeight;

            const endRay = viewer.camera.getPickRay(moveEvent.endPosition);
            const endIntersection = Cesium.IntersectionTests.rayPlane(endRay, this.horizontalPlane, new Cesium.Cartesian3());
            const endRayHeight = -endIntersection.z;
            const endTempHeight = this.startHeight + endRayHeight;

            const intersectionLocal = Cesium.Matrix4.multiplyByPoint(inverseMatrix, intersection, new Cesium.Cartesian3());
            const offsetY = -intersectionLocal.z;

            const startCartographic = Cesium.Cartographic.fromCartesian(this.startCartesian);

            const startHeightPosition = Cesium.Cartesian3.fromRadians(startCartographic.longitude, startCartographic.latitude, startTempHeight);
            const endHeightPosition = Cesium.Cartesian3.fromRadians(startCartographic.longitude, startCartographic.latitude, endTempHeight);

            const translation = Cesium.Cartesian3.subtract(
                startHeightPosition,
                endHeightPosition,
                new Cesium.Cartesian3(),
            );

            const modelMatrix = currentPickedObject.modelMatrix;
            const translationMatrix = Cesium.Matrix4.fromTranslation(translation);
            currentPickedObject.modelMatrix = Cesium.Matrix4.multiply(translationMatrix, modelMatrix, new Cesium.Matrix4());
        };

        handler.setInputAction(mouseLeftDownClickHandler, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.setInputAction(mouseLeftUpClickHandler, Cesium.ScreenSpaceEventType.LEFT_UP);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(mouseLeftDownClickHandler, Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.CTRL);
        handler.setInputAction(mouseLeftUpClickHandler, Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.CTRL);
        handler.setInputAction(mouseMoveWithCtrlHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.CTRL);
    };

    off = () => {
        this.scene.canvas.style.cursor = "default";
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.CTRL);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.KeyboardEventModifier.CTRL);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.KeyboardEventModifier.CTRL);
        }
    };
}

