/**
 * MagoTools is a class that creates a viewer to render points on a globe.
 * @class
 * @param {Viewer} viewer - Cesium Viewer instance
 * @example
 * const magoTools = new MagoTools(viewer);
 * magoTools.test();
 */
export class MagoTools {
    constructor(viewer: any);
    /**
     * @type {Viewer}
     */
    viewer: Viewer;
    /**
     * Tests the MagoTools class.
     * draws points on the globe.
     * @function
     * @returns {void}
     * @example
     * const magoTools = new MagoTools(viewer);
     * magoTools.test()
     */
    test(): void;
    /**
     * Initializes the viewer to render points on a globe.
     * @param lon {number} longitude degrees
     * @param lat {number} latitude degrees
     * @param height {number} height meters
     * @returns {void}
     * @example
     * magoTools.initPosition(126.978388, 37.566610, 10000)
     */
    initPosition(lon?: number, lat?: number, height?: number): void;
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
    flyTo(lon: number, lat: number, height?: number, duration?: number): void;
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
    addPoint(lon: number, lat: number, cssColor?: string, entitiesCollection?: any): void;
    /**
     * Adds a point to the globe.
     * @param cssColor {String} CSS color string "#ff0000"
     * @param entitiesCollection
     * @returns {void}
     * @example
     * magoTools.addPoint(126.978388, 37.566610, "#ff0000")
     */
    addRandomPoint(cssColor?: string, entitiesCollection?: any): void;
    /**
     * Samples random points on the globe.
     * @param count {number}
     * @param cssColor {string} CSS color string "#ff0000"
     * @param entitiesCollection
     * @returns {void}
     * @example
     * magoTools.addRandomPoints(1000, "#ffff00")
     */
    addRandomPoints(count: number, cssColor?: string, entitiesCollection?: any): void;
    /**
     * Changes the color of the globe.
     * @param cssColor {string} CSS color string "#ff0000"
     * @returns {void}
     * @example
     * magoTools.changeGlobeColor("#ff0000")
     */
    changeGlobeColor(cssColor: string): void;
    /**
     * Creates a grid imagery provider on the globe.
     * @returns {void}
     * @example
     * magoTools.createGridImageryProvider()
     */
    createGridImageryProvider(cell?: number): void;
    /**
     * VWORLD Imagery Layer Provider on the globe.
     * @param type {String} Base, Satellite, White, Midnight
     * @param extension {String} jpeg, png
     * @returns {module:cesium.ImageryLayer}
     * @example
     * magoTools.createVworldImageryLayer('Satellite', true, 'jpeg', '00000000-0000-0000-0000-000000000000')
     */
    createVworldImageryLayerWithoutToken(type: string, extension: string): any;
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
    createVworldImageryLayer(type: string, hybrid: boolean, extension: string, vworldKey: string): any;
    /**
     * Changes the terrain provider of the
     * @param url {String}
     * @returns {Promise<void>}
     * @example
     * changeTerrain('url')
     */
    changeTerrain(url: string): Promise<void>;
    /**
     * Creates a 3D model on the globe.
     * @param url {String}
     * @param lon {number}
     * @param lat {number}
     * @returns {void}
     * @example
     * createModel('/assets/lowpoly-tree.glb', 126.978388, 37.566610)
     */
    createModel(url: string, lon: number, lat: number, height?: number): void;
    destroy(): void;
}
import { Viewer } from "cesium";
