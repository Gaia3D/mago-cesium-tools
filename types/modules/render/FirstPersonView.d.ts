/**
 * FirstPersonView
 * A class to handle first-person view navigation in a Cesium viewer.
 * @class FirstPersonView
 */
export class FirstPersonView {
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
        moveUp: boolean;
        moveDown: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        moveRate: number;
    };
    toggle(): void;
    /**
     * Activate the first-person view mode.
     * @method
     * @description Activates the first-person view mode by setting up the necessary event handlers and UI elements.
     * @returns {void}
     */
    activate(): void;
    /**
     * Deactivate the first-person view mode.
     * @method
     * @description Deactivates the first-person view mode by removing event handlers and hiding the crosshair.
     * @returns {void}
     */
    deactivate(): void;
    getFlagForKeyCode(code: any): "speedDown" | "speedUp" | "moveForward" | "moveBackward" | "moveUp" | "moveDown" | "moveRight" | "moveLeft";
    clear(): void;
    #private;
}
import * as Cesium from "cesium";
