import * as Cesium from "cesium";

/**
 * DrawPoint class for drawing a point in a Cesium viewer.
 * @class drawPoint
 * @param {Object} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the drawing point.
 * @example
 * const drawPoint = new DrawPoint(viewer, { color: Cesium.Color.RED });
 * drawPoint.on();
 * // To disable the drawing tool and clear entities:
 * drawPoint.off();
 */
export class DrawPoint {
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
        this.endCartesian = undefined;
        this.startEntity = undefined;
        this.endEntity = undefined;
        this.entities = [];
    }

    /**
     * Enables the point drawing tool.
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
            if (!isContinue) {
                this.clearEntities();
            }

            let pickedEllipsoidPosition;
            if (scene.pickPositionSupported) {
                pickedEllipsoidPosition = viewer.scene.pickPosition(event.position);
                const cartographic = Cesium.Cartographic.fromCartesian(pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(Cesium.Cartographic.fromRadians(cartographic.longitude, cartographic.latitude, 0));
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
            this.startEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
            this.endCartesian = pickedEllipsoidPosition
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
                });
                this.entities.push(this.endEntity);
            }
        }
        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    /**
     * Disables the point drawing tool.
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

