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
    <h1>Mago Cesium Tools (Wind)</h1>
    <h3>Gaia3D, Inc.</h3>
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

const init = async() => {
    const magoViewer = new MagoViewer(viewer);
    await magoViewer.createVworldImageryLayerWithoutToken('Satellite', 'jpeg');
    await magoViewer.changeTerrain('http://175.197.92.213:10110/korea_5m_dem_4326_ms8/');

    magoViewer.changeGlobeColor("#000000");
    magoViewer.initPosition(options.lon, options.lat, 3000000.0);

    // test data
    const dimension = [601, 351] //[5, 5];
    const boundary = [
        [95, 20],
        [155, 20],
        [155, 55],
        [95, 55]
    ];
    //const testlevels = [850, 900, 925];
    const testlevels = [30, 50, 70, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 925];
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

init();