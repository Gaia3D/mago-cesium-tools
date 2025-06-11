import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {CesiumTerrainEditor} from "@/modules/common/CesiumTerrainEditor.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (☁⛰️ Editable Terrain)</h1>
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
let cesiumTerrainEditor = undefined;

const init = async () => {
    //await magoViewer.createMaptilerImageryProvider();
    //await magoTools.createMaptilerImageryProvider();
    await magoTools.changeGlobeColor("#003333");
    await magoTools.createGridImageryProvider();
    await magoTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");

    cesiumTerrainEditor = new CesiumTerrainEditor({
        terrainProvider: viewer.terrainProvider,
    });

    const buildings = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/NGII_BUILDINGS/tileset.json", {});
    viewer.scene.primitives.add(buildings);
    magoTools.initPosition(lon, lat, 1000.0);

    setDefaultValue();
    if (!viewer.scene.clampToHeightSupported) {
        window.alert("This browser does not support clampToHeightMostDetailed.");
    }
};

const setDefaultValue = () => {

};

document.querySelector("#start").addEventListener("click", async () => {

});

document.querySelector("#next-frame").addEventListener("click", async () => {

});

init();