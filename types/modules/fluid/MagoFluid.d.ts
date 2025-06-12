/**
 * MagoFluid is a class that creates a water simulation on a globe.
 * @class
 * @param {Cesium.Viewer} viewer - Cesium Viewer instance
 * @example
 * const options = {
 *    lon: 126.978388,
 *    lat: 37.566610,
 *    cellSize: 1,
 *    gridSize: 512,
 * }
 * const magoFluid = new MagoFluid(viewer);
 * magoFluid.initBase(options);
 * magoFluid.start();
 * magoFluid.addRandomSourcePosition();
 */
export class MagoFluid {
    /**
     * Constructor for MagoFluid class
     * @constructor
     * @param viewer Cesium Viewer instance
     * @param baseUrl
     */
    constructor(viewer: any, baseUrl?: string);
    /**
     * Cesium Viewer instance
     * @type {Cesium.Viewer}
     */
    viewer: Cesium.Viewer;
    /**
     * Base URL for loading resources
     * @type {string}
     */
    baseUrl: string;
    /**
     * Custom shader loader
     * @type {ShaderLoader}
     */
    customShaderLoader: ShaderLoader;
    /**
     * Fluid Engine instance
     * @type {FluidEngine}
     */
    fluidEngine: FluidEngine;
    extent: Extent;
    gridPrimitive: Cesium.Model;
    customShader: Cesium.CustomShader;
    waterMap: any[];
    waterTextureArray: Uint8Array<ArrayBuffer>;
    waterTextureUniform: Cesium.TextureUniform;
    fluxTextureArray: Uint8Array<ArrayBuffer>;
    fluxTextureUniform: Cesium.TextureUniform;
    terrainMap: any[];
    terrainTextureArray: Uint8Array<ArrayBuffer>;
    terrainTextureUniform: Cesium.TextureUniform;
    buildingHeightArray: any[];
    intervalObject: NodeJS.Timeout;
    info: {
        status: string;
        totalWater: number;
    };
    /**
     * Default options for the water simulation.
     * @type MagoFluidOptions
     */
    options: MagoFluidOptions;
    /**
     * Initializes the viewer to render points on a globe.
     * @param viewer
     * @param baseUrl
     */
    init(viewer: any): void;
    /**
     * Creates a rectangle on the globe.
     * @param extent
     * @returns {Entity}
     */
    createRectangle(extent?: Extent): Entity;
    calcLonLat(center: any, offset: any): {
        lon: number;
        lat: number;
    };
    calcLonLatWithCenterMatrix(centerMatrix: any, offset: any): {
        lon: number;
        lat: number;
    };
    calcExtent(options: any): Extent;
    /**
     * Initializes the water simulation with the given options.
     * @param options
     * @returns {Promise<void>}
     */
    initBase(options: any): Promise<void>;
    /**
     * Starts the water simulation.
     * @returns {Promise<void>}
     */
    start(): Promise<void>;
    /**
     * Stops the water simulation.
     */
    stop(): void;
    /**
     * Clears the water source positions.
     */
    clearWaterSourcePositions(): void;
    /**
     * Clears the water minus source positions.
     */
    clearWaterMinusSourcePositions(): void;
    /**
     * Clears the sea wall positions.
     */
    clearSeaWallPositions(): void;
    /**
     * Adds a water source position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addWaterSourcePosition(lon: any, lat: any): {
        lon: number;
        lat: number;
    };
    /**
     * Adds a water minus source position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addWaterMinusSourcePosition(lon: any, lat: any): {
        lon: number;
        lat: number;
    };
    /**
     * Adds a sea wall position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addSeaWallPosition(lon: any, lat: any): {
        lon: number;
        lat: number;
    };
    /**
     * Adds a random water source position to the simulation.
     */
    addRandomSourcePosition(): void;
    initOptions(options: any): void;
    getGridUrl(gridSize: any): Promise<string>;
    initWaterSimulation(options: any): Promise<void>;
    interval: number;
    startFrame(): void;
    saveWaterImage(): void;
    /**
     * Saves the water map image as a PNG file.
     */
    saveWaterMapImage(zip: any, fileName: any): void;
    /**
     * Saves the terrain map image as a PNG file.
     * @param isFirstFrame
     */
    saveTerrainMapImage(zip: any, fileName: any): void;
    renderFrame(isFirstFrame: any): void;
    /**
     * Initializes the water simulation.
     * @returns {Promise<void>}
     */
    initializeWater(): Promise<void>;
    initializeTerrain(): Promise<void>;
    calcCellCenterPosition(index: any): {
        lon: number;
        lat: number;
    };
    findCellFromDegree(lon: any, lat: any): any;
    findIndex(x: any, y: any): any;
    convertMapToArray(map: any, maxValue: any): Uint8Array<ArrayBuffer>;
}
import * as Cesium from "cesium";
import { ShaderLoader } from "../ShaderLoader.js";
import { FluidEngine } from "./FluidEngine.js";
import { Extent } from "../Extent.js";
import { MagoFluidOptions } from "./MagoFluidOptions.js";
