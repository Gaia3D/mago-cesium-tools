import * as Cesium from "cesium";

/**
 * MeasureArea class for measuring area in a Cesium viewer.
 * @class MeasureArea
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Optional parameters for the measurement.
 * @example
 * const measureArea = new MeasureArea(viewer, { color: Cesium.Color.RED });
 * measureArea.on();
 * // To disable the measurement tool and clear entities:
 * measureArea.off();
 */
export class MeasureArea {
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
     * Enables the area measurement tool.
     * Click to start measuring, and click again drawing the polygon.
     * Left click to add points, right click to finish.
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

            this.cartesians.push(pickedEllipsoidPosition);
            this.endCartesian = pickedEllipsoidPosition;

            const pointEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    show: false,
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                }
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
                        material : this.color.withAlpha(0.8),
                        clampToGround : this.clampToGround
                    },
                });

                this.polygonEntity = viewer.entities.add({
                    polygon: {
                        hierarchy: new Cesium.CallbackProperty(() => {
                            const cartesianPositions = this.cartesians.slice();
                            cartesianPositions.push(this.endCartesian);
                            return new Cesium.PolygonHierarchy(cartesianPositions);
                        }, false),
                        material: this.color.withAlpha(0.5),
                        perPositionHeight: !this.clampToGround
                    }
                });
            }
        }

        const mouseMoveHandler = (moveEvent) => {
            if (!this.status) {
                return;
            }
            //pickedObject = scene.pick(moveEvent.endPosition);
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
        }

        const mouseRightClickHandler = (event) => {
            this.status = false;

            this.pickedObject = scene.pick(event.position);
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

            this.cartesians.push(pickedEllipsoidPosition);

            const area = this.calculateArea(this.cartesians);

            const pointEntity = viewer.entities.add({
                position: pickedEllipsoidPosition,
                point: {
                    show: false,
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
                label: {
                    //show: true,
                    showBackground: false,
                    font: "14px monospace",
                    fillColor: this.color,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    text: `${area}`,
                },
            });
            this.pointEntities.push(pointEntity);

            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;
        }
        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(mouseRightClickHandler, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        handler.setInputAction(mouseRightClickHandler, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
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
            handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
    }

    clearEntities = () => {
        this.viewer.entities.remove(this.polylineEntity);
        this.viewer.entities.remove(this.polygonEntity);
        this.pointEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.polylineEntity = undefined
        this.polygonEntity = undefined;
        this.pointEntities = [];
        this.cartesians = [];
        this.endCartesian = undefined;
    }

    clearCartesians = () => {
        this.cartesians = [];
        this.endCartesian = undefined;
    }

    calculateArea = (cartesians) => {
        const positions = cartesians;
        const indices  = Cesium.PolygonPipeline.triangulate(positions, []);
        let area = 0;
        for (let i = 0; i < indices.length; i += 3) {
            const vector1 = positions[indices[i]];
            const vector2 = positions[indices[i+1]];
            const vector3 = positions[indices[i+2]];
            const vectorC = Cesium.Cartesian3.subtract(vector2, vector1, new Cesium.Cartesian3());
            const vectorD = Cesium.Cartesian3.subtract(vector3, vector1, new Cesium.Cartesian3());
            const areaVector = Cesium.Cartesian3.cross(vectorC, vectorD, new Cesium.Cartesian3());
            area += Cesium.Cartesian3.magnitude(areaVector) / 2.0;
        }

        if (area > 1000000) {
            area = area / 1000000;
            return area.toFixed(3) + ' ㎢';
        } else {
            return area.toFixed(3) + ' ㎡';
        }
    }

}

