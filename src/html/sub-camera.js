import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {ModelSwapAnimator} from "@/modules/model/ModelSwapAnimator.js";
import {SubViewer} from "@/modules/render/SubViewer.js";

import camera from "@/assets/camera.glb";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (🎥 Sub Camera)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <button id="start">Start</button>
    <button id="sync">Sync Camera</button>
    <button id="capture" class="btn">Capture</button>
    <button id="depth">DepthMode</button>
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

const [lon, lat] = [127.3839550536586, 36.46552371257934];
const frame = {
    current: 0,
    max: 8,
    interval: null,
};

const magoTools = new MagoTools(viewer);

let subViewer = undefined;
let magoSubTools = undefined;

let modelSwapAnimator;
let info;
const init = async () => {
    await magoTools.createVworldImageryLayerWithoutToken("Satellite", "jpeg");
    magoTools.initPosition(lon, lat, 1000.0);

    console.log(Cesium.Cartesian3.fromDegrees(lon, lat, 1000.0));

    //await magoTools.createModel(camera, lon, lat, 1000.0);

    subViewer = new SubViewer(viewer);
    magoSubTools = new MagoTools(subViewer.viewer);

    await magoSubTools.createVworldImageryLayerWithoutToken("Satellite", "jpeg");
    magoSubTools.initPosition(lon, lat, 1000.0);

    setDefaultValue();
};

const setDefaultValue = () => {

};

const nextFrame = () => {
    frame.current = (frame.current + 1) % frame.max;
    const currentGlb = info.glbMetaDataFileNames[frame.current];
    const glbFileName = currentGlb.glbFileName;
    const maxValue = currentGlb.maxValue;
    const glbUrl = `/ac-no2/${glbFileName}`;
    modelSwapAnimator.loadModel(glbUrl, maxValue);
};

document.querySelector("#start").addEventListener("click", async () => {

});

document.querySelector("#sync").addEventListener("click", async () => {
    subViewer.setSync();
});

document.querySelector("#capture").addEventListener("click", async () => {
    subViewer.takeScreenshot();
});

init();