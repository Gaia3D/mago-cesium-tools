/**
 * ThirdPersonOnGround
 * This class provides a first-person view controller for a Cesium viewer.
 * @class
 */
export class ThirdPersonOnGround {
    constructor(viewer: any);
    viewer: any;
    canvas: any;
    isActive: boolean;
    handler: Cesium.ScreenSpaceEventHandler;
    targetCamera: Cesium.Camera;
    orbitCamera: any;
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
    activate(lockMode?: boolean): void;
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
