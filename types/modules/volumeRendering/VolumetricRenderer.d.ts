export class VolumetricRenderer {
    /**
     * Constructor for the VolumetricRenderer class.
     * @param viewer
     * @param options
     */
    constructor(viewer: any, options: any);
    viewer: any;
    shaderLoader: any;
    context: any;
    jsonIndex: any;
    pngsBinBlocksArray: any;
    airPollutionLayers: any[];
    collection: Cesium.PrimitiveCollection;
    primitiveCollection: Cesium.PrimitiveCollection;
    currentIdx: number;
    map_pngOriginalFileName_pngsBinData: {};
    renderingColorType: any;
    cuttingAAPlanePositionMC: any;
    cuttingAAPlaneNormalMC: any;
    samplingsCount: any;
    colorLegends: any;
    legendValues: any;
    legendValuesScale: any;
    init(): Promise<void>;
    addIndex(): void;
    onChangeIdx(value: any): void;
    onChangeCuttingPlanePositionMC(value: any): void;
    createRenderPrimitives(): Promise<void>;
    _prepareAirPollutionLayers(): Promise<void>;
    getPrimitiveCollection(): Cesium.PrimitiveCollection;
    getBlobArrayBuffer(mosaicFileName: any): any;
    getAABB(): any;
    createVolumetricBoxGeometry(): Cesium.Geometry;
    legendValuesCount: any;
    createRawRenderState(options: any): any;
    #private;
}
import * as Cesium from "cesium";
