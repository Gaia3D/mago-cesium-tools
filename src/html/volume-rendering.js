import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {VolumetricRenderer} from "@/modules/volumeRendering/VolumetricRenderer.js";
import {ModelSwapAnimator} from "@/modules/model/ModelSwapAnimator.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (☁️ Volume-Rendering)</h1>
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
    current: 0, max: 8, interval: null,
};

const magoTools = new MagoTools(viewer);
let volumeRenderer = undefined;
let modelSwapAnimator = undefined;

const init = async () => {
    //await magoViewer.createMaptilerImageryProvider();
    await magoTools.createMaptilerImageryProvider();
    //await magoTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    //const tree = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/FOREST_MAP/tileset.json");
    //viewer.scene.primitives.add(tree);
    const buildings = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/NGII_BUILDINGS/tileset.json", {});
    viewer.scene.primitives.add(buildings);
    magoTools.initPosition(lon, lat, 1000.0);

    //const projectFolderPath = "/volume-render-chemical-diffusion/";
    const projectFolderPath = "/volume-render-air-pollution/";
    const res = await fetch(projectFolderPath + "index.json");
    const json = await res.text();
    const jsonIndex = JSON.parse(json);
    let pngsBinBlockFileNames = jsonIndex.pngsBinBlockFileNames;
    let pngsBinBlockFileNamesCount = pngsBinBlockFileNames.length;
    let pngsBinBlocksArray = [];
    for (let i = 0; i < pngsBinBlockFileNamesCount; i++) {
        let pngsBinBlockFileName = pngsBinBlockFileNames[i];
        let pngsBinBlock = {
            fileName: pngsBinBlockFileName.fileName, dataArraybuffer: undefined,
        };
        pngsBinBlocksArray.push(pngsBinBlock);
    }

    for (let i = 0; i < pngsBinBlockFileNamesCount; i++) {
        let pngsBinBlock = pngsBinBlocksArray[i];
        let filePath = projectFolderPath + "/" + pngsBinBlock.fileName;
        const res = await fetch(filePath);
        pngsBinBlock.dataArraybuffer = await res.arrayBuffer();
    }

    const options = {
        projectFolderPath: projectFolderPath,
        pngsBinBlocksArray: pngsBinBlocksArray,
        jsonIndex: jsonIndex,
    };
    volumeRenderer = new VolumetricRenderer(viewer, options);
    await volumeRenderer.init();
    volumeRenderer.currentIdx = 33;
    const primitiveCollection = volumeRenderer.getPrimitiveCollection();
    viewer.scene.primitives.add(primitiveCollection);

    const center = Cesium.Cartesian3.fromDegrees(lon, lat);
    const modelOptions = {center};
    modelSwapAnimator = new ModelSwapAnimator(viewer, modelOptions);

    const maxValue = 0.484;
    const glbUrl = "/marching-cube-sample/airPollution_20081911.glb";
    modelSwapAnimator.loadModel(glbUrl, maxValue);

    setDefaultValue();
    if (!viewer.scene.clampToHeightSupported) {
        window.alert("This browser does not support clampToHeightMostDetailed.");
    }
};

const setDefaultValue = () => {

};

const nextFrame = () => {
    if (volumeRenderer) {
        volumeRenderer.addIndex();
        console.log(volumeRenderer.currentIdx);
    }
};

const animator = {
    playInterval: undefined,
};

document.querySelector("#start").addEventListener("click", async () => {
    if (animator.playInterval) {
        clearInterval(animator.playInterval);
        animator.playInterval = undefined;
    } else {
        animator.playInterval = setInterval(() => {
            nextFrame();
        }, 300);
    }
});

document.querySelector("#next-frame").addEventListener("click", async () => {
    nextFrame();
});

init();