import {ShaderLoader} from "../ShaderLoader.js";
import {WaterSimulator} from "./WaterSimulator.js";
import * as Cesium from "cesium";
import {Extent} from "../Extent.js";

import grid64 from '/src/assets/grid/64x64.glb';
import grid128 from '/src/assets/grid/128x128.glb';
import grid256 from '/src/assets/grid/256x256.glb';
import grid512 from '/src/assets/grid/512x512.glb';
import grid1024 from '/src/assets/grid/1024x1024.glb';

//const grids = import.meta.glob('/src/assets/grid/*.glb', { as: 'raw' });

/**
 * MagoWaterSimulation is a class that creates a water simulation on a globe.
 */
export class MagoWaterSimulation {

    /**
     * Constructor for MagoWaterSimulation class
     * @param viewer Cesium Viewer instance
     */
    constructor (viewer) {
        console.log('[MCT][WATER] constructor');

        this.viewer = undefined;
        this.customShaderLoader = undefined;
        this.waterSimulator = undefined;

        //this.extent = {minLon: 0, minLat: 0, maxLon: 0, maxLat: 0};

        this.extent = new Extent(0, 0, 0, 0);
        this.gridPrimitive = undefined;
        this.customShader = undefined;

        this.waterMap = undefined;
        this.waterTextureArray = undefined;
        this.waterTextureUniform = undefined;

        this.fluxTextureArray = undefined;
        this.fluxTextureUniform = undefined;

        this.terrainMap = undefined;
        this.terrainTextureArray = undefined;
        this.terrainTextureUniform = undefined;

        this.buildingHeightArray = [];

        this.intervalObject = undefined;

        this.info = {
            status: 'off',
            totalWater: 0,
        }

        /**
         * Default options for the water simulation.
         * @type {{waterColor: module:cesium.Color, cellSize: number, gridSize: number, maxHeight: number, maxFlux: number, interval: number, gravity: number, timeStep: number, waterDensity: number, cushionFactor: number, evaporationRate: number, rainAmount: number, rainMaxPrecipitation: number, waterSourceAmount: number, waterSourcePositions: *[], waterSourceArea: number, waterMinusSourceAmount: number, waterMinusSourcePositions: *[], waterMinusSourceArea: number, waterSeawallHeight: number, waterSeawallPositions: *[], waterSeawallArea: number, heightPalette: boolean, waterSkirt: boolean, simulationConfine: boolean, colorIntensity: number, waterBrightness: number}}
         */
        this.options = {
            waterColor : new Cesium.Color(0.25, 0.75, 1.0),

            cellSize : 1,
            gridSize : 512,
            maxHeight : 10000.0,
            maxFlux : 10000.,
            interval : 1000 / 60,
            gravity : 9.80665,
            timeStep : 0.1,
            waterDensity : 998.0,
            cushionFactor : 0.998,
            evaporationRate : 0.0001,

            /* rain */
            rainAmount : 1, // percent
            rainMaxPrecipitation : 0.00,

            /* water source */
            waterSourceAmount : 5,
            //waterSourcePosition : -1,
            waterSourcePositions : [],
            waterSourceArea : 1,

            /* water minus source */
            waterMinusSourceAmount : 5,
            //waterMinusSourcePosition : -1,
            waterMinusSourcePositions : [],
            waterMinusSourceArea : 2,

            /* seawall */
            waterSeawallHeight : 50.0,
            waterSeawallPositions : [],
            waterSeawallArea : 4,

            heightPalette : false,
            waterSkirt : true,
            simulationConfine : false,
            colorIntensity : 1.0,
            waterBrightness : 0.5,
        }
        this.init(viewer);
    }

    /**
     * Initializes the viewer to render points on a globe.
     * @param viewer
     */
    init(viewer) {
        console.log('[MCT][WATER] init');
        this.viewer = viewer;
        this.waterSimulator = new WaterSimulator(this.options);
        this.customShaderLoader = new ShaderLoader("/src/customShaders");

        if (this.gridPrimitive) {
            this.viewer.scene.primitives.remove(this.gridPrimitive);
        }
        if (this.intervalObject) {
            clearInterval(this.intervalObject);
        }
        this.extent = new Extent(0, 0, 0, 0);
        this.gridPrimitive = undefined;
        this.customShader = undefined;
        this.waterMap = undefined;
        this.waterTextureArray = undefined;
        this.waterTextureUniform = undefined;
        this.fluxTextureArray = undefined;
        this.fluxTextureUniform = undefined;
        this.terrainMap = undefined;
        this.terrainTextureArray = undefined;
        this.terrainTextureUniform = undefined;
        this.buildingHeightArray = [];
        this.intervalObject = undefined;
        this.info.status = 'init';
    }

    createRectangle(extent) {
        console.log('[MCT][WATER] createRectangle');
        if (!extent) {
            extent = this.extent;
        }
        const rectangle = Cesium.Rectangle.fromDegrees(extent.getMinLon(), extent.getMinLat(), extent.getMaxLon(), extent.getMaxLat());
        return this.viewer.entities.add({
            rectangle: {
                coordinates: rectangle,
                material: Cesium.Color.BLACK.withAlpha(0.1),
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                clampToGround: true
            },
            polyline: {
                positions: Cesium.Cartesian3.fromRadiansArray([
                    rectangle.west, rectangle.south,
                    rectangle.east, rectangle.south,
                    rectangle.east, rectangle.north,
                    rectangle.west, rectangle.north,
                    rectangle.west, rectangle.south
                ]),
                width: 3,
                material: Cesium.Color.RED.withAlpha(0.5),
                clampToGround: true
            }
        });
    }

    calcLonLat(center, offset)  {
        const transformMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        let translatedMatrix = Cesium.Matrix4.multiplyByTranslation(transformMatrix, offset, new Cesium.Matrix4());
        let translation = Cesium.Matrix4.getTranslation(translatedMatrix, new Cesium.Cartesian3());
        let cartographic = Cesium.Cartographic.fromCartesian(translation);
        return {
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude)
        }
    }

    calcLonLatWithCenterMatrix(centerMatrix, offset)  {
        let translatedMatrix = Cesium.Matrix4.multiplyByTranslation(centerMatrix, offset, new Cesium.Matrix4());
        let translation = Cesium.Matrix4.getTranslation(translatedMatrix, new Cesium.Cartesian3());
        let cartographic = Cesium.Cartographic.fromCartesian(translation);
        return {
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude)
        }
    }

    calcExtent(options) {
        const gridSize = !options.gridSize ? 8 : options.gridSize;
        const cellSize = !options.cellSize ? 1 : options.cellSize;

        //const extent = new Extent(0, 0, 0, 0);

        const realGridSize = gridSize * cellSize;
        const center = Cesium.Cartesian3.fromDegrees(options.lon, options.lat);
        const leftDown = new Cesium.Cartesian3(-realGridSize / 2.0, -realGridSize / 2.0, 0.0);
        const rightTop = new Cesium.Cartesian3(realGridSize / 2.0, realGridSize / 2.0, 0.0);
        const leftDownLonLat = this.calcLonLat(center, leftDown);
        const rightTopLonLat = this.calcLonLat(center, rightTop);

        const extent = Extent.createFromDegrees(leftDownLonLat.lon, leftDownLonLat.lat, rightTopLonLat.lon, rightTopLonLat.lat);
        return extent;
    }

    /**
     * Initializes the water simulation with the given options.
     * @param options
     * @returns {Promise<void>}
     */
    async initBase(options) {
        console.log('[MCT][WATER] initBase');
        this.info.status = 'loading';
        this.clearWaterSourcePositions();
        this.clearWaterMinusSourcePositions();
        this.clearSeaWallPositions();

        await this.initWaterSimulation(options);
        await this.initializeWater();
        await this.initializeTerrain();
        //this.initWaterSource();
        this.renderFrame(true);
        this.info.status = 'ready';
    }

    /**
     * Starts the water simulation.
     * @returns {Promise<void>}
     */
    async start() {
        await this.startFrame();
        this.info.status = 'running';
    }

    /**
     * Stops the water simulation.
     */
    stop() {
        if (this.intervalObject) {
            clearInterval(this.intervalObject);
        }
        this.info.status = 'stopped';
    }

    /*initWaterSource() {
        const gridSize = this.options.gridSize;
        let cellPosition = ((gridSize * (gridSize / 2)) + (gridSize / 2)) * 4;
        console.log('[MCT][WATER] setWaterSourcePosition', cellPosition);
        this.options.waterSourcePosition = cellPosition;
    }*/

    /*setWaterSourcePosition(lon, lat) {
        let cellPosition = this.findCellFromDegree(lon, lat);
        console.log('[MCT][WATER] setWaterSourcePosition', cellPosition);
        this.options.waterSourcePosition = cellPosition;
    }*/

    /**
     * Clears the water source positions.
     */
    clearWaterSourcePositions() {
        this.options.waterSourcePositions = [];
    }

    /**
     * Clears the water minus source positions.
     */
    clearWaterMinusSourcePositions() {
        this.options.waterMinusSourcePositions = [];
    }

    /**
     * Clears the sea wall positions.
     */
    clearSeaWallPositions() {
        this.options.waterSeawallPositions = [];
    }

    /**
     * Adds a water source position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addWaterSourcePosition(lon, lat) {
        let cellPosition = this.findCellFromDegree(lon, lat);
        let centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterSourcePositions.push(cellPosition * 4);
        console.log('[MCT][WATER] setWaterSourcePosition', cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a water minus source position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addWaterMinusSourcePosition(lon, lat) {
        let cellPosition = this.findCellFromDegree(lon, lat);
        let centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterMinusSourcePositions.push(cellPosition * 4);
        console.log('[MCT][WATER] setWaterMinusSourcePosition', cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a sea wall position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addSeaWallPosition(lon, lat) {
        let cellPosition = this.findCellFromDegree(lon, lat);
        let centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterSeawallPositions.push(cellPosition * 4);
        console.log('[MCT][WATER] setWaterSeawallPosition', cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a random water source position to the simulation.
     */
    addRandomSourcePosition() {
        const gridSize = this.options.gridSize;
        const max = gridSize * gridSize;

        const randomSourceCell = Math.floor(Math.random() * max) * 4;
        console.log('[MCT][WATER] setWaterSourcePosition', randomSourceCell);
        this.options.waterSourcePositions.push(randomSourceCell);
        //this.options.waterSourceAmount = Math.floor(Math.random() * 10);
    }

    initOptions(options) {
        if (!options) {
            return;
        }

        if (options.cellSize) {
            this.options.cellSize = options.cellSize < 1 ? 1 : options.cellSize;
        }
        if (options.gridSize) {
            this.options.gridSize = options.gridSize < 8 ? 8 : options.gridSize;
        }
        if (options.interval) {
            this.options.interval = options.interval;
        }
    }

    getGridUrl(gridSize) {
        let grid;
        if (gridSize === 64) {
            grid = grid64;
        } else if (gridSize === 128) {
            grid = grid128;
        } else if (gridSize === 256) {
            grid = grid256;
        } else if (gridSize === 512) {
            grid = grid512;
        } else if (gridSize === 1024) {
            grid = grid1024;
        } else {
            throw new Error(`[MCT][WATER] ${gridSize}x${gridSize}.glb grid file is not found`);
        }
        return grid;
    }

    async initWaterSimulation(options) {
        this.initOptions(options);
        const gridSize = this.options.gridSize;
        const cellSize = this.options.cellSize;

        this.interval = this.options.interval;
        this.extent = this.calcExtent(options);
        const center = Cesium.Cartesian3.fromDegrees(options.lon, options.lat);
        const scaleVector = new Cesium.Cartesian3(cellSize, cellSize, 1.0);
        let transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        transform = Cesium.Matrix4.multiplyByScale(transform, scaleVector, new Cesium.Matrix4());

        let gridModelUrl;
        if (options.gridUrl) {
            gridModelUrl = options.gridUrl;
        } else {
            gridModelUrl = this.getGridUrl(gridSize);
        }

        const gltf = await Cesium.Model.fromGltfAsync({
            url: gridModelUrl,
            //url: grid,
            modelMatrix: transform,
            enableDebugWireframe: true,
            debugWireframe: false,
            backFaceCulling: false,
            shadows: Cesium.ShadowMode.RECEIVE_ONLY,
        });
        this.gridPrimitive = gltf;

        const vertexShaderText = await this.customShaderLoader.getShaderSource('default-vertex-shader.vert');
        const fragmentShaderText = await this.customShaderLoader.getShaderSource('default-fragment-shader.frag');
        this.waterTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.waterTextureUniform = new Cesium.TextureUniform({
            typedArray: this.waterTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false
        });

        this.fluxTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.fluxTextureUniform = new Cesium.TextureUniform({
            typedArray: this.fluxTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false
        });

        /*this.waterNormalTexture = new Cesium.TextureUniform({
            url: "/data/water-diff.png",
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: true
        });*/
        //this.customShader.setUniform('u_water_normal_texture', this.waterNormalTexture);

        //loadBuildingTexture();

        /*this.buildingTextureArray = new Uint8Array(this.gridSize * this.gridSize * 4);
        this.buildingTextureUniform = new Cesium.TextureUniform({
            url: "/data/grid/sample.png",
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false
        });*/

        this.terrainTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.terrainTextureUniform = new Cesium.TextureUniform({
            typedArray: this.terrainTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false
        });

        this.customShader = new Cesium.CustomShader({
            uniforms: {
                u_water_skirt: {
                    type: Cesium.UniformType.BOOL,
                    value: this.options.waterSkirt
                }, u_water: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: this.waterTextureUniform
                }, u_terrain: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: this.terrainTextureUniform
                }, u_flux: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: this.fluxTextureUniform
                }, u_cell_size: {
                    type: Cesium.UniformType.FLOAT,
                    value: this.options.cellSize
                }, u_grid_size: {
                    type: Cesium.UniformType.FLOAT,
                    value: this.options.gridSize
                }, u_max_height: {
                    type: Cesium.UniformType.FLOAT,
                    value: this.options.maxHeight
                }, u_color_intensity: {
                    type: Cesium.UniformType.FLOAT,
                    value: this.options.colorIntensity
                }, u_water_brightness: {
                    type: Cesium.UniformType.FLOAT,
                    value: this.options.waterBrightness
                }, u_height_palette: {
                    type: Cesium.UniformType.BOOL,
                    value: this.options.heightPalette
                }, u_water_color: {
                    type: Cesium.UniformType.VEC3,
                    value: this.options.waterColor,
                },
                /*u_water_normal_texture: {
                    type: Cesium.UniformType.SAMPLER_2D,
                    value: this.waterNormalTexture
                }*/
            },
            varyings: {
                v_normal: Cesium.VaryingType.VEC3,
                v_water_height: Cesium.VaryingType.FLOAT,
                v_temp_water_height: Cesium.VaryingType.FLOAT,
                v_texCoord: Cesium.VaryingType.VEC2,
                v_isNoWater: Cesium.VaryingType.FLOAT,
                //v_normal_texture: Cesium.VaryingType.VEC3,
                v_flux_value: Cesium.VaryingType.VEC2,
                v_water_color: Cesium.VaryingType.VEC3
            },
            vertexShaderText: vertexShaderText,
            fragmentShaderText: fragmentShaderText,
            lightingModel: Cesium.LightingModel.UNLIT,
            mode: Cesium.CustomShaderMode.MODIFY_MATERIAL,
            translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
        });
        gltf.customShader = this.customShader;

        this.viewer.scene.primitives.add(gltf);
    }

    startFrame() {
        console.log('[MCT][WATER] startWaterSimulation');
        let stepCount = 0;

        if (this.intervalObject) {
            clearInterval(this.intervalObject);
        }

        this.intervalObject = setInterval(() => {
            const isInitialFrame = stepCount === 0;
            this.renderFrame(isInitialFrame);
            stepCount++;
        }, this.options.interval);
    }

    /**
     * Saves the water map image as a PNG file.
     */
    saveWaterMapImage() {
        const simulationInfo = this.waterSimulator.simulationInfo;
        this.waterSimulator.saveUint8ArrayAsPNG(simulationInfo.waterUint8Array, this.options.gridSize, this.options.gridSize);
    }

    renderFrame(isFirstFrame) {
        if (!this.customShader) {
            return;
        }

        const simulationInfo = this.waterSimulator.simulationInfo;

        this.waterSimulator.calculateSimulation();
        this.info.totalWater = simulationInfo.totalWater;
        this.waterTextureUniform.typedArray = simulationInfo.waterUint8Array;
        this.fluxTextureUniform.typedArray = simulationInfo.fluxUint8Array;

        this.customShader.setUniform('u_water', this.waterTextureUniform);
        this.customShader.setUniform('u_flux', this.fluxTextureUniform);
        this.customShader.setUniform('u_color_intensity', this.options.colorIntensity);
        this.customShader.setUniform('u_water_skirt', this.options.waterSkirt);
        this.customShader.setUniform('u_water_brightness', this.options.waterBrightness);
        this.customShader.setUniform('u_height_palette', this.options.heightPalette);
        this.customShader.setUniform('u_water_color', this.options.waterColor);

        if (isFirstFrame) {
            console.log('[MCT][WATER] render first frame');
            this.terrainTextureUniform.typedArray = this.convertMapToArray(this.terrainMap, this.options.maxHeight);
            this.waterSimulator.setTerrainTexture(this.terrainTextureUniform.typedArray);
            this.customShader.setUniform('u_terrain', this.terrainTextureUniform);
            //this.customShader.setUniform('u_water_normal_texture', this.waterNormalTexture);
        }
    }

    /**
     * Initializes the water simulation.
     * @returns {Promise<void>}
     */
    async initializeWater(){
        console.log('[MCT][WATER] initializeWater');
        const gridSize = this.options.gridSize;
        this.waterMap = new Array(gridSize * gridSize).fill(0);
        await this.waterSimulator.resetWaterTexture();
    }

    async initializeTerrain() {
        console.log('[MCT][WATER] initializeTerrain');
        const gridSize = this.options.gridSize;
        let cellSize = this.options.cellSize;
        this.terrainMap = new Array(gridSize * gridSize).fill(0);
        const terrainProvider = this.viewer.scene.terrainProvider;

        const extent = this.extent;
        const minLon = extent.getMinLon();
        const minLat = extent.getMinLat();

        if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
            /*const terrainHeight = 0;
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    if (j > gridSize / 3 && i > gridSize / 3) {
                        this.terrainMap[this.findIndex(j, i)] = j / 4;
                    }
                }
            }*/
        } else if (terrainProvider instanceof Cesium.CesiumTerrainProvider) {
            const leftBottomCartesian = Cesium.Cartesian3.fromDegrees(minLon, minLat);
            const centerMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(leftBottomCartesian);
            let positions = [];
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    let realGridSize = gridSize * cellSize;
                    let realj = j * cellSize;
                    let reali = i * cellSize;

                    let gridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - reali, realj, 0));
                    let position = new Cesium.Cartographic(Cesium.Math.toRadians(gridPosition.lon), Cesium.Math.toRadians(gridPosition.lat), 0);
                    positions.push(position);
                }
            }
            const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions, false);
            //const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 13, positions, false);


            const terrainOffset = 1;
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {

                    this.terrainMap[this.findIndex(j, i)] = updatedPositions[this.findIndex(j, i)].height + terrainOffset;
                }
            }
        }

        if (this.buildingHeightArray.length > 0) {
            const buildingHeightArray = this.buildingHeightArray;
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    const gridIndex = this.findIndex(j, i);
                    this.terrainMap[gridIndex] += buildingHeightArray[gridIndex];
                }
            }
        }
    }

    calcCellCenterPosition(index) {
        const gridSize = this.options.gridSize;
        const cellSize = this.options.cellSize;
        const realGridSize = gridSize * cellSize;
        const realj = (index % gridSize) * cellSize;
        const reali = Math.floor(index / gridSize) * cellSize;

        const leftBottomCartesian = Cesium.Cartesian3.fromDegrees(this.extent.getMinLon(), this.extent.getMinLat());
        const centerMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(leftBottomCartesian);
        let gridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - reali, realj, 0));

        console.log('[MCT][WATER] calcCellCenterPosition', gridPosition);

        return gridPosition;
    }

    findCellFromDegree(lon, lat) {
        const extent = this.extent;
        const minLon = extent.getMinLon();
        const minLat = extent.getMinLat();

        const gridSize = this.options.gridSize;
        const cellSize = this.options.cellSize;
        const realGridSize = gridSize * cellSize;

        const leftBottomCartesian = Cesium.Cartesian3.fromDegrees(minLon, minLat);
        const centerMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(leftBottomCartesian);
        for (let i = 0; i < gridSize - 1; i++) {
            for (let j = 0; j < gridSize - 1; j++) {
                let realj = j * cellSize;
                let reali = i * cellSize;
                let gridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - reali, realj, 0));
                let nextGridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - (reali - cellSize), (realj - cellSize), 0));

                let inLon = gridPosition.lon <= lon && nextGridPosition.lon >= lon;
                let inLat = gridPosition.lat >= lat && nextGridPosition.lat <= lat;
                if (inLon && inLat) {
                    const index = this.findIndex(j, i);
                    console.log('[MCT][WATER] findCellFromDegree', index);
                    return index;
                }
            }
        }
        return -1;
    }

    findIndex(x, y) {
        const gridSize = this.options.gridSize;
        return x + y * gridSize;
    }

    convertMapToArray(map, maxValue) {
        const gridSize = this.options.gridSize;
        const arraySize = gridSize * gridSize * 4;
        const mapArray = new Uint8Array(arraySize);
        for (let i = 0; i < arraySize; i += 4) {
            const valueR = map[i / 4];
            const rgba = this.waterSimulator.pack(valueR / maxValue);
            mapArray[i] = rgba[0] * 255;
            mapArray[i + 1] = rgba[1] * 255;
            mapArray[i + 2] = rgba[2] * 255;
            mapArray[i + 3] = rgba[3] * 255;
        }
        return mapArray;
    }
}