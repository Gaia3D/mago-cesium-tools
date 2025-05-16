import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {Vworld} from "@/modules/Vworld.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (🌏 V-World)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>GeoCoord</h3>
    <input type="text" id="address" placeholder="Please enter address" style="width: 200px"/>
    <button id="test-geo-coord">Search</button>
    <span class="line"></span>
    <input type="text" id="result-address" placeholder="Result" style="width: 200px" readonly/>
    <span class="line"></span>
    <input type="text" id="result-lon" placeholder="Result Lon" style="width: 100px" readonly/>
    <input type="text" id="result-lat" placeholder="Result Lat" style="width: 100px" readonly/>
    <span class="line"></span>
    <h3>WMTS</h3>
    <select id="change-map">
        <option value="satellite">Satellite</option>
        <option value="road">Road</option>
        <option value="hybrid">Hybrid</option>
    </select>
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

const [lon, lat] = [126.968905, 37.447571];

const magoViewer = new MagoTools(viewer);
const vworld = new Vworld(viewer);

const init = async () => {
    await magoViewer.createVworldImageryLayerWithoutToken("Satellite", "jpeg");
    await magoViewer.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    const tileset = await Cesium.Cesium3DTileset.fromUrl("http://192.168.10.75:9099/data/{public}/korea-open-data-buildings/tileset.json", {});
    viewer.scene.primitives.add(tileset);

    magoViewer.initPosition(lon, lat, 1000.0);

    setDefaultValue();
    if (!viewer.scene.clampToHeightSupported) {
        window.alert("This browser does not support clampToHeightMostDetailed.");
    }
};

// Set default value for polylines and polygons
const setDefaultValue = () => {

};

document.querySelector("#test-geo-coord").addEventListener("click", async () => {
    const address = document.querySelector("#address").value;
    const result = await vworld.getAddressCoord(address);
    console.log(result);
    document.querySelector("#result-address").value = result.address;
    document.querySelector("#result-lon").value = result.lon;
    document.querySelector("#result-lat").value = result.lat;

    magoViewer.flyTo(result.lon, result.lat, 300.0, 1.0);
});

document.querySelector("#change-map").addEventListener("change", async (e) => {
    viewer.imageryLayers.removeAll();
    const mapType = e.target.value;
    if (mapType === "satellite") {
        await vworld.createVworldImageryLayer("Satellite", false, "jpeg");
    } else if (mapType === "road") {
        await vworld.createVworldImageryLayer("Base", false, "png");
    } else if (mapType === "hybrid") {
        await vworld.createVworldImageryLayer("Satellite", true, "jpeg");
    }
});

init();