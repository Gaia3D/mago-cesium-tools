import "../css/css-init.css";
import "../css/custom.css";
import * as Cesium from "cesium";
import {Viewer} from "cesium";
import {MagoTools} from "../modules/MagoTools.js";
import "@cesium/engine/Source/Widget/CesiumWidget.css";
import {MeasureHeight} from "@/modules/measure/MeasureHeight.js";
import {MeasureDistance} from "@/modules/measure/MeasureDistance.js";
import {MeasureAngle} from "@/modules/measure/MeasureAngle.js";
import {MeasureArea} from "@/modules/measure/MeasureArea.js";
import {DrawPolygon} from "@/modules/draw/DrawPolygon.js";
import {MeasureMultiDistance} from "@/modules/measure/MeasureMultiDistance.js";
import {DrawLineString} from "@/modules/draw/DrawLineString.js";
import {MeasurePosition} from "@/modules/measure/MeasurePosition.js";
import {DrawPoint} from "@/modules/draw/DrawPoint.js";
import {DrawWall} from "@/modules/draw/DrawWall.js";
import {DrawCircle} from "@/modules/draw/DrawCircle.js";
import {DrawSphere} from "@/modules/draw/DrawSphere.js";
import {ObjectController} from "@/modules/object/ObjectController.js";

document.querySelector("#app").innerHTML = `
  <div id="cesiumContainer"></div>
  <div id="toolbar">
    <h1>Mago Cesium Tools (🧩 Object Controller)</h1>
    <h3>Gaia3D, Inc.</h3>
    <span class="line"></span>
    <h3>Object Controller</h3>
    <button id="object-selection">Selection</button>
    <span class="line"></span>
    <button id="object-translate">Translate</button>
    <button id="object-rotate">Rotate</button>
    <button id="object-scale">Scale</button>
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
const objectSelection = new ObjectController(viewer);

const init = async () => {
    const magoTools = new MagoTools(viewer);
    await magoTools.createVworldImageryLayerWithoutToken("Satellite", "jpeg");
    magoTools.initPosition(lon, lat, 1000.0);

    await magoTools.changeTerrain("https://seoul.gaia3d.com:10024/resource/static/NGII_5M_DEM");
    const tree = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/FOREST_MAP/tileset.json");
    viewer.scene.primitives.add(tree);
    //const buildings = await Cesium.Cesium3DTileset.fromUrl("https://seoul.gaia3d.com:10024/resource/static/NGII_BUILDINGS/tileset.json", {});
    const buildings = await Cesium.Cesium3DTileset.fromUrl("http://localhost:9090/data/{release}/B05-seoul-part-geojson/tileset.json", {});
    viewer.scene.primitives.add(buildings);

    setDefaultValue();
};

// Set default value for polylines and polygons
const setDefaultValue = () => {
    // Disable depth test for polylines
    const oldPolylineUpdate = Cesium.PolylineCollection.prototype.update;
    Cesium.PolylineCollection.prototype.update = function(frameState) {
        const oldMorphTime = frameState.morphTime;
        frameState.morphTime = 0.0;
        oldPolylineUpdate.call(this, frameState);
        frameState.morphTime = oldMorphTime;
    };

    // Disable depth test for polygons
    const oldPrimitiveUpdate = Cesium.Primitive.prototype.update;
    Cesium.Primitive.prototype.update = function(frameState) {
        this.appearance._renderState.depthTest.enabled = false;
        oldPrimitiveUpdate.call(this, frameState);
    };
};

const offAll = () => {
    objectSelection.off();
};

document.querySelector("#object-selection").addEventListener("click", (event) => {
    objectSelection.on();
});

document.querySelector("#object-translate").addEventListener("click", (event) => {
    objectSelection.translate();
});

document.querySelector("#object-rotate").addEventListener("click", (event) => {
    objectSelection.rotate();
});

document.querySelector("#object-scale").addEventListener("click", (event) => {
    objectSelection.scale();
});

init();