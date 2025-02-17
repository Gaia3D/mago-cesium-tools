import * as Cesium from 'cesium';
import grid from '../assets/128x128.gltf';
import tree from '../assets/lowpoly-tree.glb';

const modelUrl = new URL(grid, import.meta.url).href;

/**
 * MagoSimulation is a class that creates a simulation of a 3D model.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoSimulation = new MagoSimulation(viewer);
 * magoSimulation.init();
 */
export class MagoSimulation {
    constructor(viewer) {
        this.viewer = viewer;
    }

    createVworldImageryLayer(type, extension) {
        const VWORD_KEY = 'BB89CEE2-0CBC-3378-A40B-468C4897B788'
        const minLevel = 5
        const maxLevel = 19

        const protocol = location.protocol === 'https:' ? 'https' : 'http'
        const options = {
            url: `${protocol}://api.vworld.kr/req/wmts/1.0.0/${VWORD_KEY}/${type}/{TileMatrix}/{TileRow}/{TileCol}.${extension}`,
            layer: 'Base',
            style: 'default',
            maximumLevel: maxLevel,
            tileMatrixSetID: 'default028mm'
        }
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider(options)
        const imageryLayer = new Cesium.ImageryLayer(imageryProvider, {
            show: true,
            minimumTerrainLevel: minLevel
        });

        const layers = this.viewer.scene.imageryLayers
        layers.add(imageryLayer)
        return imageryLayer;
    }

    async setTerrain(url) {
        try {
            this.viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
                requestVertexNormals: true
            });
        } catch (error) {
            console.warn('Failed to load terrain provider:', error);
            this.viewer.terrainProvider = await new Cesium.EllipsoidTerrainProvider();
        }
    }

    createAsset(lon, lat) {
        const model = this.viewer.entities.add({
            name: 'Model', position: Cesium.Cartesian3.fromDegrees(lon, lat, 0), model: {
                uri: tree,
                scale: 1.0,
                heightReference: Cesium.HeightReference.CLAMP_TO_TERRAIN,
            }
        });
        //let hpr = new Cesium.HeadingPitchRange(0.0, -90.0, 0.0);
        //this.viewer.zoomTo(model, hpr)
    }

    flyTo(lon, lat, height) {
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1000.0),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0)
            },
            duration: 0
        })
    }
}