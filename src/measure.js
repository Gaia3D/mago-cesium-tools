import './css/css-init.css'
import './css/custom.css'
import {Viewer} from "cesium";
import {MagoViewer} from "./modules/MagoViewer.js";
import * as Cesium from "cesium";
import {MagoFrame} from "@/modules/fluid/MagoFrame.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (Measure)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>Measure Tools</h3>
    <button id="measure-distance">Distance</button>
    <button id="measure-multi-distance">Multi Distance</button>
    <button id="measure-height">Height</button>
    <button id="measure-angle">Angle</button>
    <button id="measure-area">Area</button>
    <span class="line"></span>
    <button id="draw-area">Draw Area</button>
 </div>
`

import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {MeasureHeight} from "@/modules/measure/MeasureHeight.js";
import {MeasureDistance} from "@/modules/measure/MeasureDistance.js";
import {MeasureAngle} from "@/modules/measure/MeasureAngle.js";
import {MeasureArea} from "@/modules/measure/MeasureArea.js";
import {DrawArea} from "@/modules/measure/DrawArea.js";
import {MeasureMultiDistance} from "@/modules/measure/MeasureMultiDistance.js";
window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium'

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
    baseLayer : false,
    shouldAnimate: true,
});
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.globe.enableLighting = false;
viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

const [lon, lat] = [126.968905, 37.447571];

const measureArea = new MeasureArea(viewer);
const measureDistance = new MeasureDistance(viewer);
const measureMultiDistance = new MeasureMultiDistance(viewer);
const measureHeight = new MeasureHeight(viewer);
const measureAngle = new MeasureAngle(viewer);
const drawArea = new DrawArea(viewer);

const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    await magoViewer.createVworldImageryLayerWithoutToken('Satellite', 'jpeg');
    await magoViewer.changeTerrain('http://175.197.92.213:10110/korea_5m_dem_4326_ms8/');
    const tileset = await Cesium.Cesium3DTileset.fromUrl("http://192.168.10.75:9099/data/{public}/korea-open-data-buildings/tileset.json", {});
    viewer.scene.primitives.add(tileset);

    magoViewer.initPosition(lon, lat, 1000.0);

    setDefaultValue();
}

const setDefaultValue = () => {

}

const offAll = () => {
    measureArea.off();
    measureDistance.off();
    measureMultiDistance.off();
    measureHeight.off();
    measureAngle.off();
    drawArea.off();
}

document.querySelector('#measure-distance').addEventListener('click', () => {
    offAll();
    measureDistance.on();
});

document.querySelector('#measure-multi-distance').addEventListener('click', () => {
    offAll();
    measureMultiDistance.on();
});

document.querySelector('#measure-height').addEventListener('click', () => {
    offAll();
    measureHeight.on();
});

document.querySelector('#measure-angle').addEventListener('click', () => {
    offAll();
    measureAngle.on();
});

document.querySelector('#measure-area').addEventListener('click', () => {
    offAll();
    measureArea.on();
});

document.querySelector('#draw-area').addEventListener('click', () => {
    offAll();
    drawArea.on();
});

init();