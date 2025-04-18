import * as Cesium from "cesium";

/**
 * MeasureAngle class for measuring angles in a Cesium viewer.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const measureAngle = new MeasureAngle(viewer);
 * measureAngle.on();
 */
export class MeasureAngle {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = Cesium.Color.LIGHTGRAY;
        this.status = false;
        this.startCartesian = undefined;
        this.upCartesian = undefined;
        this.endCartesian = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.lineEntity = undefined;
        this.verticalLineEntity = undefined;
        this.horizontalLineEntity = undefined;
    }

    /**
     * Enables the angle measurement tool.
     * Click to start measuring, and click again to stop.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on = (Continue = false) => {
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

            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(event.position);
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    event.position,
                    scene.globe.ellipsoid
                );
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            }

            // fix height to 1.0m
            //const manHeight = 0.5;
            const convertCartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(convertCartographic.longitude, convertCartographic.latitude, convertCartographic.height);

            this.startCartesian = pickedEllipsoidPosition;
            this.endCartesian = pickedEllipsoidPosition;
            this.upCartesian = pickedEllipsoidPosition;
            this.startEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    showBackground: false,
                    font: "14px monospace",
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    text: new Cesium.CallbackProperty(() => {
                        if (this.startCartesian == this.endCartesian || this.startCartesian == this.upCartesian) {
                            return `0.0 °`;
                        }

                        let vector1 = Cesium.Cartesian3.subtract(this.startCartesian, this.endCartesian, new Cesium.Cartesian3());
                        if (Cesium.Cartesian3.equals(vector1, new Cesium.Cartesian3())) {
                            return `0.0 °`;
                        }
                        vector1 = Cesium.Cartesian3.normalize(vector1, new Cesium.Cartesian3());
                        let vector2 = Cesium.Cartesian3.subtract(this.upCartesian, this.endCartesian, new Cesium.Cartesian3());
                        if (Cesium.Cartesian3.equals(vector2, new Cesium.Cartesian3())) {
                            return `0.0 °`;
                        }
                        vector2 = Cesium.Cartesian3.normalize(vector2, new Cesium.Cartesian3());

                        const angle = Cesium.Cartesian3.angleBetween(vector1, vector2);
                        const angleDeg = (90 - Cesium.Math.toDegrees(angle)).toFixed(3);
                        return `${angleDeg} °`;
                    }, false)
                },
            });

            this.lineEntity = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return [this.endCartesian, this.startCartesian];
                    }, false),
                    width: 1,
                    depthFailMaterial: this.color,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: this.color.withAlpha(0.8),
                        dashLength: 10.0,
                        dashPattern: 255,
                    }),
                },
            });

            this.verticalLineEntity = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return [this.upCartesian, this.startCartesian];
                    }, false),
                    width: 3,
                    depthFailMaterial: this.color,
                    material : this.color,
                },
            });

            this.horizontalLineEntity = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return [this.upCartesian, this.endCartesian];
                    }, false),
                    width: 3,
                    depthFailMaterial: this.color,
                    material : this.color,
                },
            });

            this.endEntity = viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    return this.endCartesian;
                }, false),
                label: {
                    showBackground: false,
                    font: "14px monospace",
                    fillColor: this.color,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    text: new Cesium.CallbackProperty(() => {
                        if (this.startCartesian == this.endCartesian || this.startCartesian == this.upCartesian) {
                            return `0.0 °`;
                        }

                        let vector1 = Cesium.Cartesian3.subtract(this.startCartesian, this.endCartesian, new Cesium.Cartesian3());
                        if (Cesium.Cartesian3.equals(vector1, new Cesium.Cartesian3())) {
                            return `0.0 °`;
                        }
                        vector1 = Cesium.Cartesian3.normalize(vector1, new Cesium.Cartesian3());
                        let vector2 = Cesium.Cartesian3.subtract(this.upCartesian, this.endCartesian, new Cesium.Cartesian3());
                        if (Cesium.Cartesian3.equals(vector2, new Cesium.Cartesian3())) {
                            return `0.0 °`;
                        }
                        vector2 = Cesium.Cartesian3.normalize(vector2, new Cesium.Cartesian3());

                        const angle = Cesium.Cartesian3.angleBetween(vector1, vector2);
                        const angleDeg = Cesium.Math.toDegrees(angle).toFixed(3);
                        return `${angleDeg} °`;
                    }, false)
                },
            });
        }

        const mouseMoveHandler = (moveEvent) => {
            if (!this.status) {
                return;
            }
            let pickedEllipsoidPosition;
            let height = 0;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(moveEvent.endPosition);
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(
                    moveEvent.endPosition,
                    scene.globe.ellipsoid
                );
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            } else {
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                height = cartographic.height;
            }

            const startCartographic = Cesium.Cartographic.fromCartesian(this.startCartesian);
            this.highThanUp = (startCartographic.height > height) ? true : false;


            let calcUpCartesian;
            if (this.highThanUp) {
                const endCartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                calcUpCartesian = Cesium.Cartesian3.fromRadians(endCartographic.longitude, endCartographic.latitude, startCartographic.height);
            } else {
                calcUpCartesian = Cesium.Cartesian3.fromRadians(startCartographic.longitude, startCartographic.latitude, height);
            }

            //const endCartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            //calcUpCartesian = Cesium.Cartesian3.fromRadians(endCartographic.longitude, endCartographic.latitude, startCartographic.height);

            // fix height to 1.0m
            //const manHeight = 0.5;
            const convertCartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
            pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(convertCartographic.longitude, convertCartographic.latitude, convertCartographic.height);

            //upCartesian
            this.endCartesian = pickedEllipsoidPosition
            this.upCartesian = calcUpCartesian;
        }

        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    /**
     * Disables the angle measurement tool and clears the entities.
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
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    }

    clearEntities = () => {
        this.viewer.entities.remove(this.lineEntity);
        this.viewer.entities.remove(this.startEntity);
        this.viewer.entities.remove(this.endEntity);
        this.viewer.entities.remove(this.verticalLineEntity);
        this.viewer.entities.remove(this.horizontalLineEntity);
        this.lineEntity = undefined
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.verticalLineEntity = undefined;
        this.horizontalLineEntity = undefined;
    }
}

