import * as Cesium from "cesium";

/**
 * MeasureHeight class for measuring height in a Cesium viewer.
 * @class MeasureHeight
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the measurement tool.
 * @param {Cesium.Color} [options.color] - The color of the measurement line and points.
 * @example
 * const measureHeight = new MeasureHeight(viewer, { color: Cesium.Color.RED });
 * measureHeight.on();
 * // To disable the measurement tool and clear entities:
 * measureHeight.off();
 */
export class MeasureHeight {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = options.color || Cesium.Color.LIGHTGRAY;
        this.status = false;
        this.startHeight = undefined;
        this.startCartographic = undefined;
        this.startCartesian = undefined;
        this.endHeight = undefined;
        this.endCartesian = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.lineEntity = undefined;
    }

    /**
     * Enables the height measurement tool.
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

        // Mouse Left Click
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
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.startCartographic = cartographic;
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                this.startHeight = height;
                this.endHeight = height;
            }

            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(event.position, scene.globe.ellipsoid);
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.startCartographic = cartographic;
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
                this.startHeight = height;
                this.endHeight = height;
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
            }

            this.startCartesian = pickedEllipsoidPosition;
            this.endCartesian = pickedEllipsoidPosition;
            this.startEntity = viewer.entities.add({
                position: pickedEllipsoidPosition, point: {
                    color: this.color, pixelSize: 4, disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });

            const startUpCartesian = Cesium.Cartesian3.fromRadians(this.startCartographic.longitude, this.startCartographic.latitude, this.startHeight + 50.0);
            let startUpNormal = Cesium.Cartesian3.subtract(startUpCartesian, this.startCartesian, new Cesium.Cartesian3());
            startUpNormal = Cesium.Cartesian3.normalize(startUpNormal, new Cesium.Cartesian3());

            const cameraDirection = viewer.camera.direction;

            let startRight = Cesium.Cartesian3.cross(startUpNormal, cameraDirection, new Cesium.Cartesian3());
            startRight = Cesium.Cartesian3.normalize(startRight, new Cesium.Cartesian3());

            let startDir = Cesium.Cartesian3.cross(startUpNormal, startRight, new Cesium.Cartesian3());
            startDir = Cesium.Cartesian3.normalize(startDir, new Cesium.Cartesian3());

            this.plane = Cesium.Plane.fromPointNormal(this.startCartesian, startDir, new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0));
            this.lineEntity = viewer.entities.add({
                polyline: {
                    positions: new Cesium.CallbackProperty(() => {
                        return [this.startCartesian, this.endCartesian];
                    }, false), width: 3, material: this.color.withAlpha(0.8),
                },
            });

            this.endEntity = viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    return this.endCartesian;
                }, false), point: {
                    color: this.color, pixelSize: 4, disableDepthTestDistance: Number.POSITIVE_INFINITY,
                }, label: {
                    show: true,
                    showBackground: false,
                    font: "14px monospace",
                    fillColor: this.color,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    text: new Cesium.CallbackProperty(() => {
                        const distance = Cesium.Cartesian3.distance(this.startCartesian, this.endCartesian);
                        let height;
                        if (distance > 1000) {
                            height = `${(distance / 1000).toFixed(3)}km`;
                        } else {
                            height = `${distance.toFixed(3)}m`;
                        }
                        return height;
                    }, false),
                },
            });
        };

        // Mouse Move
        const mouseMoveHandler = (moveEvent) => {
            if (!this.status) {
                return;
            }

            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(moveEvent.endPosition);
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.endHeight = cartographic.height;
            }
            if (!pickedEllipsoidPosition) {
                pickedEllipsoidPosition = viewer.camera.pickEllipsoid(moveEvent.endPosition, scene.globe.ellipsoid);
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                this.endHeight = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
            }
            this.endCartesian = Cesium.Cartesian3.fromRadians(this.startCartographic.longitude, this.startCartographic.latitude, this.endHeight);
        };
        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

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

