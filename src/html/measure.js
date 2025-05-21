import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {MeasureHeight} from "@/modules/measure/MeasureHeight.js";
import {MeasureDistance} from "@/modules/measure/MeasureDistance.js";
import {MeasureAngle} from "@/modules/measure/MeasureAngle.js";
import {MeasureArea} from "@/modules/measure/MeasureArea.js";
import {DrawPolygon} from "@/modules/draw/DrawPolygon.js";
import {MeasureMultiDistance} from "@/modules/measure/MeasureMultiDistance.js";
import {DrawLineString} from "@/modules/draw/DrawLineString.js";
import {MeasurePosition} from "@/modules/measure/MeasurePosition.js";
import {DrawPoint} from "@/modules/draw/DrawPoint.js";
import {DrawWall} from "@/modules/draw/DrawWall.js";
import {DrawCircle} from "@/modules/draw/DrawCircle.js";
import {DrawSphere} from "@/modules/draw/DrawSphere.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (📏 Measure / ✏️ Draw)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>Measure Tools</h3>
    <button id="measure-point">Point</button>
    <button id="measure-distance">Distance</button>
    <button id="measure-multi-distance">Multi Distance</button>
    <span class="line"></span>
    <button id="measure-height">Height</button>
    <button id="measure-angle">Angle</button>
    <button id="measure-area">Area</button>
    <span class="line"></span>
    <h3>Draw Tools (Clamped)</h3>
    <button id="draw-point-clamped">Point</button>
    <button id="draw-area-clamped">Draw Area</button>
    <button id="draw-line-clamped">Draw Line</button>
    <button id="draw-wall-clamped">Draw Wall</button>
    <span class="line"></span>
    <h3>Draw Tools</h3>
    <button id="draw-area">Draw Area</button>
    <button id="draw-line">Draw Line</button>
    <button id="draw-wall">Draw Wall</button>
    <button id="draw-circle">Draw Circle</button>
    <span class="line"></span>
    <button id="draw-sphere">Draw Sphere</button>
    <button id="draw-cone">Draw Cone</button>
    <button id="draw-box">Draw Box</button>
    <span class="line"></span>
    <button id="toggle-depth-test">Terrain Depth-Test</button>
 </div>
`;

window.CESIUM_BASE_URL = "/node_modules/cesium/Build/Cesium";

const viewer = new Viewer("cesiumContainer", {
    geocoder: false,
    baseLayerPicker: false,
    homeButton: false,
    infoBox: false,
    sceneModePicker: false,
    animation: false,
    timeline: false,
    navigationHelpButton: false,
    selectionIndicator: false,
    fullscreenButton: false,
    baseLayer: false,
    shouldAnimate: true,
});
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.globe.enableLighting = false;
viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

const [lon, lat] = [-86.264209991, 39.91867743486771];

const measurePoint = new MeasurePosition(viewer);
const measureArea = new MeasureArea(viewer);
const measureDistance = new MeasureDistance(viewer);
const measureMultiDistance = new MeasureMultiDistance(viewer);
const measureHeight = new MeasureHeight(viewer);
const measureAngle = new MeasureAngle(viewer);

const drawPolygon = new DrawPolygon(viewer, {color: Cesium.Color.VIOLET});
const drawLineString = new DrawLineString(viewer, {color: Cesium.Color.VIOLET});
const drawWall = new DrawWall(viewer, {clampToGround: false, color: Cesium.Color.VIOLET});
const drawCircle = new DrawCircle(viewer, {color: Cesium.Color.VIOLET});
const drawSphere = new DrawSphere(viewer, {color: Cesium.Color.DARKORANGE});

const drawPoint = new DrawPoint(viewer, {color: Cesium.Color.DARKORANGE});
const drawPolygonClamped = new DrawPolygon(viewer, {clampToGround: true, color: Cesium.Color.RED});
const drawLineStringClamped = new DrawLineString(viewer, {clampToGround: true, color: Cesium.Color.RED});
const drawWallClamped = new DrawWall(viewer, {clampToGround: true, color: Cesium.Color.RED});

const init = async () => {
    const magoViewer = new MagoTools(viewer);
    await magoViewer.createVworldImageryLayerWithoutToken("Satellite", "jpeg");
    await magoViewer.createGridImageryProvider();
    await magoViewer.changeTerrain("https://seoul.gaia3d.com:10107/mago_terrain/output/hamilton_2024_dtm_4326_d20");
    const tileset = await Cesium.Cesium3DTileset.fromUrl("http://192.168.10.75:9099/data/{public}/korea-open-data-buildings/tileset.json", {});
    viewer.scene.primitives.add(tileset);

    magoViewer.initPosition(lon, lat, 1000.0);

    setDefaultValue();
};

// Set default value for polylines and polygons
const setDefaultValue = () => {
    // Disable depth test for polylines
    const oldPolylineUpdate = Cesium.PolylineCollection.prototype.update;
    Cesium.PolylineCollection.prototype.update = function(frameState) {
        const oldMorphTime = frameState.morphTime;
        frameState.morphTime = 0.0;
        oldPolylineUpdate.call(this, frameState);
        frameState.morphTime = oldMorphTime;
    };

    // Disable depth test for polygons
    const oldPrimitiveUpdate = Cesium.Primitive.prototype.update;
    Cesium.Primitive.prototype.update = function(frameState) {
        this.appearance._renderState.depthTest.enabled = false;
        oldPrimitiveUpdate.call(this, frameState);
    };
};

const offAll = () => {
    measurePoint.off();
    measureArea.off();
    measureDistance.off();
    measureMultiDistance.off();
    measureHeight.off();
    measureAngle.off();

    drawPoint.off();
    drawPolygonClamped.off();
    drawLineStringClamped.off();
    drawLineString.off();
    drawPolygon.off();
    drawWall.off();
    drawWallClamped.off();
    drawCircle.off();
    drawSphere.off();
};

document.querySelector("#measure-point").addEventListener("click", () => {
    offAll();
    measurePoint.on();
});

document.querySelector("#measure-distance").addEventListener("click", () => {
    offAll();
    measureDistance.on();
});

document.querySelector("#measure-multi-distance").
    addEventListener("click", () => {
        offAll();
        measureMultiDistance.on();
    });

document.querySelector("#measure-height").addEventListener("click", () => {
    offAll();
    measureHeight.on();
});

document.querySelector("#measure-angle").addEventListener("click", () => {
    offAll();
    measureAngle.on();
});

document.querySelector("#measure-area").addEventListener("click", () => {
    offAll();
    measureArea.on();
});

document.querySelector("#draw-area").addEventListener("click", () => {
    offAll();
    drawPolygon.on();
});

document.querySelector("#draw-line").addEventListener("click", () => {
    offAll();
    drawLineString.on();
});

document.querySelector("#draw-wall").addEventListener("click", () => {
    offAll();
    drawWall.on();
});

document.querySelector("#draw-circle").addEventListener("click", () => {
    offAll();
    drawCircle.on();
});

document.querySelector("#draw-sphere").addEventListener("click", () => {
    offAll();
    drawSphere.on();
});

document.querySelector("#draw-point-clamped").addEventListener("click", () => {
    offAll();
    drawPoint.on();
});

document.querySelector("#draw-area-clamped").addEventListener("click", () => {
    offAll();
    drawPolygonClamped.on();
});

document.querySelector("#draw-line-clamped").addEventListener("click", () => {
    offAll();
    drawLineStringClamped.on();
});

document.querySelector("#draw-wall-clamped").addEventListener("click", () => {
    offAll();
    drawWallClamped.on();
});

document.querySelector("#toggle-depth-test").addEventListener("click", () => {
    const depthTest = viewer.scene.globe.depthTestAgainstTerrain;
    viewer.scene.globe.depthTestAgainstTerrain = !depthTest;
});

init();