import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {ModelSwapAnimator} from "@/modules/model/ModelSwapAnimator.js";
import {SubViewer} from "@/modules/render/SubViewer.js";

import camera from "@/assets/camera.glb";
import {MagoDepth} from "@/modules/render/MagoDepth.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (🎥 Sub Camera)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <button id="start">Start</button>
    <button id="sync">Sync Camera</button>
    <button id="look-at-camera">LookAtCamera</button>
    <span class="line"></span>
    <button id="capture" class="btn">Capture</button>
    <span class="line"></span>
    <button id="depth">DepthMode</button>
    <button id="greyScale">GreyScale</button>
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
let magoDepth = undefined;

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

    await magoTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    const tilesetA = await Cesium.Cesium3DTileset.fromUrl("http://192.168.10.75:9099/data/{public}/korea-open-data-buildings/tileset.json", {});
    viewer.scene.primitives.add(tilesetA);

    await magoSubTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    const tilesetB = await Cesium.Cesium3DTileset.fromUrl("http://192.168.10.75:9099/data/{public}/korea-open-data-buildings/tileset.json", {});
    subViewer.viewer.scene.primitives.add(tilesetB);

    magoDepth = new MagoDepth(subViewer.viewer);
    setTimeout(() => {
        //magoDepth.on();
    }, 1000);

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

document.querySelector("#look-at-camera").addEventListener("click", async () => {
    subViewer.setLookAtCamera();
});

document.querySelector("#depth").addEventListener("click", async () => {
    if (magoDepth) {
        magoDepth.toggle();
    } else {
        console.warn("MagoDepth is not initialized.");
    }
});

document.querySelector("#greyScale").addEventListener("click", async () => {
    if (magoDepth) {
        magoDepth.globalOptions.grayScale = !magoDepth.globalOptions.grayScale;
    } else {
        console.warn("MagoDepth is not initialized.");
    }
});

init();