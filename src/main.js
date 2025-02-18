import './css/css-init.css'
import './css/custom.css'
import {Viewer} from "cesium";
import {MagoViewer} from "./cesium/MagoViewer.js";
import {MagoSimulation} from "./cesium/MagoSimulation.js";
import {MagoWaterSimulation} from "./cesium/water/MagoWaterSimulation.js";
import * as Cesium from "cesium";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago3D Water Simulation</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h2>WaterSimulation</h2>
    <p>Water simulation on the globe</p>
    <button id="start">Start</button>
    <button id="stop">Stop</button>
    <span class="line"></span>
    <button id="clearWater">ClearWater</button>
    <button id="simulationRectangle">Select Area</button>
    <span class="line"></span>
    <button id="reload">Reload</button>
    <span class="line"></span>
    <button id="wireframe">Wireframe</button>
    <button id="heightLegend">Height Legend</button>
    <span class="line"></span>
    <label for="gridSize">Grid Size : </label>
    <select id="gridSize">
        <option value="128">128</option>
        <option value="256">256</option>
        <option value="512">512</option>
        <option value="1024">1024</option>
    </select>
    <span class="line"></span>
    <label for="cellSize">Cell Size : </label>
    <select id="cellSize">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="4">4</option>
        <option value="8">8</option>
    </select>
    <span class="line"></span>
    <h2>Water Source</h2>
    <button id="clearWaterSource">ClearWaterSource</button>
    <span class="line"></span>
    <button id="createWaterSource">Create WaterSource</button>
    <span class="line"></span>
    <label for="water">Water: </label>
    <input type="range" id="water" value="0.0" step="0.1" min="0.0" max="100.0">
    <input type="text" id="waterValue" readonly>
    <span class="line"></span>
    <button id="createWaterspout">Create Waterspout</button>
    <span class="line"></span>
    <label for="waterspout">Waterspout: </label>
    <input type="range" id="waterspout" value="0.0" step="0.1" min="0.0" max="100.0">
    <input type="text" id="waterspoutValue" readonly>
    <span class="line"></span>
    <button id="createSeaWall">Create SeaWall</button>
    <span class="line"></span>
    <h2>Rainfall</h2>
    <input type="range" id="rainfall" value="0.0" step="0.001" min="0.0" max="10.0">
    <input type="text" id="rainfallValue" readonly>
    <span class="line"></span>
    <label for="color">Water Color : </label>
    <input type="color" id="color" value="#ff0000">
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
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.scene.globe.enableLighting = false;
const shadowMap = viewer.shadowMap;
shadowMap.enabled = true;
shadowMap.size = 1024 * 4;
shadowMap.maximumDistance = 20000;
shadowMap.darkness = 0.5;

const [lon, lat] = [126.968905, 37.447571];

const options = {
    lon : lon,
    lat : lat,
    gridSize : 512,
    cellSize : 1.0,
};

const magoWaterSimulation = new MagoWaterSimulation(viewer);
const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    magoViewer.init();
    //magoViewer.addRandomPoints(1000,"#ffff00");

    //const magoPostRenderer = new MagoPostRender(viewer);

    setDefaultValue();

    const magoSimulation = new MagoSimulation(viewer);
    magoSimulation.flyTo(lon, lat, 1000);
    magoSimulation.createAsset(lon, lat);
    //await magoSimulation.setTerrain('http://localhost:9090/data/open-data-korea-terrain/');
    await magoSimulation.setTerrain('http://175.197.92.213:10110/korea_5m_dem_4326_ms8/');
    magoSimulation.createVworldImageryLayer('Satellite', 'jpeg');

    refreshRectangle();

    //magoWaterSimulation.init(viewer);
    await magoWaterSimulation.initBase(options);
    magoWaterSimulation.start();
}

const setDefaultValue = () => {
    document.querySelector('#water').value = magoWaterSimulation.options.waterSourceAmount;
    document.querySelector('#waterValue').value = magoWaterSimulation.options.waterSourceAmount;

    document.querySelector('#waterspout').value = magoWaterSimulation.options.waterMinusSourceAmount;
    document.querySelector('#waterspoutValue').value = magoWaterSimulation.options.waterMinusSourceAmount;

    document.querySelector('#rainfall').value = magoWaterSimulation.options.rainMaxPrecipitation;
    document.querySelector('#rainfallValue').value = magoWaterSimulation.options.rainMaxPrecipitation;

    document.querySelector('#gridSize').value = magoWaterSimulation.options.gridSize;
    document.querySelector('#cellSize').value = magoWaterSimulation.options.cellSize;

    document.querySelector('#color').value = magoWaterSimulation.options.waterColor.toCssHexString();
}

// event listeners
document.querySelector('#start').addEventListener('click', () => {
    magoWaterSimulation.start();
});
document.querySelector('#stop').addEventListener('click', () => {
    magoWaterSimulation.stop();
});
document.querySelector('#clearWater').addEventListener('click', async () => {
    await magoWaterSimulation.initializeWater();
});
document.querySelector('#reload').addEventListener('click', async () => {
    await magoWaterSimulation.init(viewer);
    await magoWaterSimulation.initBase(options);
    magoWaterSimulation.start();
});
document.querySelector('#gridSize').addEventListener('change', async (event) => {
    const gridSize = event.target.value;
    options.gridSize = Number(gridSize);
    refreshRectangle();
});
document.querySelector('#cellSize').addEventListener('change', async (event) => {
    const cellSize = event.target.value;
    options.cellSize = Number(cellSize);
    refreshRectangle();
});
document.querySelector('#wireframe').addEventListener('click', () => {
    if (magoWaterSimulation.gridPrimitive) {
        magoWaterSimulation.gridPrimitive.debugWireframe = !magoWaterSimulation.gridPrimitive.debugWireframe;
    }
});
document.querySelector('#heightLegend').addEventListener('click', () => {
    magoWaterSimulation.options.heightPalette = !magoWaterSimulation.options.heightPalette;
});

document.querySelector('#water').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#waterValue').value = value;
    magoWaterSimulation.options.waterSourceAmount = value;
});

document.querySelector('#waterspout').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#waterspoutValue').value = value;
    magoWaterSimulation.options.waterMinusSourceAmount = value;
});

document.querySelector('#rainfall').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#rainfallValue').value = value;
    magoWaterSimulation.options.rainMaxPrecipitation = value;
});

const selectionStatus = {
    rectangle: undefined,
    sourcePositions: [],
    sourceMinusPositions: [],
    seaWallPositions: [],
    handler: undefined,
}

document.querySelector('#clearWaterSource').addEventListener('click', () => {
    if (selectionStatus.sourcePositions.length > 0) {
        selectionStatus.sourcePositions.forEach((entity) => {
            viewer.entities.remove(entity);
        });
        selectionStatus.sourcePositions = [];
    }
    if (selectionStatus.sourceMinusPositions.length > 0) {
        selectionStatus.sourceMinusPositions.forEach((entity) => {
            viewer.entities.remove(entity);
        });
        selectionStatus.sourceMinusPositions = [];
    }
    if (selectionStatus.seaWallPositions.length > 0) {
        selectionStatus.seaWallPositions.forEach((entity) => {
            viewer.entities.remove(entity);
        });
        selectionStatus.seaWallPositions = [];
    }
    magoWaterSimulation.clearWaterSourcePositions();
    magoWaterSimulation.clearWaterMinusSourcePositions();
    magoWaterSimulation.clearSeaWallPositions();
});

document.querySelector('#createWaterSource').addEventListener('click', () => {
    viewer.scene.canvas.style.cursor = 'crosshair';

    if (selectionStatus.handler) {
        selectionStatus.handler.destroy();
        selectionStatus.handler = undefined;
        viewer.scene.canvas.style.cursor = 'default';
    } else {
        selectionStatus.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        let handler = selectionStatus.handler;
        handler.setInputAction(function(event) {
            let ray = viewer.camera.getPickRay(event.position);
            let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                console.log(longitudeString.toFixed(6), latitudeString.toFixed(6));

                const lon = Number(longitudeString.toFixed(6));
                const lat = Number(latitudeString.toFixed(6));
                const center = magoWaterSimulation.addWaterSourcePosition(lon, lat);
                selectionStatus.sourcePositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    cylinder: {
                        length: 30.0 * options.cellSize,
                        topRadius: 3.0 * options.cellSize,
                        bottomRadius: 3.0 * options.cellSize,
                        material: Cesium.Color.BLUE,
                    },
                }));
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
});

document.querySelector("#color").addEventListener('change', (event) => {
    const color = event.target.value;
    const waterColor = Cesium.Color.fromCssColorString(color);
    magoWaterSimulation.options.waterColor = waterColor;
});

document.querySelector('#createWaterspout').addEventListener('click', () => {
    viewer.scene.canvas.style.cursor = 'crosshair';

    if (selectionStatus.handler) {
        selectionStatus.handler.destroy();
        selectionStatus.handler = undefined;
        viewer.scene.canvas.style.cursor = 'default';
    } else {
        selectionStatus.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        let handler = selectionStatus.handler;
        handler.setInputAction(function(event) {
            let ray = viewer.camera.getPickRay(event.position);
            let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                console.log(longitudeString.toFixed(6), latitudeString.toFixed(6));

                const lon = Number(longitudeString.toFixed(6));
                const lat = Number(latitudeString.toFixed(6));

                const center = magoWaterSimulation.addWaterMinusSourcePosition(lon, lat);
                selectionStatus.sourceMinusPositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    cylinder: {
                        length: 30.0 * options.cellSize,
                        topRadius: 3.0 * options.cellSize,
                        bottomRadius: 3.0 * options.cellSize,
                        material: Cesium.Color.RED,
                    },
                }))
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
});

document.querySelector('#createSeaWall').addEventListener('click', () => {
    viewer.scene.canvas.style.cursor = 'crosshair';

    if (selectionStatus.handler) {
        selectionStatus.handler.destroy();
        selectionStatus.handler = undefined;
        viewer.scene.canvas.style.cursor = 'default';
    } else {
        selectionStatus.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        let handler = selectionStatus.handler;
        handler.setInputAction(function(event) {
            let ray = viewer.camera.getPickRay(event.position);
            let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                console.log(longitudeString.toFixed(6), latitudeString.toFixed(6));

                const lon = Number(longitudeString.toFixed(6));
                const lat = Number(latitudeString.toFixed(6));
                const center = magoWaterSimulation.addSeaWallPosition(lon, lat);

                selectionStatus.seaWallPositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    box: {
                        dimensions: new Cesium.Cartesian3(9.0 * options.cellSize, 9.0 * options.cellSize, 40.0 * options.cellSize),
                        material: Cesium.Color.DARKGRAY.withAlpha(0.75),
                        /*outline: true,*/
                    }
                }))
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
});

const refreshRectangle = () => {
    const extent = magoWaterSimulation.calcExtent(options);
    if (selectionStatus.rectangle) {
        viewer.entities.remove(selectionStatus.rectangle);
    }
    const rectangle = magoWaterSimulation.createRectangle(extent);
    selectionStatus.rectangle = rectangle;
}

document.querySelector('#simulationRectangle').addEventListener('click', () => {
    viewer.scene.canvas.style.cursor = 'crosshair';

    if (selectionStatus.handler) {
        selectionStatus.handler.destroy();
        selectionStatus.handler = undefined;
        viewer.scene.canvas.style.cursor = 'default';
    } else {
        selectionStatus.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        let handler = selectionStatus.handler;
        handler.setInputAction(function(event) {
            let ray = viewer.camera.getPickRay(event.position);
            let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
                const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
                console.log(longitudeString.toFixed(6), latitudeString.toFixed(6));

                const lon = Number(longitudeString.toFixed(6));
                const lat = Number(latitudeString.toFixed(6));
                options.lon = lon;
                options.lat = lat;
                refreshRectangle();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
});

init();