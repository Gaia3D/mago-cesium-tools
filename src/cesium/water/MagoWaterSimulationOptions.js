import * as Cesium from "cesium";

/**
 * MagoWaterSimulationOptions is a class that creates a simulation of water.
 */
export class MagoWaterSimulationOptions {
    constructor() {
        /**
         * Water color
         * @type {Cesium.Color}
         */
        this.waterColor = new Cesium.Color(0.25, 0.75, 1.0);

        /**
         * Water color
         * @type {number}
         * @default 1.0
         */
        this.cellSize = 1;

        /**
         * Grid size
         * @type {number}
         * @default 512
         */
        this.gridSize = 512;

        /**
         * Max height
         * @type {number}
         * @default 10000.0
         */
        this.maxHeight = 10000.0;

        /**
         * Max flux
         * @type {number}
         * @default 10000.0
         */
        this.maxFlux = 10000.0;

        /**
         * Interval
         * @type {number}
         * @default 1000 / 60
         */
        this.interval = 1000 / 60;

        /**
         * Gravity
         * @type {number}
         * @default 9.80665
         */
        this.gravity = 9.80665;

        /**
         * Time step
         * @type {number}
         * @default 0.1
         */
        this.timeStep = 0.1;

        /**
         * Water density
         * @type {number}
         * @default 998.0
         */
        this.waterDensity = 998.0;

        /**
         * Cushion factor
         * @type {number}
         * @default 0.998
         */
        this.cushionFactor = 0.998;

        /**
         * Evaporation rate
         * @type {number}
         * @default 0.0001
         */
        this.evaporationRate = 0.0001;

        /**
         * Rain amount
         * @type {number}
         */
        this.rainAmount = 1; // percent

        /**
         * Rain max precipitation
         * @type {number}
         * @default 0.00
         */
        this.rainMaxPrecipitation = 0.00;

        /**
         * Water source amount
         * @type {number}
         * @default 5
         */
        this.waterSourceAmount = 5;

        /**
         * Water source positions
         * @type {Array}
         * @default []
         */
        this.waterSourcePositions = [];

        /**
         * Water source area
         * @type {number}
         * @default 1
         */
        this.waterSourceArea = 1;

        /**
         * Water minus source amount
         * @type {number}
         * @default 5
         */
        this.waterMinusSourceAmount = 5;

        /**
         * Water minus source positions
         * @type {Array}
         * @default []
         */
        this.waterMinusSourcePositions = [];

        /**
         * Water minus source area
         * @type {number}
         * @default 2
         */
        this.waterMinusSourceArea = 2;

        /**
         * Water seawall height
         * @type {number}
         * @default 50.0
         */
        this.waterSeawallHeight = 50.0;

        /**
         * Water seawall positions
         * @type {Array}
         * @default []
         */
        this.waterSeawallPositions = [];

        /**
         * Water seawall area
         * @type {number}
         * @default 4
         */
        this.waterSeawallArea = 4;

        /**
         * Water seawall thickness
         * @type {boolean}
         * @default false
         */
        this.heightPalette = false;

        /**
         * Water skirt
         * @type {boolean}
         * @default true
         */
        this.waterSkirt = true;

        /**
         * Simulation confine
         * @type {boolean}
         * @default false
         */
        this.simulationConfine = false;

        /**
         * Color Intensity
         * @type {number}
         * @default 1.0
         */
        this.colorIntensity = 1.0;

        /**
         * Water brightness
         * @type {number}
         * @default 0.5
         */
        this.waterBrightness = 0.5;
    }
}