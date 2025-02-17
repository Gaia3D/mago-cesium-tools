import './css/style.css'
import './css/custom.css'
import {Viewer} from "cesium";
import {MagoViewer} from "./cesium/MagoViewer.js";
import {MagoSimulation} from "./cesium/MagoSimulation.js";
import {MagoPostRender} from "./cesium/MagoPostRender.js";
import {MagoWaterSimulation} from "./cesium/water/MagoWaterSimulation.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <button>Toggle Outline</button>
    <button>Toggle Screen Space Occlusion</button>
    <button id="start">Start</button>
    <button id="stop">Stop</button>
    <button id="reset">Reset</button>
    <button id="wireframe">Wireframe</button>
    <button id="heightLegend">Height Legend</button>
    <select id="gridSize">
        <option value="128">128</option>
        <option value="256">256</option>
        <option value="512">512</option>
        <option value="1024">1024</option>
    </select>
    <select id="cellSize">
        <option value="0.5">0.5</option>
        <option value="1.0">1.0</option>
        <option value="2.0">2.0</option>
        <option value="4.0">4.0</option>
        <option value="8.0">8.0</option>
    </select>
    <button id="moveWater">Move Water</button>
</select>
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

const [lon, lat] = [126.951856, 37.456543];

const magoWaterSimulation = new MagoWaterSimulation(viewer);
const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    magoViewer.init();
    magoViewer.addRandomPoints(1000,"#ffff00");

    const magoPostRenderer = new MagoPostRender(viewer);

    const magoSimulation = new MagoSimulation(viewer);
    magoSimulation.flyTo(lon, lat, 1000);
    magoSimulation.createAsset(lon, lat);
    await magoSimulation.setTerrain('http://localhost:9090/data/open-data-korea-terrain/');
    magoSimulation.createVworldImageryLayer('Satellite', 'jpeg');

    const options = {
        lon : lon,
        lat : lat,
        gridSize : 128,
        cellSize : 1.0,
    };
    //magoWaterSimulation.init(viewer);
    await magoWaterSimulation.initBase(options);
    magoWaterSimulation.stop();
}

// event listeners
document.querySelector('#start').addEventListener('click', () => {
    magoWaterSimulation.start();
});
document.querySelector('#stop').addEventListener('click', () => {
    magoWaterSimulation.stop();
});
document.querySelector('#reset').addEventListener('click', async () => {
    await magoWaterSimulation.initializeWater();
});
document.querySelector('#gridSize').addEventListener('change', async (event) => {
    const gridSize = event.target.value;
    magoWaterSimulation.gridSize = gridSize;
});
document.querySelector('#cellSize').addEventListener('change', async (event) => {
    const cellSize = event.target.value;
    magoWaterSimulation.cellSize = cellSize;
});
document.querySelector('#wireframe').addEventListener('click', () => {
    if (magoWaterSimulation.gridPrimitive) {
        magoWaterSimulation.gridPrimitive.debugWireframe = !magoWaterSimulation.gridPrimitive.debugWireframe;
    }
});
document.querySelector('#heightLegend').addEventListener('click', () => {
    magoWaterSimulation.options.heightPalette = !magoWaterSimulation.options.heightPalette;
});
document.querySelector('#moveWater').addEventListener('click', () => {
    const [lon, lat] = [126.951856, 37.456543];
    magoWaterSimulation.setWaterSourcePosition(lon, lat);
});

init();