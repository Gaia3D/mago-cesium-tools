import * as Cesium from "cesium";

/**
 * MeasurePosition class for measuring position in a Cesium viewer.
 * @class MeasurePosition
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {string} [options.textFormat] - The format of the measurement text. e.g. "({lon}, {lat}, {height})".
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @example
 * const measurePosition = new MeasurePosition(viewer, { color: Cesium.Color.RED });
 * measurePosition.on();
 * // To disable the measurement tool and clear entities:
 * measurePosition.off();
 */
export class MeasurePosition {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = options.color || Cesium.Color.LIGHTGRAY;
        this.textFormat = options.textFormat || "({lon}, {lat}, {height})";
        this.startHeight = undefined;
        this.startCartographic = undefined;
        this.startCartesian = undefined;
        this.endHeight = undefined;
        this.endCartographic = undefined;
        this.endCartesian = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.entities = [];
    }

    /**
     * Enables the position measurement tool.
     * Click to start measuring
     * @function
     * @returns {void}
     */
    on = () => {
        this.scene.canvas.style.cursor = "crosshair";
        const viewer = this.viewer;
        const scene = viewer.scene;
        const handler = this.handler;

        // Mouse Left Click
        const mouseLeftClickHandler = (event) => {
            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(event.position);
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.startCartographic = cartographic;
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                this.startHeight = height;
                this.endHeight = height;
            }

            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    event.position,
                    scene.globe.ellipsoid
                );
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.startCartographic = cartographic;
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                this.startHeight = height;
                this.endHeight = height;
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            }
            this.startCartesian = pickedEllipsoidPosition;
            this.endCartesian = pickedEllipsoidPosition;

            const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);

            this.startEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    show: true,
                    showBackground: false,
                    font: "14px monospace",
                    fillColor: this.color,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -30),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    text: new Cesium.CallbackProperty(() => {
                        const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                        let text = this.textFormat;
                        text = text.replace("{lon}", longitude);
                        text = text.replace("{lat}", latitude);
                        text = text.replace("{height}", height.toFixed(3));
                        return text;
                    }, false)
                },
            });

            this.entities.push(this.startEntity);
        };

        // Mouse Move
        const mouseMoveHandler = (moveEvent) => {
            /*if (!this.status) {
                return;
            }*/
            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(moveEvent.endPosition);
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    moveEvent.endPosition,
                    scene.globe.ellipsoid
                );
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            }

            const convertCartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(convertCartographic.longitude, convertCartographic.latitude, convertCartographic.height);
            this.endCartesian = pickedEllipsoidPosition
            this.endHeight = convertCartographic.height;

            if (!this.endEntity) {
                this.endEntity = viewer.entities.add({
                    position: new Cesium.CallbackProperty(() => {
                        return this.endCartesian;
                    }, false),
                    point: {
                        color: this.color,
                        pixelSize: 4,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    },
                    label: {
                        show: true,
                        showBackground: false,
                        font: "14px monospace",
                        fillColor: this.color,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                        pixelOffset: new Cesium.Cartesian2(0, -30),
                        disableDepthTestDistance: Number.POSITIVE_INFINITY,
                        text: new Cesium.CallbackProperty(() => {
                            const cartographic = Cesium.Cartographic.fromCartesian(this.endCartesian);
                            const longitude = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
                            const latitude = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
                            const height = this.endHeight;
                            let text = this.textFormat;
                            text = text.replace("{lon}", longitude);
                            text = text.replace("{lat}", latitude);
                            text = text.replace("{height}", height.toFixed(3));
                            return text;
                            //return `${this.endHeight.toFixed(3)}m`;
                        }, false)
                    },
                });
                this.entities.push(this.endEntity);
            }
        }
        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    /**
     * Disables the position measurement tool.
     * @function
     * @returns {void}
     */
    off = () => {
        this.scene.canvas.style.cursor = "default";
        //this.status = false;
        this.clearEntities();
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    }

    clearEntities = () => {
        this.viewer.entities.remove(this.startEntity);
        this.viewer.entities.remove(this.endEntity);
        this.entities.forEach((entity) => {
            this.viewer.entities.remove(entity);
        });
        this.startEntity = undefined;
        this.endEntity = undefined;
    }
}

