import * as Cesium from "cesium";
import {Translator} from "@/modules/object/Translator.js";
import {Rotator} from "@/modules/object/Rotator.js";
import {Scaler} from "@/modules/object/Scaler.js";

export class ObjectController {
    constructor(viewer, options = {}) {
        this.viewer = viewer;
        this.scene = viewer.scene;
        this.handler = new Cesium.ScreenSpaceEventHandler();
        this.movePickedObject = undefined;
        this.moveTempStyle = undefined;

        this.currentPickedObject = undefined;
        this.infomation = undefined;
        this.selectionColor = options.selectionColor || "#74a3ff";

        this.translator = new Translator(viewer, this.handler);
        this.rotator = new Rotator(viewer, this.handler);
        this.scaler = new Scaler(viewer, this.handler);

        this.selectCallback = options.selectCallback;
    }

    /**
     * Selects an object from the tileset.
     * @param tileset {Cesium.Cesium3DTileset} The tileset from which to select the object.
     */
    selectObject = (tileset) => {
        if (!tileset || !(tileset instanceof Cesium.Cesium3DTileset)) {
            console.warn("Invalid tileset provided for selection.");
        } else {
            console.log("Selecting object from tileset:", tileset);
            this.currentPickedObject = tileset;
            this.currentPickedObject.style = new Cesium.Cesium3DTileStyle({
                color: "color('" + this.selectionColor + "', 0.9)",
            });
            this.currentPickedObject.debugShowBoundingVolume = true;
        }
    };

    getPickedObject() {
        return this.currentPickedObject;
    }

    getInformation(selectedObject) {
        console.log("Selected Object Information:", selectedObject);
        if (selectedObject instanceof Cesium.Cesium3DTileFeature) {
            const propertyKeys = selectedObject.getPropertyIds();
            const propertyValues = propertyKeys.map((key) => {
                return selectedObject.getProperty(key);
            });

            const outputValue = [];
            propertyValues.forEach((value, index) => {
                outputValue.push({
                    key: propertyKeys[index],
                    value: value,
                });
            });
            this.infomation = outputValue;
        } else {
            console.warn("No valid object picked for information retrieval.");
            this.infomation = undefined;
        }
    }

    offAll = () => {
        this.translator.off();
        this.rotator.off();
        this.scaler.off();
    };

    translate = () => {
        this.offAll();
        this.translator.on(this.currentPickedObject);
    };

    rotate = () => {
        this.offAll();
        this.rotator.on(this.currentPickedObject);
    };

    scale = () => {
        this.offAll();
        this.scaler.on(this.currentPickedObject);
    };

    /**
     * Enables the position measurement tool.
     * Click to start measuring
     * @function
     * @returns {void}
     */
    on = () => {
        this.scene.canvas.style.cursor = "crosshair";
        const viewer = this.viewer;
        const scene = viewer.scene;
        const handler = this.handler;

        const mouseLeftClickHandler = (event) => {
            const pickedObject = scene.pick(event.position);

            if (this.currentPickedObject) {
                console.log("unpicked object:", pickedObject);
                if (this.currentPickedObject instanceof Cesium.Cesium3DTileFeature) {
                    this.currentPickedObject.style = undefined;
                    this.currentPickedObject.debugShowBoundingVolume = false;
                } else if (this.currentPickedObject?.content instanceof Cesium.Model3DTileContent) {
                    this.currentPickedObject.style = undefined;
                    this.currentPickedObject.debugShowBoundingVolume = false;
                } else if (this.currentPickedObject instanceof Cesium.Cesium3DTileset) {
                    this.currentPickedObject.style = undefined;
                    this.currentPickedObject.debugShowBoundingVolume = false;
                }
                this.currentPickedObject = undefined;
                this.off();
            }

            console.log("picked object:", pickedObject);
            if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
                this.currentPickedObject = pickedObject.tileset;
                this.currentPickedObject.style = new Cesium.Cesium3DTileStyle({
                    color: "color('" + this.selectionColor + "', 0.9)",
                });
                this.currentPickedObject.debugShowBoundingVolume = true;
            } else if (pickedObject?.content instanceof Cesium.Model3DTileContent) {
                this.currentPickedObject = pickedObject.content.tileset;
                this.currentPickedObject.style = new Cesium.Cesium3DTileStyle({
                    color: "color('" + this.selectionColor + "', 0.9)",
                });
                this.currentPickedObject.debugShowBoundingVolume = true;
            } else if (pickedObject instanceof Cesium.Cesium3DTileset) {
                this.currentPickedObject = pickedObject;
                this.currentPickedObject.style = new Cesium.Cesium3DTileStyle({
                    color: "color('" + this.selectionColor + "', 0.9)",
                });
                this.currentPickedObject.debugShowBoundingVolume = true;
            } else {
                console.warn("No valid object picked.");
            }
            if (this.currentPickedObject) {
                this.getInformation(pickedObject);
                console.log("Object Information:", this.infomation);
                if (this.selectCallback) {
                    this.selectCallback(pickedObject);
                }
            }
            this.off();
        };

        const mouseMoveHandler = (moveEvent) => {
            const pickedObject = scene.pick(moveEvent.endPosition);

            if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
                if (this.movePickedObject === pickedObject) {
                    return; // No change in picked object
                }

                const tileset = pickedObject.tileset;
                /*tileset.style = new Cesium.Cesium3DTileStyle({
                    color: "color('" + this.selectionColor + "', 0.5)",
                });*/
                viewer.canvas.style.cursor = "pointer";
                this.movePickedObject = pickedObject;
                this.moveTempStyle = tileset.style;
            } else if (pickedObject?.content instanceof Cesium.Model3DTileContent) {
                if (this.movePickedObject === pickedObject.content) {
                    return; // No change in picked object
                }

                const tileset = pickedObject.content.tileset;
                /*tileset.style = new Cesium.Cesium3DTileStyle({
                    color: "color('" + this.selectionColor + "', 0.5)",
                });*/
                viewer.canvas.style.cursor = "pointer";
                this.movePickedObject = pickedObject.content;
                this.moveTempStyle = tileset.style;
            } else {
                if (this.movePickedObject && this.movePickedObject instanceof Cesium.Cesium3DTileFeature) {
                    const tileset = this.movePickedObject.tileset;
                    //tileset.style = undefined;

                    /*if (this.moveTempStyle === pickedObject.tileset.style) {
                        //tileset.style = this.moveTempStyle;
                        this.movePickedObject = undefined;
                        this.moveTempStyle = undefined;
                    }*/

                    //tileset.style = this.moveTempStyle;
                    //this.movePickedObject = undefined;
                    //this.moveTempStyle = undefined;
                }
                viewer.canvas.style.cursor = "default";
            }
        };
        handler.setInputAction(mouseLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(mouseMoveHandler, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };

    clear = () => {
        this.currentPickedObject = undefined;
        this.movePickedObject = undefined;
        this.infomation = undefined;
    };

    off = () => {
        this.scene.canvas.style.cursor = "default";
        const handler = this.handler;
        if (handler) {
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    };
}

