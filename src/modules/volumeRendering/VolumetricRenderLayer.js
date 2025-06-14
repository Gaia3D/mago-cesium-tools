import {VolumetricData} from "./VolumetricData";
import * as Cesium from "cesium";

/**
 * VolumetricRenderLayer class for managing volumetric data rendering in Cesium.
 */
export class VolumetricRenderLayer {

    /**
     * Creates an instance of VolumetricRenderLayer.
     * @param viewer
     * @param options
     */
    constructor(viewer, options) {
        this.volumetricDatasArray = [];

        this.viewer = viewer;
        this.context = viewer.scene.context;
        this.jsonIndex = options.jsonIndex;
        this.options = options;

        this.show = true;
        this.pollutionVolumeOwner = options.pollutionVolumeOwner;
        this.volume = options.volume;
        //this.jsonData = undefined;
        //this.jsonUrl = undefined;
        //`this.jsonDataArray = [];
        this.pngsBinBlocksArray = [];
    }

    async #createTextureFromBlob_invertY(arrayBuffer) {
        const blob = new Blob([arrayBuffer], {type: "image/png"});
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");

                ctx.translate(0, img.height);
                ctx.scale(1, -1);
                ctx.drawImage(img, 0, 0);

                // Crear textura con la imagen ya invertida
                const texture = new Cesium.Texture({
                    context: this.context, source: canvas,
                });
                resolve(texture);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    async #createTextureFromBlob(arrayBuffer) {
        const blob = new Blob([arrayBuffer], {type: "image/png"});
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const texture = new Cesium.Texture({
                    context: this.context, source: img,
                });
                resolve(texture);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }

    async _prepare() {
        let timeSliceFileNamesCount = this.jsonIndex.mosaicTexMetaDataJsonArray.length;
        for (let i = 0; i < timeSliceFileNamesCount; i++) {
            console.log("Loading mosaic texture metadata: " + i);
            let jsonData = this.jsonIndex.mosaicTexMetaDataJsonArray[i];
            let mosaicTextureFileName = jsonData.mosaicTextureFileName;
            let blobArrayBuffer = this.pollutionVolumeOwner.getBlobArrayBuffer(mosaicTextureFileName);
            const mosaicTexture = await this.#createTextureFromBlob(blobArrayBuffer);
            let volumetricData = this.newVolumetricData();
            volumetricData.setMosaicTexture(mosaicTexture);
        }
    }

    newVolumetricData() {
        let volumetricData = new VolumetricData();
        this.volumetricDatasArray.push(volumetricData);
        return volumetricData;
    }

    getMaxAltitude() {
        let maxAltitude = 0;
        let jsonData = this.jsonIndex.mosaicTexMetaDataJsonArray[0];
        let dataSlicesCount = jsonData.dataSlices.length;

        // take the last slice
        let lastSlice = jsonData.dataSlices[dataSlicesCount - 1];
        maxAltitude = lastSlice.maxAltitude;
        return maxAltitude;
    }

    getMinAltitude() {
        let minAltitude = 0;
        let jsonData = this.jsonIndex.mosaicTexMetaDataJsonArray[0];

        // take the first slice
        let firstSlice = jsonData.dataSlices[0];
        minAltitude = firstSlice.minAltitude;
        return minAltitude;
    }
}