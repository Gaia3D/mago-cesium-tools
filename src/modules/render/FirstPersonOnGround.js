import * as Cesium from "cesium";

/**
 * FirstPersonView
 */
export class FirstPersonOnGround {
    constructor(viewer) {
        this.viewer = viewer;
        this.canvas = viewer.canvas;
        this.isActive = false;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.crosshair = undefined;
        this.flags = {
            isActive: false,
            speedUp: false,
            speedDown: false,
            moveForward: false,
            moveBackward: false,
            fastMove: false,
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            moveRate: 1.0,
        };

        this.pysicalState = {
            isJumping: false,
            verticalVelocity: 0,
            gravity: -9.8 * 2.0,
            moveSpeed: 20.0,
            jumpSpeed: 10.0,
            lastUpdateTime: performance.now(), // 마지막 업데이트 시간
        };
    }

    init() {
        const crosshairDiv = document.createElement("div");
        crosshairDiv.id = "crosshair";
        crosshairDiv.style.position = "absolute";
        crosshairDiv.style.top = "calc(50% - 10px)";
        crosshairDiv.style.left = "calc(50% - 10px)";
        crosshairDiv.style.width = "20px";
        crosshairDiv.style.height = "20px";
        crosshairDiv.textContent = "+";
        crosshairDiv.style.color = "white";
        crosshairDiv.style.fontSize = "24px";
        crosshairDiv.style.textAlign = "center";
        document.body.appendChild(crosshairDiv);
        this.crosshair = crosshairDiv;
    }

    toggle() {
        if (this.isActive) {
            this.deactivate();
            this.isActive = false;
        } else {
            this.activate(true);
            this.isActive = true;
        }
    }

    preRenderEvent() {
        const viewer = this.viewer;
        const camera = viewer.camera;

        const now = performance.now();
        const dt = (now - this.pysicalState.lastUpdateTime) / 1000;
        this.pysicalState.lastUpdateTime = now;

        const targetPos = camera.positionWC;
        const carto = Cesium.Cartographic.fromCartesian(targetPos);

        // =====================
        // 수평 방향 이동
        // =====================
        const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(targetPos);
        // const xAxis = Cesium.Matrix4.getColumn(enuTransform, 0, new Cesium.Cartesian3()); // east → right
        // const yAxis = Cesium.Matrix4.getColumn(enuTransform, 1, new Cesium.Cartesian3()); // north → up
        const zAxis = Cesium.Matrix4.getColumn(enuTransform, 2, new Cesium.Cartesian3());
        let direction = camera.direction;
        let right = camera.right;

        // 방향 벡터 정규화
        Cesium.Cartesian3.normalize(direction, direction);
        Cesium.Cartesian3.normalize(right, right);

        // 위쪽 방향 기준으로 수평 이동 벡터 계산
        const tempRight = Cesium.Cartesian3.cross(zAxis, direction, new Cesium.Cartesian3());
        Cesium.Cartesian3.negate(tempRight, tempRight);
        Cesium.Cartesian3.normalize(right, right);
        const tempDirection = Cesium.Cartesian3.cross(zAxis, right, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(direction, direction);

        direction = tempDirection;
        right = tempRight;

        const moveVec = new Cesium.Cartesian3();
        if (this.flags.moveForward) {
            Cesium.Cartesian3.add(moveVec, direction, moveVec);
        }
        if (this.flags.moveBackward) {
            Cesium.Cartesian3.subtract(moveVec, direction, moveVec);
        }
        if (this.flags.moveRight) {
            Cesium.Cartesian3.add(moveVec, right, moveVec);
        }
        if (this.flags.moveLeft) {
            Cesium.Cartesian3.subtract(moveVec, right, moveVec);
        }

        if (moveVec.x !== 0 && moveVec.y !== 0 && moveVec.z !== 0) {
            Cesium.Cartesian3.normalize(moveVec, moveVec);

            let speed = this.pysicalState.moveSpeed;
            if (this.flags.fastMove) {
                speed *= 2.0; // 빠른 이동 속도
            }
            Cesium.Cartesian3.multiplyByScalar(moveVec, speed * dt, moveVec);
        }
        // =====================
        // 중력 + 점프 처리
        // =====================
        this.pysicalState.verticalVelocity += this.pysicalState.gravity * dt;
        carto.height += this.pysicalState.verticalVelocity * dt;

        const groundHeight = viewer.scene.globe.getHeight(carto) ?? 0;
        const cameraHeight = groundHeight + 1.7;

        if (carto.height <= cameraHeight) {
            carto.height = cameraHeight;
            this.pysicalState.verticalVelocity = 0;
            this.pysicalState.isJumping = false;
        }

        // =====================
        // 위치 갱신
        // =====================
        const newPos = Cesium.Cartesian3.fromRadians(
            carto.longitude,
            carto.latitude,
            carto.height,
        );
        Cesium.Cartesian3.add(newPos, moveVec, newPos);

        camera.position = newPos;
    }

    activate(lockMode = false) {
        if (!this.crosshair) {
            this.init();
        }
        this.crosshair.style.display = "block";

        const scene = this.viewer.scene;
        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTranslate = false;
        scene.screenSpaceCameraController.enableZoom = false;
        scene.screenSpaceCameraController.enableTilt = false;
        scene.screenSpaceCameraController.enableLook = false;

        this.viewer.clock.onTick.addEventListener(this.keyboardEventHandler);
        const canvas = document;
        canvas.addEventListener("keydown", this.keyDownEventHandler, false);
        canvas.addEventListener("keyup", this.keyUpEventHandler, false);

        const viewer = this.viewer;
        viewer.scene.preRender.addEventListener(this.preRenderEvent, this);

        if (lockMode) {
            viewer.canvas.addEventListener("click", () => {
                viewer.canvas.requestPointerLock();
            });
            viewer.canvas.addEventListener("pointerlockchange", () => {
                if (document.pointerLockElement === viewer.canvas) {
                    console.log("Pointer lock enabled");
                } else {
                    console.log("Pointer lock disabled");
                }
            });
            viewer.canvas.addEventListener("mousemove", this.mouseMoveWithPointerLockHandler);
        } else {
            this.handler.setInputAction(this.mouseDownHandler, Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.handler.setInputAction(this.mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.setInputAction(this.mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
            this.handler.setInputAction(this.mouseUpHandler, Cesium.ScreenSpaceEventType.LEFT_UP);
        }
    }

    deactivate() {
        if (this.crosshair) {
            this.crosshair.style.display = "none";
        }

        const scene = this.viewer.scene;
        scene.screenSpaceCameraController.enableRotate = true;
        scene.screenSpaceCameraController.enableTranslate = true;
        scene.screenSpaceCameraController.enableZoom = true;
        scene.screenSpaceCameraController.enableTilt = true;
        scene.screenSpaceCameraController.enableLook = true;

        this.viewer.clock.onTick.removeEventListener(this.keyboardEventHandler);
        const canvas = document;
        canvas.removeEventListener("keydown", this.keyDownEventHandler, false);
        canvas.removeEventListener("keyup", this.keyUpEventHandler, false);

        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE, Cesium.KeyboardEventModifier.SHIFT);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);

        const viewer = this.viewer;
        viewer.scene.preRender.removeEventListener(this.preRenderEvent, this);

        this.flags = {
            isActive: false,
            speedUp: false,
            speedDown: false,
            moveForward: false,
            moveBackward: false,
            fastMove: false,
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            moveRate: 1.0,
        };

        this.pysicalState = {
            isJumping: false,
            verticalVelocity: 0,
            gravity: -9.8 * 2.0,
            moveSpeed: 20.0,
            jumpSpeed: 10.0,
            lastUpdateTime: performance.now(),
        };
    }

    keyboardEventHandler = () => {
        const viewer = this.viewer;
        const flags = this.flags;
        if (flags.speedUp) {
            flags.moveRate += 0.025;
        }
        if (flags.speedDown) {
            flags.moveRate -= 0.025;
            if (flags.moveRate < 0.01) {
                flags.moveRate = 0.01;
            }
        }
    };

    keyDownEventHandler = (e) => {
        const flags = this.flags;
        const flagName = this.getFlagForKeyCode(e.code);
        if (typeof flagName !== "undefined") {
            flags[flagName] = true;
        }

        if (e.key === " " && !this.pysicalState.isJumping) {
            this.pysicalState.verticalVelocity = this.pysicalState.jumpSpeed;
            this.pysicalState.isJumping = true;
        }
        if (e.key === "Shift") {
            this.flags.fastMove = true;
        }
    };

    keyUpEventHandler = (e) => {
        const flags = this.flags;
        const flagName = this.getFlagForKeyCode(e.code);
        if (typeof flagName !== "undefined") {
            flags[flagName] = false;
        }
        if (e.key === "Shift") {
            this.flags.fastMove = false;
        }
    };

    mouseDownHandler = () => {
        this.flags.mouseStatus = true;
    };

    mouseUpHandler = () => {
        this.flags.mouseStatus = false;
    };

    mouseMoveHandler = (moveEvent) => {
        const viewer = this.viewer;
        if (this.flags.mouseStatus) {
            const intensity = 2.0;
            const width = viewer.canvas.clientWidth;
            const height = viewer.canvas.clientHeight;
            const x = moveEvent.endPosition.x - moveEvent.startPosition.x;
            const y = moveEvent.endPosition.y - moveEvent.startPosition.y;
            const angleX = (-x / width) * intensity;
            const angleY = (y / height) * intensity;

            const camera = viewer.camera;
            camera.setView({
                destination: camera.position,
                orientation: {
                    heading: camera.heading + angleX,
                    pitch: camera.pitch + angleY,
                    roll: camera.roll,
                },
            });
        }
    };

    mouseMoveWithPointerLockHandler = (moveEvent) => {
        const viewer = this.viewer;
        const intensity = 2.0;
        const width = viewer.canvas.clientWidth;
        const height = viewer.canvas.clientHeight;
        const x = -moveEvent.movementX;
        const y = -moveEvent.movementY;
        const angleX = (-x / width) * intensity;
        const angleY = (y / height) * intensity;

        const camera = viewer.camera;
        camera.setView({
            destination: camera.position,
            orientation: {
                heading: camera.heading + angleX,
                pitch: camera.pitch + angleY,
                roll: camera.roll,
            },
        });
    };

    getFlagForKeyCode(code) {
        if (code === "KeyO") {
            return "speedDown";
        } else if (code === "KeyP") {
            return "speedUp";
        } else if (code === "KeyW") {
            return "moveForward";
        } else if (code === "KeyS") {
            return "moveBackward";
        } else if (code === "KeyQ") {
            return "moveUp";
        } else if (code === "KeyE") {
            return "moveDown";
        } else if (code === "KeyD") {
            return "moveRight";
        } else if (code === "KeyA") {
            return "moveLeft";
        } else {
            return undefined;
        }
    }

    clear() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = undefined;
        }
    }
}