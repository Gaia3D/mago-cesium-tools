import './css/css-init.css'
import './css/custom.css'
import {Viewer} from "cesium";
import {MagoViewer} from "./modules/MagoViewer.js";
import {MagoFluid} from "./modules/fluid/MagoFluid.js";
import * as Cesium from "cesium";
import {MagoEdge} from "./modules/render/MagoEdge.js";
import {MagoSSAO} from "./modules/render/MagoSSAO.js";
import {MagoWind} from "@/modules/wind/MagoWind.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>Initialization</h3>
    <button id="simulationRectangle">Select Area</button>
    <span class="line"></span>
    <div>
        <label for="gridSize">Grid Size : </label>
        <select id="gridSize">
            <!--<option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>-->
            <option value="64">64</option>
            <option value="128">128</option>
            <option value="256">256</option>
            <option value="512">512</option>
            <option value="1024">1024</option>
            <option value="2048">2048</option>
            <option value="4096">4096</option>
        </select>
    </div>
    <div>
        <label for="cellSize">Cell Size : </label>
        <select id="cellSize">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
            <option value="128">128</option>
            <!--<option value="256">256</option>
            <option value="512">512</option>
            <option value="1024">1024</option>-->
        </select>
    </div>
    <span class="line"></span>
    <h3>Controller</h3>
    <button id="start">Start</button>
    <button id="stop">Stop</button>
    <button id="reload">Reset</button>
    <span class="line"></span>
    <div>
        <label for="interval">Interval : </label>
        <input type="range" id="interval" value="60" step="1" min="1" max="120">
        <input type="text" id="intervalValue" readonly>
    </div>
    <div>
        <label for="timeStep">Time Step : </label>
        <input type="range" id="timeStep" value="0.1" step="0.001" min="0.0" max="0.2">
        <input type="text" id="timeStepValue" readonly>
    </div>
    <div>
        <label for="waterDensity">Water Density : </label>
        <input type="range" id="waterDensity" value="998.0" step="1.0" min="1.0" max="1000.0">
        <input type="text" id="waterDensityValue" readonly>
    </div>
    <div>
        <label for="cushionFactor">Cushion Factor : </label>
        <input type="range" id="cushionFactor" value="0.995" step="0.001" min="0.5" max="1.0">
        <input type="text" id="cushionFactorValue" readonly>
    </div>
    <span class="line"></span>
    <h3>Visualization</h3>
    <div>
        <label for="saveImage">Save Image : </label>
        <button id="saveImage">Save Image</button>
    </div>
    <div>
        <button id="wireframe">Wireframe</button>
        <button id="heightLegend">Height Legend</button>
    </div>
    <div>
        <button id="waterSkirt">Water Skirt</button>
        <button id="simulationConfine">Simulation Confine</button>
    </div>
    <div>
        <label for="color">Water Color : </label>
        <input type="color" id="color" value="#ff0000">
    </div>
    <!-- intensity -->
    <div>
        <label for="intensity">Intensity : </label>
        <input type="range" id="intensity" value="1.0" step="0.1" min="0.1" max="2.0">
        <input type="text" id="intensityValue" readonly>
    </div>
    <div>
        <label for="brightness">Brightness : </label>
        <input type="range" id="brightness" value="1.0" step="0.1" min="0.1" max="2.0">
        <input type="text" id="brightnessValue" readonly>
    </div>
    <span class="line"></span>
    <h3>Water Source</h3>
    <button id="createWaterSource">Create WaterSource</button>
    <div>
        <label for="water">Water : </label>
        <input type="range" id="water" value="0.0" step="0.1" min="0.0" max="100.0">
        <input type="text" id="waterValue" readonly>
    </div>
    <span class="line"></span>
    <h3>Waterspout</h3>
    <button id="createWaterspout">Create Waterspout</button>
    <div>
        <label for="waterspout">Waterspout : </label>
        <input type="range" id="waterspout" value="0.0" step="0.1" min="0.0" max="100.0">
        <input type="text" id="waterspoutValue" readonly>
    </div>
    <span class="line"></span>
    <button id="createSeaWall">Create SeaWall</button>
    <span class="line"></span>
    <button id="clearWaterSource">ClearWaterSource</button>
    <button id="clearWater">ClearWater</button>
    <span class="line"></span>
    <h2>Rainfall</h2>
    <div>
        <label for="rainfall">Rainfall : </label>
        <input type="range" id="rainfall" value="0.0" step="0.001" min="0.0" max="10.0">
        <input type="text" id="rainfallValue" readonly>
    </div>
    <div>
        <label for="evaporation">Evaporation Rate : </label>
        <input type="range" id="evaporation" value="0.0" step="0.0001" min="0.0" max="0.01">
        <input type="text" id="evaporationValue" readonly>
    </div>
    <span class="line"></span>
    <p id="totalWaterAmount">0</p>
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
/*const shadowMap = viewer.shadowMap;
shadowMap.enabled = true;
shadowMap.size = 1024 * 4;
shadowMap.maximumDistance = 20000;
shadowMap.darkness = 0.5;*/

const [lon, lat] = [126.968905, 37.447571];
const options = {
    lon : lon,
    lat : lat,
    gridSize : 512,
    cellSize : 1.0,
};

const fluid = new MagoFluid(viewer);
const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    await magoViewer.createVworldImageryLayerWithoutToken('Satellite', 'jpeg');
    await magoViewer.changeTerrain('http://175.197.92.213:10110/korea_5m_dem_4326_ms8/');
    magoViewer.initPosition(lon, lat, 1000.0);

    setDefaultValue();
    refreshRectangle();

    await fluid.initBase(options);
    fluid.start();
    fluid.addRandomSourcePosition();

    // test data
    const dimension = [601, 351] //[5, 5];
    const boundary = [
        [95, 20],
        [155, 20],
        [155, 55],
        [95, 55]
    ];
    const testlevels = [30, 50];
    //const testlevels = [30, 50, 70, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 925];
    const testData = await Promise.all(testlevels.map(async (level) => {
        const res = await fetch(`/wind/${level}`)
        const json = await res.text();
        const obj = JSON.parse(json);
        return obj
    }))

    const levels = testData.map(obj => obj.altitudesOfLevel[1] * 100) // [30, 50, 70, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 925].map(v => v * 100 * 32);//new Array(20).fill().map((e, i) => (i + 2) * 400000)
    const uvws = {
        u: levels.map((level, i) => {
            return testData[i].U1;
        }),
        v: levels.map((level, i) => {
            return testData[i].V1;
        }),
        w: levels.map((level, i) => {
            return testData[i].W1;
        }),
    }

    const windOptions = {
        dimension: dimension,       // grid 격자 수 [x,y]
        levels: levels,             // grid 고도 [ (altitude of grid[0]), ... ]
        uvws: uvws,                 // 각 grid의 uvw [ { u:[...], v:[...], w:[...] }, ... ]
        boundary: boundary,         // grid의 lonlat 바운더리 [ [lon, lat](leftlow), (rightlow), (righthigh), (lefthigh) ]
        textureSize: 512,           // 파티클 수 = (textureSize * textureSize)
        speedFactor: 500.0,        // 파티클 속도 계수
        renderingType: 'triangle',  // 렌더링 타입 ('point', 'line', 'triangle' 중 하나)
        point: {
            pointSize: 2,
        },
        triangle: {
            // 렌더링 타입 'triangle'의 옵션
            lineWidth: 1000,
        }
    }
    const wind = new MagoWind(viewer);
    await wind.init(windOptions);
    const windPrimitives = await wind.getPrimitiveCollection();
    console.log(windPrimitives)
    viewer.scene.primitives.add(windPrimitives);
}

const setDefaultValue = () => {
    document.querySelector('#water').value = fluid.options.waterSourceAmount;
    document.querySelector('#waterValue').value = fluid.options.waterSourceAmount;

    document.querySelector('#waterspout').value = fluid.options.waterMinusSourceAmount;
    document.querySelector('#waterspoutValue').value = fluid.options.waterMinusSourceAmount;

    document.querySelector('#rainfall').value = fluid.options.rainMaxPrecipitation;
    document.querySelector('#rainfallValue').value = fluid.options.rainMaxPrecipitation;

    document.querySelector('#gridSize').value = fluid.options.gridSize;
    document.querySelector('#cellSize').value = fluid.options.cellSize;

    document.querySelector('#color').value = fluid.options.waterColor.toCssHexString();

    document.querySelector('#intensity').value = fluid.options.colorIntensity;
    document.querySelector('#intensityValue').value = fluid.options.colorIntensity;

    document.querySelector('#brightness').value = fluid.options.waterBrightness;
    document.querySelector('#brightnessValue').value = fluid.options.waterBrightness;

    document.querySelector('#evaporation').value = fluid.options.evaporationRate;
    document.querySelector('#evaporationValue').value = fluid.options.evaporationRate;

    document.querySelector('#interval').value = 1000 / fluid.options.interval;
    document.querySelector('#intervalValue').value = 1000 / fluid.options.interval;

    document.querySelector('#timeStep').value = fluid.options.timeStep;
    document.querySelector('#timeStepValue').value = fluid.options.timeStep;

    document.querySelector('#cushionFactor').value = fluid.options.cushionFactor;
    document.querySelector('#cushionFactorValue').value = fluid.options.cushionFactor;

    document.querySelector('#waterDensity').value = fluid.options.waterDensity;
    document.querySelector('#waterDensityValue').value = fluid.options.waterDensity;
}

// event listeners
document.querySelector('#start').addEventListener('click', () => {
    fluid.start();
});

document.querySelector('#stop').addEventListener('click', () => {
    fluid.stop();
});

document.querySelector('#clearWater').addEventListener('click', async () => {
    await fluid.initializeWater();
});

document.querySelector('#reload').addEventListener('click', async () => {
    await fluid.init(viewer);
    clearWaterSourceEntities();
    await fluid.initBase(options);
    fluid.start();
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

document.querySelector('#saveImage').addEventListener('click', () => {
    fluid.saveWaterMapImage();
});

document.querySelector('#wireframe').addEventListener('click', () => {
    if (fluid.gridPrimitive) {
        fluid.gridPrimitive.debugWireframe = !fluid.gridPrimitive.debugWireframe;
    }
});

document.querySelector('#heightLegend').addEventListener('click', () => {
    fluid.options.heightPalette = !fluid.options.heightPalette;
});

document.querySelector('#water').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#waterValue').value = value;
    fluid.options.waterSourceAmount = value;
});

document.querySelector('#waterspout').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#waterspoutValue').value = value;
    fluid.options.waterMinusSourceAmount = value;
});

document.querySelector('#rainfall').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#rainfallValue').value = value;
    fluid.options.rainMaxPrecipitation = value;
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

document.querySelector('#evaporation').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#evaporationValue').value = value;
    fluid.options.evaporationRate = value;
});

document.querySelector('#simulationConfine').addEventListener('click', () => {
    fluid.options.simulationConfine = !fluid.options.simulationConfine;
});

document.querySelector('#waterSkirt').addEventListener('click', () => {
    fluid.options.waterSkirt = !fluid.options.waterSkirt;
});

document.querySelector('#interval').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#intervalValue').value = value;
    fluid.options.interval = 1000 / value;
    fluid.startFrame();
});

document.querySelector('#timeStep').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#timeStepValue').value = value;
    fluid.options.timeStep = value;
});

document.querySelector('#cushionFactor').addEventListener('input', (event) => {
    const value = event.target.value;
    document.querySelector('#cushionFactorValue').value = value;
    fluid.options.cushionFactor = value;
});


const selectionStatus = {
    rectangle: undefined,
    sourcePositions: [],
    sourceMinusPositions: [],
    seaWallPositions: [],
    handler: undefined,
}

const clearWaterSourceEntities = () => {
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
}

document.querySelector('#clearWaterSource').addEventListener('click', () => {
    clearWaterSourceEntities();
    fluid.clearWaterSourcePositions();
    fluid.clearWaterMinusSourcePositions();
    fluid.clearSeaWallPositions();
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
                const center = fluid.addWaterSourcePosition(lon, lat);
                selectionStatus.sourcePositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    cylinder: {
                        length: 30.0,
                        topRadius: 3.0,
                        bottomRadius: 3.0,
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
    fluid.options.waterColor = waterColor;
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

                const center = fluid.addWaterMinusSourcePosition(lon, lat);
                selectionStatus.sourceMinusPositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    cylinder: {
                        length: 30.0,
                        topRadius: 3.0,
                        bottomRadius: 3.0,
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
                const center = fluid.addSeaWallPosition(lon, lat);

                selectionStatus.seaWallPositions.push(viewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, cartographic.height),
                    box: {
                        dimensions: new Cesium.Cartesian3(9.0 * options.cellSize, 9.0 * options.cellSize, fluid.options.waterSeawallHeight * 2),
                        material: Cesium.Color.DARKGRAY.withAlpha(0.75),
                        /*outline: true,*/
                    }
                }))
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
});

const refreshRectangle = () => {
    const extent = fluid.calcExtent(options);
    if (selectionStatus.rectangle) {
        viewer.entities.remove(selectionStatus.rectangle);
    }
    const rectangle = fluid.createRectangle(extent);
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

setInterval(() => {
    const totalWaterAmount = fluid.info.totalWater;
    document.querySelector('#totalWaterAmount').textContent = `Total Water Amount (t) : ${totalWaterAmount}`;
}, 100);

init();