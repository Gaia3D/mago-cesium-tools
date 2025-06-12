export class VolumetricRenderer {
    /**
     * Constructor for the VolumetricRenderer class.
     * @param viewer
     * @param options
     */
    constructor(viewer: any, options: any);
    /**
     * The Cesium Viewer instance.
     * @type {Cesium.Viewer}
     */
    viewer: Cesium.Viewer;
    /**
     * The ShaderLoader instance for loading shaders.
     * @type {ShaderLoader}
     */
    shaderLoader: ShaderLoader;
    /**
     * The Cesium context for rendering.
     * @type {Cesium.Context}
     */
    context: Cesium.Context;
    /**
     * The JSON index containing metadata for the volumetric data.
     * @type {string}
     */
    jsonIndex: string;
    pngsBinDataArray: any;
    mosaicTextureMetaDatas: any;
    pngsBinBlocksArray: any;
    /**
     * Array of layers for volumetric rendering.
     * @type {Array<VolumetricRenderLayer>}
     */
    layers: Array<VolumetricRenderLayer>;
    /**
     * Collection of render primitives for volumetric rendering.
     * @type {Cesium.PrimitiveCollection}
     */
    primitiveCollection: Cesium.PrimitiveCollection;
    /**
     * The number of legend values for the volumetric rendering.
     * @type {number}
     */
    currentIndex: number;
    originalFileNameMap: {};
    renderingColorType: any;
    cuttingAAPlanePositionMC: any;
    cuttingAAPlaneNormalMC: any;
    samplingCount: any;
    colorLegends: any;
    legendValues: any;
    legendValuesScale: any;
    /**
     * Initializes the volumetric renderer by creating layers and preparing air pollution data.
     */
    init(): Promise<void>;
    /**
     * Increments the current index for the volumetric data.
     */
    addIndex(): void;
    /**
     * Decrements the current index for the volumetric data.
     */
    subIndex(): void;
    /**
     * Sets the current index for the volumetric data.
     * @param value
     */
    onChangeIdx(value: any): void;
    /**
     * Updates the position of the Axis-Aligned Cutting Plane in Model Coordinates (MC).
     * @param value
     */
    onChangeCuttingPlanePositionMC(value: any): void;
    /**
     * Creates the render primitives for the volumetric renderer.
     * @returns {Promise<void>}
     */
    createRenderPrimitives(): Promise<void>;
    /**
     * Gets the primitive collection for the volumetric renderer.
     * @returns {Cesium.PrimitiveCollection}
     */
    getPrimitiveCollection(): Cesium.PrimitiveCollection;
    /**
     * Gets the ArrayBuffer of the PNG file from the mosaic file name.
     * @param mosaicFileName
     * @returns {ArrayBuffer|undefined}
     */
    getBlobArrayBuffer(mosaicFileName: any): ArrayBuffer | undefined;
    /**
     * Calculates the Axis-Aligned Bounding Box (AABB) for the volumetric data.
     * @returns {AxisAlignedBoundingBox}
     */
    getAABB(): AxisAlignedBoundingBox;
    /**
     * Creates a volumetric box geometry based on the Axis-Aligned Bounding Box (AABB) of the volumetric data.
     * @returns {module:cesium.Geometry}
     */
    createVolumetricBoxGeometry(): any;
    legendValuesCount: any;
    /**
     * Creates the raw render state for the volumetric rendering.
     * @param options
     * @returns {*}
     */
    createRawRenderState(options: any): any;
    #private;
}
import * as Cesium from "cesium";
import { VolumetricRenderLayer } from "./VolumetricRenderLayer.js";
