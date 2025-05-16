import * as Cesium from "cesium";

/**
 * DrawCircle
 * @class DrawCircle
 */
export class DrawCircle {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = options.color || Cesium.Color.LIGHTGRAY;
        this.clampToGround = options.clampToGround || false;
        this.status = false;
        this.startCartesian = undefined;
        this.endCartesian = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.lineEntity = undefined;
    }

    /**
     * Enables the distance measurement tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on = (isContinue = false) => {
        this.scene.canvas.style.cursor = "crosshair";
        const viewer = this.viewer;
        const scene = viewer.scene;
        const handler = this.handler;
        const mouseLeftClickHandler = (event) => {
            if (!this.status) {
                this.status = true;
                this.clearEntities(viewer);
            } else {
                this.status = false;
                return;
            }

            // const pickedObject = scene.pick(event.position);
            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(
                    event.position);
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    event.position,
                    scene.globe.ellipsoid,
                );
                const cartographic = Cesium.Cartographic.fromCartesian(
                    pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(
                    Cesium.Cartographic.fromRadians(cartographic.longitude,
                        cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(
                    cartographic.longitude, cartographic.latitude, height);
            }

            // fix height to 1.0m
            const manHeight = 0.5;
            const convertCartographic = Cesium.Cartographic.fromCartesian(
                pickedEllipsoidPosition);
            pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(
                convertCartographic.longitude, convertCartographic.latitude,
                convertCartographic.height + manHeight);

            const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));

            this.startCartesian = pickedEllipsoidPosition;
            this.endCartesian = pickedEllipsoidPosition;

            this.startEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                show: false,
            });

            this.lineEntity = viewer.entities.add({
                position: this.startCartesian,
                ellipse: {
                    semiMajorAxis: new Cesium.CallbackProperty(() => {
                        const distance = Cesium.Cartesian3.distance(this.startCartesian, this.endCartesian);
                        if (distance < 0.1) {
                            return 0.1;
                        }
                        return distance;
                    }, false),
                    semiMinorAxis: new Cesium.CallbackProperty(() => {
                        const distance = Cesium.Cartesian3.distance(this.startCartesian, this.endCartesian);
                        if (distance < 0.1) {
                            return 0.1;
                        }
                        return distance;
                    }, false),
                    extrudedHeight: height,
                    height: height,
                    material: this.color.withAlpha(0.5),
                    outline: true,
                    outlineColor: Cesium.Color.WHITE,
                },
            });

            this.endEntity = viewer.entities.add({
                /* @ts-expect-error */
                position: new Cesium.CallbackProperty(() => {
                    const center = Cesium.Cartesian3.add(this.startCartesian,
                        this.endCartesian, new Cesium.Cartesian3());
                    Cesium.Cartesian3.multiplyByScalar(center, 0.5, center);
                    return center;
                }, false),
                label: {
                    showBackground: false,
                    font: "14px monospace",
                    fillColor: this.color,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    /*text: new Cesium.CallbackProperty(() => {
                        let distance = Cesium.Cartesian3.distance(
                            this.startCartesian,
                            this.endCartesian);
                        if (distance > 1000) {
                            distance = `${(distance / 1000).toFixed(3)}km`;
                        } else {
                            distance = `${distance.toFixed(3)}m`;
                        }
                        // const distance = Cesium.Cartesian3.distance(this.startCartesian, this.endCartesian).toFixed(3);
                        return `${distance}`;
                    }, false),*/
                },
            });
        };

        const mouseMoveHandler = (moveEvent) => {
            if (!this.status) {
                return;
            }
            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(
                    moveEvent.endPosition);
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    moveEvent.endPosition,
                    scene.globe.ellipsoid,
                );
                const cartographic = Cesium.Cartographic.fromCartesian(
                    pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(
                    Cesium.Cartographic.fromRadians(cartographic.longitude,
                        cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(
                    cartographic.longitude, cartographic.latitude, height);
            }

            // fix height to 1.0m
            const manHeight = 0.5;
            const convertCartographic = Cesium.Cartographic.fromCartesian(
                pickedEllipsoidPosition);
            pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(
                convertCartographic.longitude, convertCartographic.latitude,
                convertCartographic.height + manHeight);
            this.endCartesian = pickedEllipsoidPosition;
        };

        handler.setInputAction(mouseLeftClickHandler,
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseLeftClickHandler,
            Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        handler.setInputAction(mouseMoveHandler,
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

    /**
     * Disables the measurement tool and clears the entities.
     * @function
     * @returns {void}
     */
    off = () => {
        this.scene.canvas.style.cursor = "default";
        this.status = false;
        this.clearEntities();
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    };

    clearEntities = () => {
        this.viewer.entities.remove(this.lineEntity);
        this.viewer.entities.remove(this.startEntity);
        this.viewer.entities.remove(this.endEntity);
        this.lineEntity = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
    };
}
