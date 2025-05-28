import * as Cesium from "cesium";

/**
 * FirstPersonView
 */
export class FirstPersonView {
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
            moveUp: false,
            moveDown: false,
            moveLeft: false,
            moveRight: false,
            moveRate: 1.0,
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
            this.activate();
            this.isActive = true;
        }
    }

    activate() {
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

        this.handler.setInputAction(this.mouseDownHandler, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.handler.setInputAction(this.mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction(this.mouseUpHandler, Cesium.ScreenSpaceEventType.LEFT_UP);
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
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    keyboardEventHandler = () => {
        const viewer = this.viewer;
        const camera = viewer.camera;
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
        if (flags.moveForward) {
            camera.moveForward(flags.moveRate);
        }
        if (flags.moveBackward) {
            camera.moveBackward(flags.moveRate);
        }
        if (flags.moveUp) {
            camera.moveUp(flags.moveRate);
        }
        if (flags.moveDown) {
            camera.moveDown(flags.moveRate);
        }
        if (flags.moveLeft) {
            camera.moveLeft(flags.moveRate);
        }
        if (flags.moveRight) {
            camera.moveRight(flags.moveRate);
        }
    };

    keyDownEventHandler = (e) => {
        const flags = this.flags;
        const flagName = this.getFlagForKeyCode(e.code);
        if (typeof flagName !== "undefined") {
            flags[flagName] = true;
        }
    };

    keyUpEventHandler = (e) => {
        const flags = this.flags;
        const flagName = this.getFlagForKeyCode(e.code);
        if (typeof flagName !== "undefined") {
            flags[flagName] = false;
        }
    };

    mouseDownHandler = (event) => {
        this.flags.mouseStatus = true;
    };

    mouseUpHandler = (event) => {
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