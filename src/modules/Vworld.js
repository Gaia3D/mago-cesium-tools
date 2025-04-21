import * as Cesium from "cesium";
import {Viewer} from "cesium";

/**
 * MagoTools is a class that creates a viewer to render points on a globe.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoTools = new MagoTools(viewer);
 * magoTools.test();
 */
export class Vworld {
    constructor(viewer) {
        this.viewer = viewer;
        this.token = "CC24573F-5861-34E4-B1BF-56DA9D6CD8BC";
    }

    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param extension {String} jpeg, png
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayerWithoutToken('Satellite', true, 'jpeg')
     */
    createVworldImageryLayerWithoutToken(type, extension) {
        const minLevel = 5
        const maxLevel = 19
        const options = {
            url: `https://xdworld.vworld.kr/2d/${type}/service/{TileMatrix}/{TileCol}/{TileRow}.${extension}`,
            layer: 'Base',
            style: 'default', //minimumLevel: 1,
            maximumLevel: maxLevel,
            tileMatrixSetID: 'EPSG:3857',
            credit: new Cesium.Credit('Vworld Korea'),
        }
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider(options)
        const imageryLayer = new Cesium.ImageryLayer(imageryProvider, {
            show: true, minimumTerrainLevel: minLevel
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
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayer('Satellite', true, 'jpeg', '00000000-0000-0000-0000-000000000000')
     */
    createVworldImageryLayer(type, hybrid, extension) {
        const minLevel = 5
        const maxLevel = 19

        const protocol = location.protocol === 'https:' ? 'https' : 'http'
        const options = {
            url: `${protocol}://api.vworld.kr/req/wmts/1.0.0/${this.token}/${type}/{TileMatrix}/{TileRow}/{TileCol}.${extension}`,
            layer: 'Base',
            style: 'default',
            maximumLevel: maxLevel,
            tileMatrixSetID: 'default028mm'
        }
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider(options)
        const imageryLayer = new Cesium.ImageryLayer(imageryProvider, {
            show: true, minimumTerrainLevel: minLevel
        });

        const layers = this.viewer.scene.imageryLayers
        layers.add(imageryLayer)

        if (hybrid) {
            const hybridOptions = {
                url: `${protocol}://api.vworld.kr/req/wmts/1.0.0/${this.token}/Hybrid/{TileMatrix}/{TileRow}/{TileCol}.png`,
                layer: 'Hybrid',
                style: 'default',
                maximumLevel: maxLevel,
                tileMatrixSetID: 'default028mm'
            }
            const hybridImageryProvider = new Cesium.WebMapTileServiceImageryProvider(hybridOptions)
            const hybridImageryLayer = new Cesium.ImageryLayer(hybridImageryProvider, {
                show: true, minimumTerrainLevel: minLevel
            });
            layers.add(hybridImageryLayer)
        }
        return imageryLayer;
    }

    /**
     * Get address coordinates
     * @param address
     * @param type
     * @returns {Promise<*>}
     */
    async getAddressCoord(address, type) {
        const response = await this.getAddressCoordProxy(address, type);
        const responseResult = {
            address: undefined, lon: undefined, lat: undefined, error: false,
        }

        try {
            if (response) {
                const refined = response.refined;
                const text = refined.text;

                const result = response.result;
                const point = result.point;
                const lon = point.x;
                const lat = point.y;

                responseResult.address = text;
                responseResult.lon = parseFloat(lon);
                responseResult.lat = parseFloat(lat);
            }
        } catch (error) {
            console.error("Error parsing response: ", error);
            console.error("Response: ", response);
            responseResult.address = "";
            responseResult.lon = -1;
            responseResult.lat = -1;
            responseResult.error = true;
        }
        return responseResult;
    }

    /**
     * @private
     * Get address coordinates using JSONP
     * @param address {String} Address Text to search
     * @param type {String} ROAD, PARCEL
     * @returns {Promise<unknown>}
     */
    getAddressCoordProxy(address, type = "ROAD") {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            const callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());

            window[callbackName] = function (data) {
                delete window[callbackName];
                document.body.removeChild(script);

                if (data && data.response) {
                    resolve(data.response);
                } else {
                    reject(new Error("Invalid response"));
                }
            };

            const params = new URLSearchParams({
                service: "address",
                request: "GetCoord",
                version: "2.0",
                crs: "EPSG:4326",
                type: type,
                address: address,
                format: "json",
                key: this.token,
                callback: callbackName,
            });

            script.src = "https://api.vworld.kr/req/address?" + params.toString();
            script.onerror = () => {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error("Script load error"));
            };

            document.body.appendChild(script);
        });
    }
}