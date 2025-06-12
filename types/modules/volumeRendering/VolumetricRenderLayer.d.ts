/**
 * VolumetricRenderLayer class for managing volumetric data rendering in Cesium.
 */
export class VolumetricRenderLayer {
    /**
     * Creates an instance of VolumetricRenderLayer.
     * @param viewer
     * @param options
     */
    constructor(viewer: any, options: any);
    volumetricDatasArray: any[];
    viewer: any;
    context: any;
    jsonIndex: any;
    options: any;
    show: boolean;
    pollutionVolumeOwner: any;
    volume: any;
    pngsBinBlocksArray: any[];
    _prepare(): Promise<void>;
    newVolumetricData(): VolumetricData;
    getMaxAltitude(): number;
    getMinAltitude(): number;
    #private;
}
import { VolumetricData } from "./VolumetricData";
