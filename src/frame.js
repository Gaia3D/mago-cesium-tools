import './css/css-init.css'
import './css/custom.css'
import {Viewer} from "cesium";
import {MagoViewer} from "./modules/MagoViewer.js";
import {MagoFluid} from "./modules/fluid/MagoFluid.js";
import * as Cesium from "cesium";
import {MagoEdge} from "./modules/render/MagoEdge.js";
import {MagoSSAO} from "./modules/render/MagoSSAO.js";
import {MagoWind} from "@/modules/wind/MagoWind.js";
import JSZip from "jszip";
import {MagoFrame} from "@/modules/fluid/MagoFrame.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (Fluid Frame)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>Controller</h3>
    <button id="start">Start</button>
    <button id="stop">Stop</button>
    <button id="reload">Reset</button>
    <span class="line"></span>
    <h3>Visualization</h3>
    <div>
        <button id="wireframe">Wireframe</button>
        <button id="heightLegend">Height Legend</button>
    </div>
    <div>
        <label for="color">Water Color : </label>
        <input type="color" id="color" value="#ff0000">
    </div>
    <!-- intensity -->
    <div>
        <label for="intensity">Intensity : </label>
        <input type="range" id="intensity" value="1.0" step="0.1" min="0.1" max="30.0">
        <input type="text" id="intensityValue" readonly>
    </div>
    <div>
        <label for="brightness">Brightness : </label>
        <input type="range" id="brightness" value="1.0" step="0.1" min="0.1" max="2.0">
        <input type="text" id="brightnessValue" readonly>
    </div>
    <div>
        <label for="maxOpacity">Max Opacity : </label>
        <input type="range" id="maxOpacity" value="0.8" step="0.01" min="0.0" max="1.0">
        <input type="text" id="maxOpacityValue" readonly>
    </div>
    <span class="line"></span>
 </div>
 <div id="timeSliderWrap">
    <div id="timeSlider">
        <input type="range" id="timeSliderInput" value="0" step="1" min="0" max="60">
    </div>
    <input type="text" id="timeSliderValue" readonly>
    <button id="timeSliderButton">Start</button>
 </div>
`

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
const options = {
    lon : lon,
    lat : lat,
    gridSize : 512,
    cellSize : 1.0,
};

const timeInfo = {
    start: 0,
    end: 100,
    current: 0,
}

const fluid = new MagoFrame(viewer);

const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    await magoViewer.createVworldImageryLayerWithoutToken('Satellite', 'jpeg');
    await magoViewer.changeTerrain('http://175.197.92.213:10110/korea_5m_dem_4326_ms8/');

    const infoJson = await fetch('sample/info.json');
    const info = await infoJson.json();
    options.lon = info.lon;
    options.lat = info.lat;
    options.gridSize = info.gridSize;
    options.cellSize = info.cellSize;

    magoViewer.initPosition(options.lon, options.lat, 1000.0);

    setDefaultValue();
    refreshRectangle();

    //console.log(info)

    //fluid

    //magoViewer.initPosition(info.lon, info.lat, 1000.0);
    await fluid.initBase(options);
    fluid.start();

    let interval = info.interval;
    let start = 0;
    let end = info.count;
    let count = 0;

    //fluid.currentFrame = 0;
    fluid.frameNumber = 0;
    fluid.frameUrl = `sample/0.bin`;
    setFrame(0)
    fluid.terrainUrl = `sample/terrain.bin`;


    document.querySelector('#timeSliderInput').max = end;
}

const setDefaultValue = () => {
    document.querySelector('#color').value = fluid.options.waterColor.toCssHexString();

    document.querySelector('#intensity').value = fluid.options.colorIntensity;
    document.querySelector('#intensityValue').value = fluid.options.colorIntensity;

    document.querySelector('#brightness').value = fluid.options.waterBrightness;
    document.querySelector('#brightnessValue').value = fluid.options.waterBrightness;

    document.querySelector('#maxOpacity').value = fluid.options.maxOpacity;
    document.querySelector('#maxOpacityValue').value = fluid.options.maxOpacity;
}

document.querySelector('#wireframe').addEventListener('click', () => {
    if (fluid.gridPrimitive) {
        fluid.gridPrimitive.debugWireframe = !fluid.gridPrimitive.debugWireframe;
    }
});

document.querySelector('#heightLegend').addEventListener('click', () => {
    fluid.options.heightPalette = !fluid.options.heightPalette;
});

document.querySelector('#intensity').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#intensityValue').value = value;
    fluid.options.colorIntensity = value;
});

document.querySelector('#brightness').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#brightnessValue').value = value;
    fluid.options.waterBrightness = value;
});

document.querySelector('#maxOpacity').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#maxOpacityValue').value = value;
    fluid.options.maxOpacity = value;
});

document.querySelector("#color").addEventListener('change', (event) => {
    const color = event.target.value;
    const waterColor = Cesium.Color.fromCssColorString(color);
    fluid.options.waterColor = waterColor;
});

const refreshRectangle = () => {
    const extent = fluid.calcExtent(options);
    const rectangle = fluid.createRectangle(extent);
}

const animationStatus = {
    recentFrame: 0,
    isStart: false,
    interval: undefined,
}

const setFrame = (count) => {
    const url = `sample/${count}.bin`;
    fluid.frameUrl = url;
    fluid.frameNumber = count;
    animationStatus.recentFrame = count;

    const max = document.querySelector('#timeSliderInput').max;
    document.querySelector('#timeSliderInput').value = count;
    document.querySelector('#timeSliderValue').value = `${count}/${max}`;
};

document.querySelector('#timeSliderInput').addEventListener('input', (event) => {
    animationStatus.isStart = false;
    clearInterval(animationStatus.interval);
    animationStatus.interval = undefined;
    document.querySelector('#timeSliderButton').innerText = 'Start';

    console.log(event.target.value);
    const value = parseInt(event.target.value);

    setFrame(value);

    /*const url = `sample/${value}.bin`;
    //fluid.currentFrame = value;
    fluid.frameNumber = value;
    fluid.frameUrl = url;
    animationStatus.recentFrame = value;*/

    document.querySelector('#timeSliderValue').value = `${value}/${event.target.max}`;
});

document.querySelector('#timeSliderButton').addEventListener('click', (event) => {
    if (animationStatus.isStart) {
        clearInterval(animationStatus.interval);
        animationStatus.interval = undefined;
        event.target.innerText = 'Start';
    } else {
        const max = document.querySelector('#timeSliderInput').max;
        let count = animationStatus.recentFrame;
        animationStatus.interval = setInterval(() => {
            if (count > max) {
                count = 0;
            }
            //document.querySelector('#timeSliderInput').value = count;
            //document.querySelector('#timeSliderValue').value = `${count}/${max}`;

            setFrame(count);

            /*const url = `sample/${count}.bin`;
            fluid.frameUrl = url;
            fluid.frameNumber = count;
            animationStatus.recentFrame = count;*/
            count++;
        }, 1000);
        event.target.innerText = 'Stop';
    }
    animationStatus.isStart = !animationStatus.isStart;
});

init();