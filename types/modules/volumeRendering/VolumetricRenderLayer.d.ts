export class VolumetricRenderLayer {
    constructor(viewer: any, context: any, jsonIndex: any, options: any);
    volumetricDatasArray: any[];
    viewer: any;
    context: any;
    jsonIndex: any;
    options: any;
    show: boolean;
    pollutionVolumeOwner: any;
    volume: any;
    jsonData: any;
    jsonUrl: any;
    jsonDataArray: any[];
    pngsBinBlocksArray: any[];
    _createTextureFromBlob_invertY(arrayBuffer: any): Promise<any>;
    _createTextureFromBlob(arrayBuffer: any): Promise<any>;
    _prepare(): Promise<void>;
    newVolumetricData(): VolumetricData;
    getMaxAltitude(): number;
    getMinAltitude(): number;
}
import { VolumetricData } from "./VolumetricData";
