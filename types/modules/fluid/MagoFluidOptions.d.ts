/**
 * MagoFluidOptions is a class that creates a simulation of water.
 */
export class MagoFluidOptions {
    /**
     * Height Offset
     * @type {number}
     */
    heightOffset: number;
    /**
     * Water color
     * @type {Cesium.Color}
     */
    waterColor: Cesium.Color;
    /**
     * Water color
     * @type {number}
     * @default 1.0
     */
    cellSize: number;
    /**
     * Grid size
     * @type {number}
     * @default 512
     */
    gridSize: number;
    /**
     * Max height
     * @type {number}
     * @default 10000.0
     */
    maxHeight: number;
    /**
     * Max flux
     * @type {number}
     * @default 10000.0
     */
    maxFlux: number;
    /**
     * Interval
     * @type {number}
     * @default 1000 / 60
     */
    interval: number;
    /**
     * Gravity
     * @type {number}
     * @default 9.80665
     */
    gravity: number;
    /**
     * Time step
     * @type {number}
     * @default 0.1
     */
    timeStep: number;
    /**
     * Water density
     * @type {number}
     * @default 998.0
     */
    waterDensity: number;
    /**
     * Cushion factor
     * @type {number}
     * @default 0.998
     */
    cushionFactor: number;
    /**
     * Evaporation rate
     * @type {number}
     * @default 0.0001
     */
    evaporationRate: number;
    /**
     * Rain amount
     * @type {number}
     */
    rainAmount: number;
    /**
     * Rain max precipitation
     * @type {number}
     * @default 0.00
     */
    rainMaxPrecipitation: number;
    /**
     * Water source amount
     * @type {number}
     * @default 5
     */
    waterSourceAmount: number;
    /**
     * Water source positions
     * @type {Array}
     * @default []
     */
    waterSourcePositions: any[];
    /**
     * Water source area
     * @type {number}
     * @default 1
     */
    waterSourceArea: number;
    /**
     * Water minus source amount
     * @type {number}
     * @default 5
     */
    waterMinusSourceAmount: number;
    /**
     * Water minus source positions
     * @type {Array}
     * @default []
     */
    waterMinusSourcePositions: any[];
    /**
     * Water minus source area
     * @type {number}
     * @default 2
     */
    waterMinusSourceArea: number;
    /**
     * Water seawall height
     * @type {number}
     * @default 50.0
     */
    waterSeawallHeight: number;
    /**
     * Water seawall positions
     * @type {Array}
     * @default []
     */
    waterSeawallPositions: any[];
    /**
     * Water seawall area
     * @type {number}
     * @default 4
     */
    waterSeawallArea: number;
    /**
     * Water seawall thickness
     * @type {boolean}
     * @default false
     */
    heightPalette: boolean;
    /**
     * Water skirt
     * @type {boolean}
     * @default true
     */
    waterSkirt: boolean;
    /**
     * Simulation confine
     * @type {boolean}
     * @default false
     */
    simulationConfine: boolean;
    /**
     * Color Intensity
     * @type {number}
     * @default 1.0
     */
    colorIntensity: number;
    /**
     * Water brightness
     * @type {number}
     * @default 0.5
     */
    waterBrightness: number;
    /**
     * Water contrast
     * @type {number}
     */
    maxOpacity: number;
}
import * as Cesium from "cesium";
