/**
 * ThirdPersonOnGround
 * This class provides a third-person view controller for navigating a 3D scene in CesiumJS.
 * @class
 */
export class ThirdPersonOnGround {
    constructor(viewer: any);
    viewer: any;
    canvas: any;
    isActive: boolean;
    handler: Cesium.ScreenSpaceEventHandler;
    f: any;
    flags: {
        isActive: boolean;
        speedUp: boolean;
        speedDown: boolean;
        moveForward: boolean;
        moveBackward: boolean;
        fastMove: boolean;
        moveUp: boolean;
        moveDown: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        moveRate: number;
    };
    pysicalState: {
        isJumping: boolean;
        verticalVelocity: number;
        gravity: number;
        moveSpeed: number;
        jumpSpeed: number;
        lastUpdateTime: number;
    };
    yUpToZUp(): Cesium.Matrix4;
    finalModelMatrix(modelMatrix: any): Cesium.Matrix4;
    init(): void;
    model: Cesium.Model;
    toggle(): void;
    lookAtCamera(): void;
    preRenderEvent(): void;
    /**
     * Activate the third-person view controller
     * @method
     * @description This method activates the third-person view controller, enabling keyboard and mouse controls for navigation.
     * @param lockMode {boolean} - If true, enables pointer lock mode for mouse movement.
     */
    activate(lockMode?: boolean): void;
    /**
     * Deactivate the first-person view controller
     * @method
     * @description This method deactivates the first-person view controller, restoring the default camera controls and removing event listeners.
     */
    deactivate(): void;
    keyboardEventHandler: () => void;
    keyDownEventHandler: (e: any) => void;
    keyUpEventHandler: (event: any) => void;
    mouseMoveHandler(moveEvent: any): void;
    mouseClickWithPointerLockHandler: () => void;
    mouseMoveWithPointerLockHandler: (moveEvent: any) => void;
    getFlagForKeyCode(code: any): "speedDown" | "speedUp" | "moveForward" | "moveBackward" | "moveUp" | "moveDown" | "moveRight" | "moveLeft";
    clear(): void;
}
import * as Cesium from "cesium";
