import * as Cesium from "cesium";

/**
 * DrawPolygon class for drawing a polygon in a Cesium viewer.
 * @class DrawPolygon
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the polygon.
 * @param {boolean} [options.clampToGround] - Whether to clamp the polygon to the ground.
 * @example
 * const drawPolygon = new DrawPolygon(viewer, { color: Cesium.Color.RED });
 * drawPolygon.on();
 * // To disable the drawing tool and clear entities
 * drawPolygon.off();
 */
export class DrawPolygon {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = options.color || Cesium.Color.LIGHTGRAY;
        this.clampToGround = options.clampToGround || false;
        this.status = false;
        this.cartesians = undefined;
        this.endCartesian = undefined;
        this.polygonEntity = undefined;
        this.polylineEntity = undefined;
        this.pointEntities = [];
    }

    /**
     * Enables the polygon drawing tool.
     * Left click to add points, right click to finish.
     * @function
     * @type {boolean} Continue - Whether to continue measuring after the first click.
     * @returns {void}
     */
    on = (isContinue = false) => {
        this.clearEntities();

        this.scene.canvas.style.cursor = "crosshair";
        const viewer = this.viewer;
        const scene = viewer.scene;
        const handler = this.handler;

        const mouseLeftClickHandler = (event) => {
            if (!this.status) {
                this.status = true;

                // Clear previous entities
                this.recentPositions = this.cartesians.slice();
                if (this.recentPositions && this.recentPositions.length > 0) {
                    this.recentPositions.push(this.recentPositions[0]);
                }

                this.clearEntities(viewer);
                this.clearCartesians();
                scene.screenSpaceCameraController.enableRotate = true;
                scene.screenSpaceCameraController.enableTranslate = true;
                scene.screenSpaceCameraController.enableZoom = true;
                scene.screenSpaceCameraController.enableTilt = true;
                scene.screenSpaceCameraController.enableLook = true;
            }

            this.pickedObject = scene.pick(event.position);
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

            this.cartesians.push(pickedEllipsoidPosition);
            this.endCartesian = pickedEllipsoidPosition;

            const pointEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    show: false,
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });
            this.pointEntities.push(pointEntity);

            if (this.cartesians.length <= 1) {
                this.polylineEntity = viewer.entities.add({
                    polyline: {
                        positions: new Cesium.CallbackProperty(() => {
                            const cartesianPositions = this.cartesians.slice();
                            cartesianPositions.push(this.endCartesian);
                            cartesianPositions.push(this.cartesians[0]);
                            return cartesianPositions;
                        }, false),
                        width: 3,
                        depthFailMaterial: this.color,
                        material: this.color.withAlpha(0.8),
                        clampToGround: this.clampToGround,
                    },
                });

                this.polygonEntity = viewer.entities.add({
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const cartesianPositions = this.cartesians.slice();
                            cartesianPositions.push(this.endCartesian);
                            return new Cesium.PolygonHierarchy(
                                cartesianPositions);
                        }, false),
                        material: this.color.withAlpha(0.5),
                        perPositionHeight: !this.clampToGround,
                    },
                });
            }
        };

        const mouseMoveHandler = (moveEvent) => {
            if (!this.status) {
                return;
            }
            // pickedObject = scene.pick(moveEvent.endPosition);
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
            this.endCartesian = pickedEllipsoidPosition;
        };

        const mouseRightClickHandler = (event) => {
            if (!this.status) {
                return;
            }
            this.status = false;

            this.pickedObject = scene.pick(event.position);
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

            this.cartesians.push(pickedEllipsoidPosition);

            const pointEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    show: false,
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });
            this.pointEntities.push(pointEntity);

            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;

            if (isContinue) {
                this.off(false);
                console.log("Continue drawing polygon");
                this.getPositions();
            }
        };
        handler.setInputAction(mouseLeftClickHandler,
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler,
            Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(mouseRightClickHandler,
            Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        handler.setInputAction(mouseRightClickHandler,
            Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    };

    /**
     * Disables the polygon drawing tool. and clears the entities.
     * @function
     * @param {boolean} [clear=false] - Whether to clear the drawn polygon.
     * @returns {void}
     */
    off = (clear = true) => {
        this.scene.canvas.style.cursor = "default";
        this.status = false;
        if (clear) {
            this.clearEntities();
        }
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            handler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
    };

    /**
     * get position of the polygon
     * @function
     * @returns {Array} cartesians - Array of Cesium.Cartesian3 positions
     */
    getPositions = () => {
        if (this.polygonEntity) {
            const positions = this.recentPositions;
            console.log("getPositions", positions);
            return positions;
        } else {
            console.warn("No positions found");
            return [];
        }
    };

    clearEntities = () => {
        this.viewer.entities.remove(this.polylineEntity);
        this.viewer.entities.remove(this.polygonEntity);
        this.pointEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.polylineEntity = undefined;
        this.polygonEntity = undefined;
        this.pointEntities = [];
        this.cartesians = [];
        this.endCartesian = undefined;
    };

    clearCartesians = () => {
        this.cartesians = [];
        this.endCartesian = undefined;
    };
}

