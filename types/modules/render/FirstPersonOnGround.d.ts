/**
 * FirstPersonOnGround
 * This class provides a first-person view controller that allows the user to navigate
 * @class
 */
export class FirstPersonOnGround {
    constructor(viewer: any);
    viewer: any;
    canvas: any;
    isActive: boolean;
    handler: Cesium.ScreenSpaceEventHandler;
    crosshair: HTMLDivElement;
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
    init(): void;
    toggle(): void;
    preRenderEvent(): void;
    /**
     * Activate the first-person view controller
     * @method
     * @description This method activates the first-person view controller, enabling keyboard and mouse controls for navigation.
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
    keyUpEventHandler: (e: any) => void;
    mouseDownHandler: () => void;
    mouseUpHandler: () => void;
    mouseMoveHandler: (moveEvent: any) => void;
    mouseMoveWithPointerLockHandler: (moveEvent: any) => void;
    getFlagForKeyCode(code: any): "speedDown" | "speedUp" | "moveForward" | "moveBackward" | "moveUp" | "moveDown" | "moveRight" | "moveLeft";
    clear(): void;
}
import * as Cesium from "cesium";
