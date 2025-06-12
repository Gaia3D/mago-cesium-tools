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
    <button id="previous-frame" class="btn">Previous Frame</button>
    <button id="next-frame" class="btn">Next Frame</button>
    <span class="line"></span>
    <div>
        <label for="sampling-count">Sampling Count: </label>
        <input type="range" id="sampling-range" min="0" max="100" value="10">
        <input type="text" id="sampling-count" readonly>
    </div>
    <span class="line"></span>
 </div>
  <div id="timeSliderWrap">
    <div id="timeSlider">
        <input type="range" id="timeSliderInput" value="0" step="1" min="0" max="360">
        <span id="timeSliderBufferingBar" class="bufferingBar"></span>
    </div>
    <input type="text" id="timeSliderValue" readonly>
    <button id="timeSliderButton">Start</button>
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

const magoTools = new MagoTools(viewer);
let volumeRenderer = undefined;
let modelSwapAnimator = undefined;

const init = async () => {
    await magoTools.createMaptilerImageryProvider();
    await magoTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    const buildings = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/NGII_BUILDINGS/tileset.json", {});
    viewer.scene.primitives.add(buildings);

    const projectFolderPath = "/volume-render-chemical-diffusion/";
    //const projectFolderPath = "/volume-render-air-pollution/";
    const res = await fetch(projectFolderPath + "index.json");
    const json = await res.text();
    const jsonIndex = JSON.parse(json);
    console.log(jsonIndex);

    const lon = jsonIndex.centerGeographicCoord.longitude;
    const lat = jsonIndex.centerGeographicCoord.latitude;
    const altitude = jsonIndex.centerGeographicCoord.altitude;
    magoTools.initPosition(lon, lat, altitude + 1000.0);

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
    volumeRenderer.currentIndex = 33;
    const primitiveCollection = volumeRenderer.getPrimitiveCollection();
    viewer.scene.primitives.add(primitiveCollection);

    //const center = Cesium.Cartesian3.fromDegrees(lon, lat);
    //const modelOptions = {center};
    //modelSwapAnimator = new ModelSwapAnimator(viewer, modelOptions);

    //const maxValue = 0.484;
    //const glbUrl = "/marching-cube-sample/airPollution_20081911.glb";
    //modelSwapAnimator.loadModel(glbUrl, maxValue);

    setDefaultValue();
    if (!viewer.scene.clampToHeightSupported) {
        window.alert("This browser does not support clampToHeightMostDetailed.");
    }
};

const setDefaultValue = () => {
    if (volumeRenderer) {
        let defaultSamplingCount = volumeRenderer.samplingCount;
        let defaultSamplingCountMax = volumeRenderer.mosaicTextureMetaDatas.length - 1;

        document.querySelector("#sampling-range").value = defaultSamplingCount;
        document.querySelector("#sampling-count").value = defaultSamplingCount;
        document.querySelector("#timeSliderInput").max = defaultSamplingCountMax;
        document.querySelector("#timeSliderInput").value = 0;
        document.querySelector("#timeSliderValue").value = `0/${defaultSamplingCountMax}`;
        document.querySelector("#timeSliderBufferingBar").style.width = "0%";
    }
};

const setFrame = (value) => {
    if (volumeRenderer) {
        volumeRenderer.currentIndex = value;
        document.querySelector("#timeSliderValue").value = `${value}/${document.querySelector("#timeSliderInput").max}`;
    }
};

const nextFrame = () => {
    if (volumeRenderer) {
        volumeRenderer.addIndex();
        console.log(volumeRenderer.currentIndex);
    }
};

const previousFrame = () => {
    if (volumeRenderer) {
        volumeRenderer.subIndex();
        console.log(volumeRenderer.currentIndex);
    }
};

const animator = {
    playInterval: undefined,

};

document.querySelector("#start").addEventListener("click", async () => {
    if (animator.playInterval) {
        animator.isStart = false;
        clearInterval(animator.playInterval);
        animator.playInterval = undefined;
    } else {
        animator.isStart = true;
        animator.playInterval = setInterval(() => {
            nextFrame();
        }, 300);
    }
});

document.querySelector("#previous-frame").addEventListener("click", async () => {
    previousFrame();
});

document.querySelector("#next-frame").addEventListener("click", async () => {
    nextFrame();
});

document.querySelector("#sampling-range").addEventListener("input", (event) => {
    const samplingCount = event.target.value;
    document.querySelector("#sampling-count").value = samplingCount;
    if (volumeRenderer) {
        volumeRenderer.samplingCount = samplingCount;
    }
});

const setBufferBar = (max, value) => {
    const bufferingBar = document.querySelector("#timeSliderBufferingBar");
    const percent = (value / max) * 100;
    bufferingBar.style.width = `${percent}%`;
};

document.querySelector("#timeSliderInput").addEventListener("input", (event) => {
    document.querySelector("#timeSliderButton").innerText = "Start";

    console.log(event.target.value);
    const value = parseInt(event.target.value);

    setFrame(value);
    document.querySelector("#timeSliderValue").value = `${value}/${event.target.max}`;
});

document.querySelector("#timeSliderButton").addEventListener("click", (event) => {
    if (animator.isStart) {
        clearInterval(animator.playInterval);
        animator.playInterval = undefined;
        event.target.innerText = "Start";
    } else {
        const max = document.querySelector("#timeSliderInput").max;
        let count = animationStatus.recentFrame;
        animator.playInterval = setInterval(() => {
            if (count > max) {
                count = 0;
            }
            // document.querySelector('#timeSliderInput').value = count;
            // document.querySelector('#timeSliderValue').value = `${count}/${max}`;

            setFrame(count);

            /* const url = `sample/${count}.bin`;
            fluid.frameUrl = url;
            fluid.frameNumber = count;
            animationStatus.recentFrame = count;*/
            count++;
        }, 100);
        event.target.innerText = "Stop";
    }
    animator.isStart = !animator.isStart;
});

init();