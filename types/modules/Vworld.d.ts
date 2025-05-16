/**
 * MagoTools is a class that creates a viewer to render points on a globe.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoTools = new MagoTools(viewer);
 * magoTools.test();
 */
export class Vworld {
    constructor(viewer: any);
    viewer: any;
    token: string;
    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param extension {String} jpeg, png
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayerWithoutToken('Satellite', true, 'jpeg')
     */
    createVworldImageryLayerWithoutToken(type: string, extension: string): any;
    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param hybrid {boolean}
     * @param extension {String} jpeg, png
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayer('Satellite', true, 'jpeg', '00000000-0000-0000-0000-000000000000')
     */
    createVworldImageryLayer(type: string, hybrid: boolean, extension: string): any;
    /**
     * Get address coordinates
     * @param address
     * @param type
     * @returns {Promise<*>}
     */
    getAddressCoord(address: any, type: any): Promise<any>;
    /**
     * @private
     * Get address coordinates using JSONP
     * @param address {String} Address Text to search
     * @param type {String} ROAD, PARCEL
     * @returns {Promise<unknown>}
     */
    private getAddressCoordProxy;
}
