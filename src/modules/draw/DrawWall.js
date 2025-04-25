import * as Cesium from "cesium";

/**
 * DrawWall class for drawing a polygon in a Cesium viewer.
 * @class DrawWall
 * @param {Cesium.Viewer} viewer - The Cesium viewer instance.
 * @param {Object} [options] - Options for the drawing tool.
 * @param {Cesium.Color} [options.color] - The color of the polygon.
 * @param {boolean} [options.clampToGround] - Whether to clamp the polygon to the ground.
 * @param {number} [options.gap] - The gap between points in meters.
 * @param {number} [options.height] - The height of the wall in meters.
 * @example
 * const drawWall = new DrawWall(viewer, { color: Cesium.Color.RED });
 * drawWall.on();
 * // To disable the drawing tool and clear entities
 * drawWall.off();
 */
export class DrawWall {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.color = options.color || Cesium.Color.LIGHTGRAY;
        this.gap = options.gap || 30;
        this.wallHeight = options.wallHeight || 30;
        this.clampToGround = options.clampToGround || false;
        this.status = false;
        this.cartesians = undefined;
        this.endCartesian = undefined;
        this.polygonEntities = [];
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
                    scene.globe.ellipsoid);
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
                position: pickedEllipsoidPosition, point: {
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
                            // cartesianPositions.push(this.cartesians[0]);
                            return cartesianPositions;
                        }, false),
                        width: 3,
                        depthFailMaterial: this.color,
                        material: this.color.withAlpha(0.8),
                        clampToGround: this.clampToGround,
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
                    moveEvent.endPosition, scene.globe.ellipsoid);
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
                    scene.globe.ellipsoid);
                const cartographic = Cesium.Cartographic.fromCartesian(
                    pickedEllipsoidPosition);
                const height = viewer.scene.globe.getHeight(
                    Cesium.Cartographic.fromRadians(cartographic.longitude,
                        cartographic.latitude, 0));
                pickedEllipsoidPosition = Cesium.Cartesian3.fromRadians(
                    cartographic.longitude, cartographic.latitude, height);
            }

            this.cartesians.push(pickedEllipsoidPosition);

            const area = this.calculateArea(this.cartesians);

            const pointEntity = viewer.entities.add({
                position: pickedEllipsoidPosition, point: {
                    show: false,
                    color: this.color,
                    pixelSize: 4,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            });
            this.pointEntities.push(pointEntity);

            let cartesianPositions = this.cartesians.slice();

            // separate the positions by gap when clampToGround is true
            if (this.clampToGround) {
                // separate the positions by gap
                const separatedPositions = [];
                for (let i = 0; i < cartesianPositions.length - 1; i++) {
                    const start = cartesianPositions[i];
                    const end = cartesianPositions[i + 1];
                    const distance = Cesium.Cartesian3.distance(start, end);
                    const numPoints = Math.floor(distance / this.gap) + 1;
                    for (let j = 0; j <= numPoints; j++) {
                        let position = Cesium.Cartesian3.lerp(start, end,
                            j / numPoints,
                            new Cesium.Cartesian3());
                        const cartographic = Cesium.Cartographic.fromCartesian(
                            position);
                        const height = viewer.scene.globe.getHeight(
                            Cesium.Cartographic.fromRadians(
                                cartographic.longitude,
                                cartographic.latitude, 0));
                        position = Cesium.Cartesian3.fromRadians(
                            cartographic.longitude,
                            cartographic.latitude, height);
                        separatedPositions.push(position);
                    }
                }
                cartesianPositions = separatedPositions;
            }

            const wallPositions = cartesianPositions.map(cartesian => {
                const cartographic = Cesium.Cartographic.fromCartesian(
                    cartesian);
                const height = viewer.scene.globe.getHeight(
                    Cesium.Cartographic.fromRadians(cartographic.longitude,
                        cartographic.latitude, 0));
                return Cesium.Cartesian3.fromRadians(cartographic.longitude,
                    cartographic.latitude, height + this.wallHeight);
            });

            const wallPolylinePositions = wallPositions.slice();
            wallPolylinePositions.push(
                cartesianPositions[cartesianPositions.length - 1]);

            const wallPolylineEntity = viewer.entities.add({
                polyline: {
                    positions: wallPolylinePositions,
                    width: 3,
                    depthFailMaterial: this.color,
                    material: this.color.withAlpha(0.8),
                },
            });
            this.polygonEntities.push(wallPolylineEntity);

            let floorPolylinePositions = [];
            floorPolylinePositions.push(wallPolylinePositions[0]);
            floorPolylinePositions = floorPolylinePositions.concat(
                cartesianPositions.slice());
            const floorPolylineEntity = viewer.entities.add({
                polyline: {
                    positions: floorPolylinePositions.slice(),
                    width: 3,
                    depthFailMaterial: this.color,
                    material: this.color.withAlpha(0.8),
                },
            });
            this.polygonEntities.push(floorPolylineEntity);
            this.viewer.entities.remove(this.polylineEntity);

            for (let i = 0; i < wallPositions.length - 1; i++) {
                const floorA = cartesianPositions[i];
                const floorB = cartesianPositions[i + 1];
                const wallA = wallPositions[i];
                const wallB = wallPositions[i + 1];
                const resultPositions = [floorA, floorB, wallB, wallA];
                resultPositions.push(floorA);
                const wallHierarchy = new Cesium.PolygonHierarchy(
                    resultPositions);

                const wallEntity = viewer.entities.add({
                    polygon: {
                        hierarchy: wallHierarchy,
                        material: this.color.withAlpha(0.5),
                        perPositionHeight: true,
                    },
                });
                this.polygonEntities.push(wallEntity);
                // break;
            }

            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;
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
            handler.removeInputAction(
                Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        }
    };

    clearEntities = () => {
        this.viewer.entities.remove(this.polylineEntity);
        // this.viewer.entities.remove(this.polygonEntity);
        this.polygonEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.pointEntities.forEach(entity => {
            this.viewer.entities.remove(entity);
        });
        this.polylineEntity = undefined;
        this.polygonEntities = [];
        this.pointEntities = [];
        this.cartesians = [];
        this.endCartesian = undefined;
    };

    clearCartesians = () => {
        this.cartesians = [];
        this.endCartesian = undefined;
    };

    calculateArea = (cartesians) => {
        const positions = cartesians;
        const indices = Cesium.PolygonPipeline.triangulate(positions, []);
        let area = 0;
        for (let i = 0; i < indices.length; i += 3) {
            const vector1 = positions[indices[i]];
            const vector2 = positions[indices[i + 1]];
            const vector3 = positions[indices[i + 2]];
            const vectorC = Cesium.Cartesian3.subtract(vector2, vector1,
                new Cesium.Cartesian3());
            const vectorD = Cesium.Cartesian3.subtract(vector3, vector1,
                new Cesium.Cartesian3());
            const areaVector = Cesium.Cartesian3.cross(vectorC, vectorD,
                new Cesium.Cartesian3());
            area += Cesium.Cartesian3.magnitude(areaVector) / 2.0;
        }

        if (area > 100000) {
            area = area / 1000;
            return area.toFixed(3) + " ㎢";
        } else {
            return area.toFixed(3) + " ㎡";
        }
    };

}

