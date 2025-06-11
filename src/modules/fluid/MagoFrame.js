import {ShaderLoader} from "../ShaderLoader.js";
import {MagoFluidOptions} from "./MagoFluidOptions.js";
import * as Cesium from "cesium";
import {Extent} from "../Extent.js";

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
export class MagoFrame {

    /**
     * Constructor for MagoFluid class
     * @param viewer Cesium Viewer instance
     */
    constructor(viewer, baseUrl = "/") {
        console.log("[MCT][FRAME] constructor");

        /**
         * Cesium Viewer instance
         * @type {Cesium.Viewer}
         */
        this.viewer = undefined;

        /**
         * Base URL for loading resources
         * @type {string}
         */
        this.baseUrl = baseUrl.replace(/\/$/, "");

        /**
         * Custom shader loader
         * @type {ShaderLoader}
         */
        this.customShaderLoader = undefined;

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
            status: "off", totalWater: 0,
        };

        /**
         * Default options for the water simulation.
         * @type MagoFluidOptions
         */
        this.options = new MagoFluidOptions();
        this.init(viewer);

        this.currentFrame = -1;
        this.frameNumber = 0;
        this.frameUrl = undefined;
        this.terrainUrl = undefined;

        this.frameterrainStatus = "off";
        this.frameStatus = "off";
        this.frameData = {};
    }

    /**
     * Initializes the viewer to render points on a globe.
     * @param viewer
     */
    init(viewer) {
        console.log("[MCT][FRAME] init");
        this.viewer = viewer;
        this.customShaderLoader = new ShaderLoader("/src/customShaders/water");

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
        this.info.status = "init";
    }

    /**
     * Creates a rectangle on the globe.
     * @param extent
     * @returns {Entity}
     */
    createRectangle(extent = this.extent) {
        console.log("[MCT][FRAME] createRectangle");
        const rectangle = Cesium.Rectangle.fromDegrees(extent.getMinLon(), extent.getMinLat(), extent.getMaxLon(), extent.getMaxLat());
        return this.viewer.entities.add({
            rectangle: {
                coordinates: rectangle, material: Cesium.Color.BLACK.withAlpha(0.1), outline: true, outlineColor: Cesium.Color.BLACK, clampToGround: true,
            }, polyline: {
                positions: Cesium.Cartesian3.fromRadiansArray([
                    rectangle.west, rectangle.south, rectangle.east, rectangle.south, rectangle.east, rectangle.north, rectangle.west, rectangle.north, rectangle.west, rectangle.south]),
                width: 3,
                material: Cesium.Color.RED.withAlpha(0.5),
                clampToGround: true,
            },
        });
    }

    calcLonLat(center, offset) {
        const transformMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const translatedMatrix = Cesium.Matrix4.multiplyByTranslation(transformMatrix, offset, new Cesium.Matrix4());
        const translation = Cesium.Matrix4.getTranslation(translatedMatrix, new Cesium.Cartesian3());
        const cartographic = Cesium.Cartographic.fromCartesian(translation);
        return {
            lon: Cesium.Math.toDegrees(cartographic.longitude), lat: Cesium.Math.toDegrees(cartographic.latitude),
        };
    }

    calcLonLatWithCenterMatrix(centerMatrix, offset) {
        const translatedMatrix = Cesium.Matrix4.multiplyByTranslation(centerMatrix, offset, new Cesium.Matrix4());
        const translation = Cesium.Matrix4.getTranslation(translatedMatrix, new Cesium.Cartesian3());
        const cartographic = Cesium.Cartographic.fromCartesian(translation);
        return {
            lon: Cesium.Math.toDegrees(cartographic.longitude), lat: Cesium.Math.toDegrees(cartographic.latitude),
        };
    }

    calcExtent(options) {
        const gridSize = !options.gridSize ? 8 : options.gridSize;
        const cellSize = !options.cellSize ? 1 : options.cellSize;

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
        console.log("[MCT][FRAME] initBase");
        this.info.status = "loading";
        this.clearWaterSourcePositions();
        this.clearWaterMinusSourcePositions();
        this.clearSeaWallPositions();

        await this.initWaterSimulation(options);
        await this.initializeWater();

        this.renderFrame();
        this.info.status = "ready";
    }

    /**
     * Starts the water simulation.
     * @returns {Promise<void>}
     */
    async start() {
        await this.startFrame();
        this.info.status = "running";
    }

    /**
     * Stops the water simulation.
     */
    stop() {
        if (this.intervalObject) {
            clearInterval(this.intervalObject);
        }
        this.info.status = "stopped";
    }

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
        const cellPosition = this.findCellFromDegree(lon, lat);
        const centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterSourcePositions.push(cellPosition * 4);
        console.log("[MCT][FRAME] setWaterSourcePosition", cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a water minus source position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addWaterMinusSourcePosition(lon, lat) {
        const cellPosition = this.findCellFromDegree(lon, lat);
        const centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterMinusSourcePositions.push(cellPosition * 4);
        console.log("[MCT][FRAME] setWaterMinusSourcePosition", cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a sea wall position to the simulation.
     * @param lon
     * @param lat
     * @returns {{lon: number, lat: number}}
     */
    addSeaWallPosition(lon, lat) {
        const cellPosition = this.findCellFromDegree(lon, lat);
        const centerPosition = this.calcCellCenterPosition(cellPosition);

        this.options.waterSeawallPositions.push(cellPosition * 4);
        console.log("[MCT][FRAME] setWaterSeawallPosition", cellPosition * 4);
        return centerPosition;
    }

    /**
     * Adds a random water source position to the simulation.
     */
    addRandomSourcePosition() {
        const gridSize = this.options.gridSize;
        const max = gridSize * gridSize;

        const randomSourceCell = Math.floor(Math.random() * max) * 4;
        console.log("[MCT][FRAME] setWaterSourcePosition", randomSourceCell);
        this.options.waterSourcePositions.push(randomSourceCell);
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

    async getGridUrl(gridSize) {
        return `${gridSize}x${gridSize}.glb`;
    }

    async initWaterSimulation(options) {
        this.initOptions(options);
        const gridSize = this.options.gridSize;
        const cellSize = this.options.cellSize;

        const terrainProvider = this.viewer.scene.terrainProvider;

        this.interval = this.options.interval;
        this.extent = this.calcExtent(options);

        const center = Cesium.Cartesian3.fromDegrees(options.lon, options.lat);

        let heightOffset = 0;
        if (terrainProvider instanceof Cesium.CesiumTerrainProvider) {
            const centerWithHeight = await Cesium.sampleTerrainMostDetailed(terrainProvider, [Cesium.Cartographic.fromDegrees(options.lon, options.lat)]);
            heightOffset = centerWithHeight[0].height;
        }
        this.options.heightOffset = heightOffset;

        const scaleVector = new Cesium.Cartesian3(cellSize, cellSize, 1.0);
        let transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        transform = Cesium.Matrix4.multiplyByScale(transform, scaleVector, new Cesium.Matrix4());
        transform = Cesium.Matrix4.multiplyByTranslation(transform, new Cesium.Cartesian3(0, 0, heightOffset), new Cesium.Matrix4());

        const baseUrl = this.baseUrl.replace(/\/$/, "");
        let gridModelUrl;
        if (options.gridUrl) {
            gridModelUrl = options.gridUrl;
        } else {
            gridModelUrl = baseUrl + "/grid/" + await this.getGridUrl(gridSize);
        }

        const gltf = await Cesium.Model.fromGltfAsync({
            url: gridModelUrl,
            modelMatrix: transform,
            debugShowBoundingVolume: false,
            enableDebugWireframe: true,
            debugWireframe: false,
            backFaceCulling: false,
            shadows: Cesium.ShadowMode.RECEIVE_ONLY,
        });
        this.gridPrimitive = gltf;

        const vertexShaderText = await this.customShaderLoader.getShaderSource("default-vertex-shader.vert");
        const fragmentShaderText = await this.customShaderLoader.getShaderSource("default-fragment-shader.frag");
        this.waterTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.waterTextureUniform = new Cesium.TextureUniform({
            typedArray: this.waterTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false,
        });

        this.fluxTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.fluxTextureUniform = new Cesium.TextureUniform({
            typedArray: this.fluxTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false,
        });

        this.terrainTextureArray = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
        this.terrainTextureUniform = new Cesium.TextureUniform({
            typedArray: this.terrainTextureArray,
            width: this.options.gridSize,
            height: this.options.gridSize,
            minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
            repeat: false,
        });

        this.customShader = new Cesium.CustomShader({
            uniforms: {
                u_height_offset: {
                    type: Cesium.UniformType.FLOAT, value: this.options.heightOffset,
                }, u_water_skirt: {
                    type: Cesium.UniformType.BOOL, value: this.options.waterSkirt,
                }, u_water: {
                    type: Cesium.UniformType.SAMPLER_2D, value: this.waterTextureUniform,
                }, u_terrain: {
                    type: Cesium.UniformType.SAMPLER_2D, value: this.terrainTextureUniform,
                }, u_flux: {
                    type: Cesium.UniformType.SAMPLER_2D, value: this.fluxTextureUniform,
                }, u_cell_size: {
                    type: Cesium.UniformType.FLOAT, value: this.options.cellSize,
                }, u_grid_size: {
                    type: Cesium.UniformType.FLOAT, value: this.options.gridSize,
                }, u_max_height: {
                    type: Cesium.UniformType.FLOAT, value: this.options.maxHeight,
                }, u_color_intensity: {
                    type: Cesium.UniformType.FLOAT, value: this.options.colorIntensity,
                }, u_max_opacity: {
                    type: Cesium.UniformType.FLOAT, value: this.options.maxOpacity,
                }, u_water_brightness: {
                    type: Cesium.UniformType.FLOAT, value: this.options.waterBrightness,
                }, u_height_palette: {
                    type: Cesium.UniformType.BOOL, value: this.options.heightPalette,
                }, u_water_color: {
                    type: Cesium.UniformType.VEC3, value: this.options.waterColor,
                },
            }, varyings: {
                v_normal: Cesium.VaryingType.VEC3,
                v_water_height: Cesium.VaryingType.FLOAT,
                v_temp_water_height: Cesium.VaryingType.FLOAT,
                v_texCoord: Cesium.VaryingType.VEC2,
                v_isNoWater: Cesium.VaryingType.FLOAT,
                v_flux_value: Cesium.VaryingType.VEC2,
                v_water_color: Cesium.VaryingType.VEC3,
            }, vertexShaderText: vertexShaderText, fragmentShaderText: fragmentShaderText, translucencyMode: Cesium.CustomShaderTranslucencyMode.TRANSLUCENT,
        });
        gltf.customShader = this.customShader;

        this.viewer.scene.primitives.add(gltf);
    }

    startFrame() {
        console.log("[MCT][FRAME] startWaterSimulation");
        if (this.intervalObject) {
            clearInterval(this.intervalObject);
        }
        this.intervalObject = setInterval(() => {
            this.renderFrame();
        }, this.options.interval);
    }

    async loadBinFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load the file: ${url}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        } catch (error) {
            console.error(`Failed to load the file: ${url}`, error);
        }
    }

    /**
     * Preloads the specified number of frames.
     * @param count
     * @param callback
     * @returns {Promise<void>}
     */
    async preload(count, callback) {
        console.log("[MCT][FRAME] preload frames", count);
        for (let i = 0; i < count; i++) {
            console.log("[MCT][FRAME] preload : ", i);
            const url = `${this.baseUrl}/sample/${i}.bin`;
            const frame = {
                status: "loading", data: undefined,
            };
            this.frameData[url] = frame;
            frame.data = await this.loadBinFromUrl(url);
            frame.status = "loaded";
            callback(count, i);
        }
    }

    async renderFrame() {
        if (!this.customShader) {
            return;
        }

        if (this.frameUrl) {
            if (this.currentFrame !== this.frameNumber) {
                if (this.frameStatus === "loading") {
                    return;
                }

                const binUrl = `${this.baseUrl}/sample/${this.frameNumber}.bin`;
                let bin;
                if (this.frameData[binUrl]) {
                    const frame = this.frameData[binUrl];
                    if (frame.status === "loaded") {
                        bin = frame.data;
                    }
                } else {
                    const frame = {
                        status: "loading", data: undefined,
                    };
                    this.frameData[binUrl] = frame;

                    this.frameStatus = "loading";
                    frame.data = await this.loadBinFromUrl(binUrl);
                    frame.status = "loaded";
                    bin = frame.data;
                    this.frameStatus = "loaded";
                }

                if (bin) {
                    this.waterTextureArray = bin;
                    this.waterTextureUniform = new Cesium.TextureUniform({
                        typedArray: this.waterTextureArray,
                        width: this.options.gridSize,
                        height: this.options.gridSize,
                        minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
                        magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
                        repeat: false,
                    });
                    this.customShader.setUniform("u_water", this.waterTextureUniform);
                    this.currentFrame = this.frameNumber;
                }
            }

            if (this.terrainMap === undefined && this.frameterrainStatus !== "loading") {
                this.frameterrainStatus = "loading";
                const bin = await this.loadBinFromUrl(this.terrainUrl);

                this.terrainTextureArray = bin;
                this.terrainTextureUniform = new Cesium.TextureUniform({
                    typedArray: this.terrainTextureArray,
                    width: this.options.gridSize,
                    height: this.options.gridSize,
                    minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
                    magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
                    repeat: false,
                });
                this.customShader.setUniform("u_terrain", this.terrainTextureUniform);
                this.terrainMap = [];
                this.frameterrainStatus = "loaded";
            }
        }
        this.customShader.setUniform("u_color_intensity", this.options.colorIntensity);
        this.customShader.setUniform("u_max_opacity", this.options.maxOpacity);
        this.customShader.setUniform("u_water_skirt", this.options.waterSkirt);
        this.customShader.setUniform("u_water_brightness", this.options.waterBrightness);
        this.customShader.setUniform("u_height_palette", this.options.heightPalette);
        this.customShader.setUniform("u_water_color", this.options.waterColor);
    }

    /**
     * Initializes the water simulation.
     * @returns {Promise<void>}
     */
    async initializeWater() {
        console.log("[MCT][FRAME] initializeWater");
        const gridSize = this.options.gridSize;
        this.waterMap = new Array(gridSize * gridSize).fill(0);
    }

    calcCellCenterPosition(index) {
        const gridSize = this.options.gridSize;
        const cellSize = this.options.cellSize;
        const realGridSize = gridSize * cellSize;
        const realj = (index % gridSize) * cellSize;
        const reali = Math.floor(index / gridSize) * cellSize;

        const leftBottomCartesian = Cesium.Cartesian3.fromDegrees(this.extent.getMinLon(), this.extent.getMinLat());
        const centerMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(leftBottomCartesian);
        const gridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - reali, realj, 0));

        console.log("[MCT][FRAME] calcCellCenterPosition", gridPosition);

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
                const realj = j * cellSize;
                const reali = i * cellSize;
                const gridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - reali, realj, 0));
                const nextGridPosition = this.calcLonLatWithCenterMatrix(centerMatrix, new Cesium.Cartesian3(realGridSize - (reali - cellSize), (realj - cellSize), 0));

                const inLon = gridPosition.lon <= lon && nextGridPosition.lon >= lon;
                const inLat = gridPosition.lat >= lat && nextGridPosition.lat <= lat;
                if (inLon && inLat) {
                    const index = this.findIndex(j, i);
                    console.log("[MCT][FRAME] findCellFromDegree", index);
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
}