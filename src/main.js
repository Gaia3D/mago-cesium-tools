import './css/style.css'
import './css/custom.css'
import {Viewer} from "cesium";
import * as Cesium from 'cesium'
import {MagoViewer} from "./cesium/MagoViewer.js";
import {MagoSimulation} from "./cesium/MagoSimulation.js";

document.querySelector('#app').innerHTML = `
  <div id="cesiumContainer"></div>
`
const initPosition = Cesium.Cartesian3.fromDegrees(0, 0, 10000);

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
viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#111133");
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(initPosition.x, initPosition.y, initPosition.z),
    orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-90.0)
    },
    duration: 0
})
const grid = new Cesium.GridImageryProvider({
    cells: 8,
    color : Cesium.Color.WHITE.withAlpha(0.25),
    glowColor : Cesium.Color.BLACK.withAlpha(0.0),
    glowWidth : 4,
    backgroundColor: Cesium.Color.BLACK.withAlpha(0.05),
    maximumLevel: 5
})
viewer.scene.imageryLayers.addImageryProvider(grid)

const magoViewer = new MagoViewer(viewer);
const magoSimulation = new MagoSimulation(viewer);
magoSimulation.init();
magoSimulation.outline();