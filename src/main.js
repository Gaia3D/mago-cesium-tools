import './css/style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import { Viewer } from "cesium";
import { MagoViewer } from "./cesium/MagoViewer.js";

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
  </div>
  <div id="cesiumContainer" style="width: 800px; height: 600px;"></div>
`

const viewer = new Viewer("cesiumContainer");

const magoViewer = new MagoViewer(viewer);
magoViewer.addPoint(126.978388, 37.566609);
magoViewer.addRandomPoint(20000);
