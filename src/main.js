import './css/style.css'
import './css/custom.css'
import {Viewer} from "cesium";
import * as Cesium from 'cesium'
import {MagoViewer} from "./cesium/MagoViewer.js";
import {MagoSimulation} from "./cesium/MagoSimulation.js";
import {MagoPostRender} from "./cesium/MagoPostRender.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
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

const magoViewer = new MagoViewer(viewer);
magoViewer.init();
magoViewer.addRandomPoints(1000,"#ffff00");

const magoPostRenderer = new MagoPostRender(viewer);
//magoPostRenderer.toggleOutline();
magoPostRenderer.toggleScreenSpaceOcclusion();

const magoSimulation = new MagoSimulation(viewer);
magoSimulation.createAsset();