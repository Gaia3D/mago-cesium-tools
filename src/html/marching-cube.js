import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {ModelSwapAnimator} from "@/modules/model/ModelSwapAnimator.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (🧊 MarchingCube)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <button id="start">Start</button>
    <button id="next-frame" class="btn">Next Frame</button>
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

const magoViewer = new MagoTools(viewer);
let modelSwapAnimator;
let info;
const init = async () => {
    await magoViewer.createMaptilerImageryProvider();
    magoViewer.initPosition(lon, lat, 1000.0);

    const infoJson = await fetch("/marching-cube-sample/index.json");
    info = await infoJson.json();
    console.log(info);

    frame.max = info.glbMetaDataFileNames.length;

    const center = Cesium.Cartesian3.fromDegrees(lon, lat);
    const options = {center};
    modelSwapAnimator = new ModelSwapAnimator(viewer, options);

    setDefaultValue();
    if (!viewer.scene.clampToHeightSupported) {
        window.alert("This browser does not support clampToHeightMostDetailed.");
    }
};

const setDefaultValue = () => {

};

const nextFrame = () => {
    frame.current = (frame.current + 1) % frame.max;
    const currentGlb = info.glbMetaDataFileNames[frame.current];
    const glbFileName = currentGlb.glbFileName;
    const maxValue = currentGlb.maxValue;
    const glbUrl = `/marching-cube-sample/${glbFileName}`;

    console.log(`Loading GLB: ${glbUrl} with maxValue: ${maxValue}`);
    modelSwapAnimator.loadModel(glbUrl, maxValue);
};

document.querySelector("#start").addEventListener("click", async () => {
    const button = document.querySelector("#start");
    if (frame.interval) {
        clearInterval(frame.interval);
        frame.interval = null;
        console.log("Interval cleared");
    }

    if (button.textContent === "Start") {
        button.textContent = "Stop";
        console.log("Interval started");
        frame.interval = setInterval(async () => {
            nextFrame();
        }, 300);
    } else {
        button.textContent = "Start";
    }
});

document.querySelector("#next-frame").addEventListener("click", async () => {
    console.log("Next Frame button clicked");
    nextFrame();
});

init();