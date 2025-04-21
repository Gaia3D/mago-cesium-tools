import { Viewer, Entity, Cartesian3, Color } from "cesium";
import * as Cesium from 'cesium'
import tree from "../assets/lowpoly-tree.glb";

/**
 * MagoTools is a class that creates a viewer to render points on a globe.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoTools = new MagoTools(viewer);
 * magoTools.test();
 */
export class MagoTools {
    constructor(viewer) {
        this.viewer = viewer;
    }

    /**
     * Tests the MagoTools class.
     * draws points on the globe.
     * @function
     * @returns {void}
     * @example
     * const magoTools = new MagoTools(viewer);
     * magoTools.test()
     */
    test() {
        const [lon, lat] = [126.968905, 37.447571];
        this.initPosition(lon, lat, 10000);
        this.changeGlobeColor("#111133");
        this.createGridImageryProvider();
        this.addRandomPoints(1000);
        this.createModel(tree, lon, lat);
    }

    /**
     * Initializes the viewer to render points on a globe.
     * @param lon {number} longitude degrees
     * @param lat {number} latitude degrees
     * @param height {number} height meters
     * @returns {void}
     * @example
     * magoTools.initPosition(126.978388, 37.566610, 10000)
     */
    initPosition(lon = 0, lat = 0, height = 0) {
        this.viewer.camera.setView({
            destination: Cartesian3.fromDegrees(lon, lat, height),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0)
            }
        });
    }

    /**
     * Samples random points on the globe.
     * @param lon {number} longitude degrees
     * @param lat {number} latitude degrees
     * @param height {number} height meters
     * @param duration {number} duration seconds
     * @returns {void}
     * @example
     * magoTools.flyTo(126.978388, 37.566610, 10000)
     */
    flyTo(lon, lat, height = 1000, duration = 0) {
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0)
            },
            duration: duration,
        })
    }

    /**
     * Samples random points on the globe.
     * @param lon {number} longitude degrees
     * @param lat {number} latitude degrees
     * @param cssColor {String} CSS color string "#ff0000"
     * @param entitiesCollection
     * @returns {void}
     * @example
     * magoTools.addPoint(126.978388, 37.566610, "#ff0000")
     */
    addPoint(lon, lat, cssColor = "#ffcc00", entitiesCollection = null) {
        const entity = new Entity({
            position: Cartesian3.fromDegrees(lon, lat),
            point: {
                pixelSize: 3,
                color: Color.fromCssColorString(cssColor),
                //distanceDisplayCondition : new Cesium.DistanceDisplayCondition(0, 1000000.0)
            },
            billboard: {
                image: "/src/assets/img.png",
                width: 16,
                height: 16,
                distanceDisplayCondition : new Cesium.DistanceDisplayCondition(0, 1000.0)
            },
        });

        if (entitiesCollection) {
            entitiesCollection.add(entity);
        } else {
            this.viewer.entities.add(entity);
        }
    }

    /**
     * Adds a point to the globe.
     * @param cssColor {String} CSS color string "#ff0000"
     * @param entitiesCollection
     * @returns {void}
     * @example
     * magoTools.addPoint(126.978388, 37.566610, "#ff0000")
     */
    addRandomPoint(cssColor = "#ff0000", entitiesCollection = null) {
        let randomX = (Math.random() * 360) - 180;
        let randomY = (Math.random() * 180) - 90;
        this.addPoint(randomX, randomY, cssColor, entitiesCollection);
    }

    /**
     * Samples random points on the globe.
     * @param count {number}
     * @param cssColor {string} CSS color string "#ff0000"
     * @param entitiesCollection
     * @returns {void}
     * @example
     * magoTools.addRandomPoints(1000, "#ffff00")
     */
    addRandomPoints(count, cssColor = "#00ff00", entitiesCollection = null) {
        for (let i = 0; i < count; i++) {
            this.addRandomPoint(cssColor, entitiesCollection);
        }
    }

    /**
     * Changes the color of the globe.
     * @param cssColor {string} CSS color string "#ff0000"
     * @returns {void}
     * @example
     * magoTools.changeGlobeColor("#ff0000")
     */
    changeGlobeColor(cssColor) {
        this.viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(cssColor);
    }

    /**
     * Creates a grid imagery provider on the globe.
     * @returns {void}
     * @example
     * magoTools.createGridImageryProvider()
     */
    createGridImageryProvider(cell = 8) {
        const grid = new Cesium.GridImageryProvider({
            cells: cell,
            color : Cesium.Color.WHITE.withAlpha(0.25),
            glowColor : Cesium.Color.BLACK.withAlpha(0.0),
            glowWidth : 4,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.05),
            maximumLevel: 5
        })
        const layers = this.viewer.scene.imageryLayers;
        layers.addImageryProvider(grid);
        //layers.raiseToTop(grid);
    }

    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param extension {String} jpeg, png
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayer('Satellite', true, 'jpeg', '00000000-0000-0000-0000-000000000000')
     */
    createVworldImageryLayerWithoutToken(type, extension) {
        const minLevel = 5
        const maxLevel = 19
        const options = {
            url: `https://xdworld.vworld.kr/2d/${type}/service/{TileMatrix}/{TileCol}/{TileRow}.${extension}`,
            layer: 'Base',
            style: 'default',
            //minimumLevel: 1,
            maximumLevel: maxLevel,
            tileMatrixSetID: 'EPSG:3857',
            credit: new Cesium.Credit('VWorld Korea'),
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

    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param hybrid {boolean}
     * @param extension {String} jpeg, png
     * @param vworldKey {String} 00000000-0000-0000-0000-000000000000
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayer('Satellite', true, 'jpeg', '00000000-0000-0000-0000-000000000000')
     */
    createVworldImageryLayer(type, hybrid, extension, vworldKey) {
        const minLevel = 5
        const maxLevel = 19

        const protocol = location.protocol === 'https:' ? 'https' : 'http'
        const options = {
            url: `${protocol}://api.vworld.kr/req/wmts/1.0.0/${vworldKey}/${type}/{TileMatrix}/{TileRow}/{TileCol}.${extension}`,
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

        if (hybrid) {
            const hybridOptions = {
                url: `${protocol}://api.vworld.kr/req/wmts/1.0.0/${vworldKey}/Hybrid/{TileMatrix}/{TileRow}/{TileCol}.png`,
                layer: 'Hybrid',
                style: 'default',
                maximumLevel: maxLevel,
                tileMatrixSetID: 'default028mm'
            }
            const hybridImageryProvider = new Cesium.WebMapTileServiceImageryProvider(hybridOptions)
            const hybridImageryLayer = new Cesium.ImageryLayer(hybridImageryProvider, {
                show: true,
                minimumTerrainLevel: minLevel
            });
            layers.add(hybridImageryLayer)
        }
        return imageryLayer;
    }

    /**
     * Changes the terrain provider of the
     * @param url {String}
     * @returns {Promise<void>}
     * @example
     * changeTerrain('url')
     */
    async changeTerrain(url) {
        try {
            this.viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url, {
                requestVertexNormals: true
            });
        } catch (error) {
            console.warn('Failed to load terrain provider:', error);
            this.viewer.terrainProvider = await new Cesium.EllipsoidTerrainProvider();
        }
    }

    /**
     * Creates a 3D model on the globe.
     * @param url {String}
     * @param lon {number}
     * @param lat {number}
     * @returns {void}
     * @example
     * createModel('/assets/lowpoly-tree.glb', 126.978388, 37.566610)
     */
    createModel(url = tree, lon, lat) {
        const model = this.viewer.entities.add({
            name: 'Model', position: Cesium.Cartesian3.fromDegrees(lon, lat, 0), model: {
                uri: url,
                scale: 1.0,
                heightReference: Cesium.HeightReference.CLAMP_TO_TERRAIN,
            }
        });
    }

    destroy() {
        this.viewer.destroy();
    }
}