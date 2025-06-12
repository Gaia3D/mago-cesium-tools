import * as Cesium from "cesium";
import {VolumetricRenderLayer} from "./VolumetricRenderLayer.js";

import {ShaderLoader} from "@/modules/ShaderLoader.js";
import {Modeler} from "@/modules/common/Modeler.js";
import {AxisAlignedBoundingBox} from "@/modules/common/magoGeometry/AxisAlignedBoundingBox.js";
import {RenderPrimitive} from "@/modules/common/RenderPrimitive.js";
import {MagoMathUtils} from "@/modules/common/magoMath/MagoMathUtils.js";

export class VolumetricRenderer {
    /**
     * Constructor for the VolumetricRenderer class.
     * @param viewer
     * @param options
     */
    constructor(viewer, options) {
        Object.assign(this, options);

        /**
         * The Cesium Viewer instance.
         * @type {Cesium.Viewer}
         */
        this.viewer = viewer;

        /**
         * The ShaderLoader instance for loading shaders.
         * @type {ShaderLoader}
         */
        this.shaderLoader = new ShaderLoader("/src/shaders/volumeRendering");

        /**
         * The Cesium context for rendering.
         * @type {Cesium.Context}
         */
        this.context = viewer.scene.context;

        /**
         * The JSON index containing metadata for the volumetric data.
         * @type {string}
         */
        this.jsonIndex = options.jsonIndex;
        this.pngsBinDataArray = this.jsonIndex.pngsBinDataArray;
        if (this.pngsBinDataArray === undefined || this.pngsBinDataArray.length === 0) {
            throw new Error("VolumetricRenderer: pngsBinDataArray is undefined or empty.");
        }
        this.mosaicTextureMetaDatas = this.jsonIndex.mosaicTexMetaDataJsonArray;
        if (this.mosaicTextureMetaDatas === undefined || this.mosaicTextureMetaDatas.length === 0) {
            throw new Error("VolumetricRenderer: mosaicTextureMetaDatas is undefined or empty.");
        }

        let pngsBinBlockFileNames = this.jsonIndex.pngsBinBlockFileNames;
        this.pngsBinBlocksArray = [];
        pngsBinBlockFileNames.forEach((pngsBinBlockFileName) => {
            let pngsBinBlock = {
                fileName: pngsBinBlockFileName.fileName, dataArraybuffer: undefined,
            };
            this.pngsBinBlocksArray.push(pngsBinBlock);
        });
        this.pngsBinBlocksArray = options.pngsBinBlocksArray;

        /**
         * Array of layers for volumetric rendering.
         * @type {Array<VolumetricRenderLayer>}
         */
        this.layers = [];

        /**
         * Collection of render primitives for volumetric rendering.
         * @type {Cesium.PrimitiveCollection}
         */
        this.primitiveCollection = new Cesium.PrimitiveCollection();

        /**
         * The number of legend values for the volumetric rendering.
         * @type {number}
         */
        this.currentIndex = 0;

        // make a map key = originalPngFileName, value = pngsBinBlock.
        this.originalFileNameMap = {};
        let originalPngFileNamesCount = this.pngsBinDataArray.length;
        for (let i = 0; i < originalPngFileNamesCount; i++) {
            let pngsBinData = this.pngsBinDataArray[i];
            this.originalFileNameMap[pngsBinData.originalPngFileName] = pngsBinData;
        }

        // options, timetables for shader uniforms
        // 0 = rainbow, 1 = grayscale, 2 = colorLegend
        this.renderingColorType = 0;
        if (options.renderingColorType !== undefined) {
            this.renderingColorType = options.renderingColorType;
        }
        // The position of the cutting plane in model coordinates
        this.cuttingAAPlanePositionMC = undefined;
        if (options.cuttingAAPlanePositionMC !== undefined) {
            this.cuttingAAPlanePositionMC = options.cuttingAAPlanePositionMC;
        }

        // The normal of the plane. 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z
        this.cuttingAAPlaneNormalMC = undefined;
        if (options.cuttingAAPlaneNormalMC !== undefined) {
            this.cuttingAAPlaneNormalMC = options.cuttingAAPlaneNormalMC;
        }

        // The number of samplings for the volumetric rendering
        this.samplingCount = 20;
        if (options.samplingCount !== undefined) {
            this.samplingCount = options.samplingCount;
        }

        // The color legends for the volumetric rendering
        this.colorLegends = [];
        if (options.colorLegends !== undefined) {
            this.colorLegends = options.colorLegends;
        }

        // The legend values for the volumetric rendering
        this.legendValues = [];
        if (options.legendValues !== undefined) {
            this.legendValues = options.legendValues;
        }

        // Scale for the legend values.
        this.legendValuesScale = 1.0;
        if (options.legendValuesScale !== undefined) {
            this.legendValuesScale = options.legendValuesScale;
        }
    }

    /**
     * Initializes the volumetric renderer by creating layers and preparing air pollution data.
     */
    async init() {
        let layersCount = 1;
        for (let i = 0; i < layersCount; i++) {
            let options = {
                pollutionVolumeOwner: this,
                jsonIndex: this.jsonIndex,
            };
            let layer = new VolumetricRenderLayer(this.viewer, options);
            this.layers.push(layer);
        }
        await this.#prepareAirPollutionLayers();
        await this.createRenderPrimitives();
    }

    /**
     * Increments the current index for the volumetric data.
     */
    addIndex() {
        let maxIdx = this.mosaicTextureMetaDatas.length - 1;
        this.currentIndex++;
        if (this.currentIndex >= maxIdx) {
            this.currentIndex = maxIdx;
        } else if (this.currentIndex < 0) {
            this.currentIndex = 0;
        }
    }

    /**
     * Decrements the current index for the volumetric data.
     */
    subIndex() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = 0;
        } else if (this.currentIndex >= this.mosaicTextureMetaDatas.length) {
            this.currentIndex = this.mosaicTextureMetaDatas.length - 1;
        }
    }

    /**
     * Sets the current index for the volumetric data.
     * @param value
     */
    onChangeIdx(value) {
        let maxIdx = this.mosaicTextureMetaDatas.length - 1;
        this.currentIndex = Math.floor(value * maxIdx);
        if (this.currentIndex >= maxIdx) {
            this.currentIndex = maxIdx;
        } else if (this.currentIndex < 0) {
            this.currentIndex = 0;
        }
    }

    /**
     * Updates the position of the Axis-Aligned Cutting Plane in Model Coordinates (MC).
     * @param value
     */
    onChangeCuttingPlanePositionMC(value) {
        let aabb = this.getAABB();
        let minPos = aabb.minPosition;
        let maxPos = aabb.maxPosition;
        let curPos = MagoMathUtils.mixVec3(minPos, maxPos, value);

        let cuttingAAPlanePositionMC = this.#getCuttingAAPlanePositionMC();
        cuttingAAPlanePositionMC.x = curPos.x;
        cuttingAAPlanePositionMC.y = curPos.y;
        cuttingAAPlanePositionMC.z = curPos.z;
        this.cuttingAAPlanePositionMC = cuttingAAPlanePositionMC;
    }

    /**
     * Creates the render primitives for the volumetric renderer.
     * @returns {Promise<void>}
     */
    async createRenderPrimitives() {
        let boxPrimitive = await this.#createRenderPrimitive();
        this.primitiveCollection.add(boxPrimitive);
    }

    /**
     * Prepares the air pollution layers by loading the necessary data.
     * @private
     * @returns {Promise<void>}
     */
    async #prepareAirPollutionLayers() {
        for (let i = 0; i < this.layers.length; i++) {
            let layer = this.layers[i];
            await layer._prepare();
        }
    }

    /**
     * Gets the primitive collection for the volumetric renderer.
     * @returns {Cesium.PrimitiveCollection}
     */
    getPrimitiveCollection() {
        return this.primitiveCollection;
    }

    /**
     * Gets the ArrayBuffer of the PNG file from the mosaic file name.
     * @param mosaicFileName
     * @returns {ArrayBuffer|undefined}
     */
    getBlobArrayBuffer(mosaicFileName) {
        let pngsBinData = this.originalFileNameMap[mosaicFileName];
        if (pngsBinData === undefined) {
            return undefined;
        }
        let pngsBinBlocksCount = this.pngsBinBlocksArray.length;
        for (let i = 0; i < pngsBinBlocksCount; i++) {
            let pngsBinBlock = this.pngsBinBlocksArray[i];
            if (pngsBinBlock.fileName === pngsBinData.pngsBinaryBlockDataFileName) {
                let startIdx = pngsBinData.startByteIndex;
                let endIdx = pngsBinData.endByteIndex;
                let pngsBinBlockData = pngsBinBlock.dataArraybuffer;
                return pngsBinBlockData.slice(startIdx, endIdx);
            }
        }

        return undefined;
    }

    /**
     * Gets the size of the 3D texture for the volumetric data.
     * @returns {*[]}
     */
    #getTexture3DSize() {
        let someData = this.mosaicTextureMetaDatas[0];
        let someDataSlice = someData.dataSlices[0];
        let width = someDataSlice.width;
        let height = someDataSlice.height;
        let slicesCount = someData.dataSlices.length;

        return [width, height, slicesCount];
    }

    /**
     * Gets the altitude slices for the volumetric data.
     * @param arrayLength
     * @returns {*[]}
     */
    #getAltitudeSlices(arrayLength) {
        // Uniform for shader.
        let someData = this.mosaicTextureMetaDatas[0];
        let altitudeSlicesArray = [];
        for (let i = 0; i < someData.dataSlices.length; i++) {
            let dataSlice = someData.dataSlices[i];
            let altitudeSlice = dataSlice.minAltitude;
            altitudeSlicesArray.push(altitudeSlice);
        }

        if (altitudeSlicesArray.length < arrayLength) {
            let diff = arrayLength - altitudeSlicesArray.length;
            for (let i = 0; i < diff; i++) {
                altitudeSlicesArray.push(0.0);
            }
        }
        return altitudeSlicesArray;
    }

    /**
     * Gets the minimum and maximum altitude slices for the volumetric data.
     * @private
     * @returns {*[]}
     */
    #getMinMaxAltitudeSlices() {
        // Uniform for shader.
        let someData = this.mosaicTextureMetaDatas[0];
        let minMaxAltitudeSlices = [];
        for (let i = 0; i < 32; i++) {
            if (i < someData.dataSlices.length) {
                let dataSlice = someData.dataSlices[i];
                let minMaxAltitudeSlice = new Cesium.Cartesian2(dataSlice.minAltitude, dataSlice.maxAltitude);
                minMaxAltitudeSlices.push(minMaxAltitudeSlice);
            } else {
                let minMaxAltitudeSlice = new Cesium.Cartesian2(0.0, 0.0);
                minMaxAltitudeSlices.push(minMaxAltitudeSlice);
            }
        }

        return minMaxAltitudeSlices;
    }

    /**
     * Gets the size of the mosaic texture.
     * @private
     * @returns {(*|number)[]}
     */
    #getMosaicSize() {
        // Uniform for shader.
        let someData = this.mosaicTextureMetaDatas[0];
        let mosaicColumnsCount = someData.mosaicColumnsCount;
        let mosaicRowsCount = someData.mosaicRowsCount;
        const slicesCount = 1;
        let mosaicSize = [mosaicColumnsCount, mosaicRowsCount, slicesCount];
        return mosaicSize;
    }

    /**
     * Gets the position of the Axis-Aligned Cutting Plane in Model Coordinates (MC).
     * @private
     * @returns {*}
     */
    #getCuttingAAPlanePositionMC() {
        // Uniform for shader.
        if (this.cuttingAAPlanePositionMC === undefined) {
            this.cuttingAAPlanePositionMC = new Cesium.Cartesian3(0.0, 0.0, 0.0);
        }
        return this.cuttingAAPlanePositionMC;
    }

    /**
     * Gets the normal of the Axis-Aligned Cutting Plane in Model Coordinates (MC).
     * Uniform for shader.
     * The normal of the plane. 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z
     * @private
     * @returns
     */
    #getCuttingAAPlaneNormalMC() {
        if (this.cuttingAAPlaneNormalMC === undefined) {
            this.cuttingAAPlaneNormalMC = 0;
        }
        return this.cuttingAAPlaneNormalMC;
    }

    /**
     * Calculates the Axis-Aligned Bounding Box (AABB) for the volumetric data.
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB() {
        let sizeX = this.jsonIndex.width_km * 1000.0;
        let sizeY = this.jsonIndex.height_km * 1000.0;
        let sizeZ = this.layers[0].getMaxAltitude();
        let semiX = sizeX / 2;
        let semiY = sizeY / 2;
        let minX = -semiX;
        let minY = -semiY;
        let minZ = this.layers[0].getMinAltitude();
        let maxX = semiX;
        let maxY = semiY;
        let maxZ = sizeZ;
        let minPos = new Cesium.Cartesian3(minX, minY, minZ);
        let maxPos = new Cesium.Cartesian3(maxX, maxY, maxZ);
        return new AxisAlignedBoundingBox(minPos, maxPos);
    }

    /**
     * Creates a volumetric box geometry based on the Axis-Aligned Bounding Box (AABB) of the volumetric data.
     * @returns {module:cesium.Geometry}
     */
    createVolumetricBoxGeometry() {
        let aabb = this.getAABB();
        let minPos = aabb.min;
        let maxPos = aabb.max;
        let minX = minPos.x;
        let minY = minPos.y;
        let minZ = minPos.z;
        let maxX = maxPos.x;
        let maxY = maxPos.y;
        let maxZ = maxPos.z;

        let magoModeler = new Modeler();
        let box = magoModeler.createBox(minX, minY, minZ, maxX, maxY, maxZ);

        return new Cesium.Geometry({
            attributes: new Cesium.GeometryAttributes({
                position: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT, componentsPerAttribute: 3, values: box.positions,
                }), normal: new Cesium.GeometryAttribute({
                    componentDatatype: Cesium.ComponentDatatype.FLOAT, componentsPerAttribute: 3, values: box.normals,
                }),
            }), indices: box.indices,
        });
    }

    /**
     * Creates a RenderPrimitive for the volumetric data.
     * @private
     * @returns {Promise<RenderPrimitive>}
     */
    async #createRenderPrimitive() {
        let aabb = this.getAABB();
        let minPos = aabb.min;
        let maxPos = aabb.max;
        let minX = minPos.x;
        let minY = minPos.y;
        let minZ = minPos.z;
        let maxX = maxPos.x;
        let maxY = maxPos.y;
        let maxZ = maxPos.z;

        let lonDeg = this.jsonIndex.centerGeographicCoord.longitude;
        let latDeg = this.jsonIndex.centerGeographicCoord.latitude;
        let altitude = this.jsonIndex.centerGeographicCoord.altitude;
        let center = Cesium.Cartesian3.fromDegrees(lonDeg, latDeg, altitude);
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);

        let tex3DSize = this.#getTexture3DSize();
        let mosaicSize = this.#getMosaicSize();
        let minMaxAltitudeSlices = this.#getMinMaxAltitudeSlices();

        let totalMinValue = this.jsonIndex.totalMinValue;
        let totalMaxValue = this.jsonIndex.totalMaxValue;

        this.legendValuesCount = 0;
        if (this.legendValues !== undefined && this.legendValues.length > 0) {
            this.legendValuesCount = this.legendValues.length;
        }

        const volumetricVertexShader = await this.shaderLoader.getShaderSource("volumetric.vert");
        const volumetricFragmentShader = await this.shaderLoader.getShaderSource("volumetric.frag");

        const that = this;
        return new RenderPrimitive(this.context, {
            attributeLocations: {
                position: 0,
            },
            geometry: this.createVolumetricBoxGeometry(),
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            modelMatrix: transform,
            uniformMap: {
                u_minBoxPosition: function() {
                    return new Cesium.Cartesian3(minX, minY, minZ);
                }, u_maxBoxPosition: function() {
                    return new Cesium.Cartesian3(maxX, maxY, maxZ);
                }, mosaicTexture: function() {
                    return that.layers[0].volumetricDatasArray[that.currentIndex].mosaicTexture;
                }, u_camPosWC: function() {
                    return that.viewer.scene.camera.positionWC;
                }, u_texSize: function() {
                    return tex3DSize;
                }, u_mosaicSize: function() {
                    return mosaicSize;
                }, u_minMaxAltitudeSlices: function() {
                    return minMaxAltitudeSlices;
                }, u_minMaxValues: function() {
                    return new Cesium.Cartesian2(totalMinValue, totalMaxValue);
                }, u_legendColors: function() {
                    return that.colorLegends;
                }, u_legendValues: function() {
                    return that.legendValues;
                }, u_legendColorsCount: function() {
                    return that.legendValuesCount;
                }, u_legendValuesScale: function() {
                    return that.legendValuesScale;
                }, u_renderingColorType: function() {
                    return that.renderingColorType;
                }, u_samplingsCount: function() {
                    return that.samplingCount;
                }, u_AAPlanePosMC: function() {
                    return that.#getCuttingAAPlanePositionMC();
                }, u_AAPlaneNormalMC: function() {
                    return that.#getCuttingAAPlaneNormalMC();
                },
            }, vertexShaderSource: new Cesium.ShaderSource({
                sources: [volumetricVertexShader],
            }), fragmentShaderSource: new Cesium.ShaderSource({
                sources: [volumetricFragmentShader],
            }), rawRenderState: this.createRawRenderState({
                depthTest: {
                    enabled: false,
                }, depthMask: false, blending: {
                    enabled: true,
                }, cull: {
                    enabled: false,
                },
            }), autoClear: false,
        });
    }

    /**
     * Creates the raw render state for the volumetric rendering.
     * @param options
     * @returns {*}
     */
    createRawRenderState(options) {
        let translucent = true;
        let closed = false;
        let existing = {
            viewport: options.viewport,
            depthTest: options.depthTest,
            depthMask: options.depthMask,
            blending: options.blending,
            cull: options.cull,
            colorMask: options.colorMask,
        };
        return Cesium.Appearance.getDefaultRenderState(translucent, closed, existing);
    }
}