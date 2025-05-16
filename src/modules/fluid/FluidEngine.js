import {ShaderLoader} from "../ShaderLoader.js";
import {pack, unpack} from "../DepthTools.js";

export class FluidEngine {
    constructor(options) {
        this.shaderLoader = new ShaderLoader("/src/shaders/water");
        this.options = options;
        this.fluxShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,

            sourceTexture: null,
            minusSourceTexture: null,
            seaWallTexture: null,

            waterTexture: null,
            terrainTexture: null,
            fluxUpTexture: null,
            fluxDownTexture: null,
            fluxRightTexture: null,
            fluxLeftTexture: null,

            waterOutputTexture: null,
            fluxUpOutputTexture: null,
            fluxDownOutputTexture: null,
            fluxRightOutputTexture: null,
            fluxLeftOutputTexture: null,
        };
        this.waterVelocityShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            waterOutputTexture: null,
            velocityOutputTexture: null,
        };
        this.waterHeightShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            waterOutputTexture: null,
        };
        this.particlesShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            particlesPositionTexture: null,
            particlesPositionOutputTexture: null,
            particleTexture: null,
        };

        // ton / m^3
        this.simulationInfo = {
            canvas: null,
            gl: null,
            extensionBuffers: null,
            waterUint8Array: null,
            fluxUint8Array: null,
            totalWater: 0,
        };
    }

    initWebGL() {
        let canvas = this.simulationInfo.canvas;
        if (!canvas) {
            canvas = document.createElement("canvas",
                {preserveDrawingBuffer: true});
            canvas.width = this.options.gridSize;
            canvas.height = this.options.gridSize;
            this.simulationInfo.canvas = canvas;
        }

        let gl = this.simulationInfo.gl;
        if (gl) {
            return gl;
        }

        try {
            gl = canvas.getContext("webgl") ||
                canvas.getContext("experimental-webgl");
            const supportEXT = gl.getSupportedExtensions().
                indexOf("WEBGL_draw_buffers");
            if (supportEXT > -1) {
                this.simulationInfo.extensionBuffers = gl.getExtension(
                    "WEBGL_draw_buffers");
            }
        } catch (e) {
            console.error(e);
        }

        this.simulationInfo.gl = gl;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        return this.simulationInfo.gl;
    }

    calcTotalWater() {
        const gridSize = this.options.gridSize;
        const waterUint8Array = this.simulationInfo.waterUint8Array;
        let totalWater = 0;
        const loop = gridSize * gridSize * 4;
        for (let i = 0; i < loop; i += 4) {
            const r = waterUint8Array[i] / 255;
            const g = waterUint8Array[i + 1] / 255;
            const b = waterUint8Array[i + 2] / 255;
            const a = waterUint8Array[i + 3] / 255;
            const waterArray = [r, g, b, a];
            totalWater += unpack(waterArray) * this.options.maxHeight *
                (this.options.cellSize * this.options.cellSize);
        }

        this.simulationInfo.totalWater = Math.round(totalWater);
        return totalWater;
    }

    flipImageDataHorizontally(imageData) {
        const {width, height, data} = imageData;
        const halfWidth = width / 2;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < halfWidth; x++) {
                const leftIndex = (y * width + x) * 4;
                const rightIndex = (y * width + (width - x - 1)) * 4;

                // RGBA 값 교환
                for (let i = 0; i < 4; i++) {
                    [data[leftIndex + i], data[rightIndex + i]] = [
                        data[rightIndex + i],
                        data[leftIndex + i]];
                }
            }
        }
    }

    flipImageDataVertically(imageData) {
        const {width, height, data} = imageData;
        const halfHeight = height / 2;
        for (let y = 0; y < halfHeight; y++) {
            for (let x = 0; x < width; x++) {
                const topIndex = (y * width + x) * 4;
                const bottomIndex = ((height - y - 1) * width + x) * 4;

                // RGBA 값 교환
                for (let i = 0; i < 4; i++) {
                    [data[topIndex + i], data[bottomIndex + i]] = [
                        data[bottomIndex + i],
                        data[topIndex + i]];
                }
            }
        }
    }

    saveUint8ArrayAsPNG(
        zip, uint8Array, width, height, fileName = "output.bmp") {
        /* const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", {willReadFrequently: true});

        //const clampedArray = new Uint8Array(uint8Array);


        const imageData = ctx.createImageData(width, height);

        // WebGL은 좌표계가 (0,0)이 왼쪽 아래라서 뒤집어줘야 함
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const webGLIndex = ((height - y - 1) * width + x) * 4;
                const canvasIndex = (y * width + x) * 4;

                imageData.data[canvasIndex] = uint8Array[webGLIndex];     // R
                imageData.data[canvasIndex + 1] = uint8Array[webGLIndex + 1]; // G
                imageData.data[canvasIndex + 2] = uint8Array[webGLIndex + 2]; // B
                imageData.data[canvasIndex + 3] = uint8Array[webGLIndex + 3]; // A
            }
        }

        //const imageData = new ImageData(uint8Array, width, height);
        //this.flipImageDataVertically(imageData);

        ctx.putImageData(imageData, 0, 0);*/

        // console.log(uint8Array)

        console.log("save..");

        const blob = new Blob([uint8Array], {type: "application/octet-stream"});
        zip.file(fileName, blob);

        /* await canvas.toBlob((blob) => {
            if (blob) {
                zip.file(fileName, blob);
            }
        }, "image/bmp");*/
    }

    async calculateSimulation() {
        // const canvas = document.getElementById("webgl-canvas");
        const gl = this.initWebGL();
        if (gl) {
            this.initTexture();

            if (!this.simulationInfo.waterUint8Array) {
                const gridSize = this.options.gridSize;
                this.simulationInfo.waterUint8Array = new Uint8Array(
                    gridSize * gridSize * 4);
            }

            if (!this.simulationInfo.fluxUint8Array) {
                const gridSize = this.options.gridSize;
                this.simulationInfo.fluxUint8Array = new Uint8Array(
                    gridSize * gridSize * 4);
            }

            const fluxShaderProgram = await this.getFluxShaderProgram();
            this.initFluxFramebuffer();
            this.renderFluxFramebuffer(fluxShaderProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            const waterShaderProgram = await this.getWaterShaderProgram();
            this.initWaterFramebuffer();
            this.renderWaterFramebuffer(waterShaderProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            const waterHeightShaderProgram = await this.initWaterHeightShaderProgram();
            this.initWaterHeightFramebuffer();
            this.renderWaterHeightFramebuffer(waterHeightShaderProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            // const particlesShaderProgram = await initParticleShaderProgram();
            // renderParticles(particlesShaderProgram);
            // GL.bindFramebuffer(GL.FRAMEBUFFER, null);

            // this.calcTotalWater();

            return this.simulationInfo.waterUint8Array;
        }
        return null;
    }

    compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(
                "Shader compile error: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    async initFluxShaderProgram() {

        const commonVertexShaderSource = await this.shaderLoader.getShaderSource(
            "common-vertex-shader.vert");
        const fluxFragmentShaderSource = await this.shaderLoader.getShaderSource(
            "flux-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource,
            gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, fluxFragmentShaderSource,
            gl.FRAGMENT_SHADER);
        this.fluxShaderInfo.vertexShader = vertexShader;
        this.fluxShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.fluxShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error(
                "Shader program link error: " +
                gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initWaterShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource(
            "common-vertex-shader.vert");
        const velocityFragmentShaderSource = await this.shaderLoader.getShaderSource(
            "velocity-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource,
            gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl,
            velocityFragmentShaderSource,
            gl.FRAGMENT_SHADER);
        this.waterVelocityShaderInfo.vertexShader = vertexShader;
        this.waterVelocityShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.waterVelocityShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error(
                "Shader program link error: " +
                gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initWaterHeightShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource(
            "common-vertex-shader.vert");
        const waterHeightFragmentShaderSource = await this.shaderLoader.getShaderSource(
            "water-height-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource,
            gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl,
            waterHeightFragmentShaderSource, gl.FRAGMENT_SHADER);
        this.waterHeightShaderInfo.vertexShader = vertexShader;
        this.waterHeightShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.waterHeightShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error(
                "Shader program link error: " +
                gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initParticleShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource(
            "common-vertex-shader.vert");
        const particlesFragmentShaderSource = await this.shaderLoader.getShaderSource(
            "particles-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource,
            gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl,
            particlesFragmentShaderSource,
            gl.FRAGMENT_SHADER);
        this.particlesShaderInfo.vertexShader = vertexShader;
        this.particlesShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.particlesShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error(
                "Shader program link error: " +
                gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    resetWaterTexture() {
        const gl = this.simulationInfo.gl;
        const waterTexture = this.fluxShaderInfo.waterTexture;
        if (waterTexture) {
            gl.bindTexture(gl.TEXTURE_2D, waterTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    }

    initTexture() {
        const gl = this.simulationInfo.gl;
        const fluxShaderInfo = this.fluxShaderInfo;

        let waterTexture = this.fluxShaderInfo.waterTexture;
        if (!waterTexture) {
            waterTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, waterTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE);
            fluxShaderInfo.waterTexture = waterTexture;
        }

        let sourceTexture = fluxShaderInfo.sourceTexture;
        if (!sourceTexture) {
            sourceTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE);
            fluxShaderInfo.sourceTexture = sourceTexture;
        } else {
            const pixel = new Uint8Array(
                this.options.gridSize * this.options.gridSize * 4);
            // const rainAmount = this.options.rainAmount / (this.options.cellSize * this.options.cellSize);
            const gridArea = this.options.gridSize * this.options.gridSize;

            const rainLoop = gridArea / 100 * this.options.rainAmount;

            const precipitation = this.options.rainMaxPrecipitation;
            const rainMaxPrecipitation = precipitation;
            for (let i = 0; i < rainLoop; i++) {
                let randomGridIndex = Math.floor(
                    Math.random() * this.options.gridSize *
                    this.options.gridSize);
                randomGridIndex = randomGridIndex * 4;

                const random = Math.random() * rainMaxPrecipitation;
                const packValue = pack(random / this.options.maxHeight);
                pixel[randomGridIndex] = packValue[0] * 255;
                pixel[randomGridIndex + 1] = packValue[1] * 255;
                pixel[randomGridIndex + 2] = packValue[2] * 255;
                pixel[randomGridIndex + 3] = packValue[3] * 255;
            }

            const sampleHeight = this.options.waterSourceAmount /
                (this.options.cellSize * this.options.cellSize);
            const values = pack(sampleHeight / this.options.maxHeight);

            /* water source */
            const area = this.options.waterSourceArea;
            const cellPositions = this.options.waterSourcePositions;
            for (const cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            const cellIndex = cellPosition + (i * 4) +
                                (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }

        let minusSourceTexture = fluxShaderInfo.minusSourceTexture;
        if (!minusSourceTexture) {
            minusSourceTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, minusSourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE);
            fluxShaderInfo.minusSourceTexture = minusSourceTexture;
        } else {
            const pixel = new Uint8Array(
                this.options.gridSize * this.options.gridSize * 4);
            const sampleHeight = this.options.waterMinusSourceAmount /
                (this.options.cellSize * this.options.cellSize);
            const values = pack(sampleHeight / this.options.maxHeight);

            /* water minus source */
            const area = this.options.waterMinusSourceArea;
            const cellPositions = this.options.waterMinusSourcePositions;
            for (const cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            const cellIndex = cellPosition + (i * 4) +
                                (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, minusSourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }

        let seaWallTexture = fluxShaderInfo.seaWallTexture;
        if (!seaWallTexture) {
            seaWallTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, seaWallTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE);
            fluxShaderInfo.seaWallTexture = seaWallTexture;
        } else {
            const pixel = new Uint8Array(
                this.options.gridSize * this.options.gridSize * 4);
            const sampleHeight = this.options.waterSeawallHeight;
            const values = pack(sampleHeight / this.options.maxHeight);

            /* water minus source */
            const area = this.options.waterSeawallArea;
            const cellPositions = this.options.waterSeawallPositions;
            for (const cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            const cellIndex = cellPosition + (i * 4) +
                                (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, seaWallTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }

        let terrainTexture = fluxShaderInfo.terrainTexture;
        if (!terrainTexture) {
            terrainTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
                this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE);
            fluxShaderInfo.terrainTexture = terrainTexture;
        }
    }

    setTerrainTexture(typedArray) {
        const gl = this.simulationInfo.gl;
        const terrainTexture = this.fluxShaderInfo.terrainTexture;
        gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, typedArray);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    initFluxFramebuffer() {
        const gl = this.simulationInfo.gl;
        const extensionBuffers = this.simulationInfo.extensionBuffers;
        const fluxShaderInfo = this.fluxShaderInfo;

        let framebuffer = this.fluxShaderInfo.framebuffer;
        if (!framebuffer) {
            framebuffer = gl.createFramebuffer();
            this.fluxShaderInfo.framebuffer = framebuffer;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // 텍스처를 프레임버퍼의 색상 버퍼에 연결
        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);

        const waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,
            waterOutputTexture, 0);
        fluxShaderInfo.waterOutputTexture = waterOutputTexture;

        const fluxUpOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxUpOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,
            fluxUpOutputTexture, 0);
        fluxShaderInfo.fluxUpOutputTexture = fluxUpOutputTexture;

        const fluxDownOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxDownOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D,
            fluxDownOutputTexture, 0);
        fluxShaderInfo.fluxDownOutputTexture = fluxDownOutputTexture;

        const fluxLeftOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxLeftOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D,
            fluxLeftOutputTexture, 0);
        fluxShaderInfo.fluxLeftOutputTexture = fluxLeftOutputTexture;

        const fluxRightOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxRightOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D,
            fluxRightOutputTexture, 0);
        fluxShaderInfo.fluxRightOutputTexture = fluxRightOutputTexture;

        extensionBuffers.drawBuffersWEBGL([
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL,
            extensionBuffers.COLOR_ATTACHMENT1_WEBGL,
            extensionBuffers.COLOR_ATTACHMENT2_WEBGL,
            extensionBuffers.COLOR_ATTACHMENT3_WEBGL,
            extensionBuffers.COLOR_ATTACHMENT4_WEBGL,
        ]);

        const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("프레임버퍼 설정이 올바르지 않습니다:", framebufferStatus);
        }
    }

    initWaterFramebuffer() {
        const gl = this.simulationInfo.gl;
        const extensionBuffers = this.simulationInfo.extensionBuffers;
        const waterVelocityShaderInfo = this.waterVelocityShaderInfo;

        let framebuffer = this.waterVelocityShaderInfo.framebuffer;
        if (!framebuffer) {
            framebuffer = gl.createFramebuffer();
            this.waterVelocityShaderInfo.framebuffer = framebuffer;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);

        const velocityOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, velocityOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,
            velocityOutputTexture, 0);
        waterVelocityShaderInfo.velocityOutputTexture = velocityOutputTexture;

        const waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D,
            waterOutputTexture, 0);
        waterVelocityShaderInfo.waterOutputTexture = waterOutputTexture;

        extensionBuffers.drawBuffersWEBGL([
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL,
            extensionBuffers.COLOR_ATTACHMENT1_WEBGL,
        ]);

        const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("프레임버퍼 설정이 올바르지 않습니다:", framebufferStatus);
        }
    }

    initWaterHeightFramebuffer() {
        const gl = this.simulationInfo.gl;
        const extensionBuffers = this.simulationInfo.extensionBuffers;

        let framebuffer = this.waterHeightShaderInfo.framebuffer;
        if (!framebuffer) {
            framebuffer = gl.createFramebuffer();
            this.waterHeightShaderInfo.framebuffer = framebuffer;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);

        const waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize,
            this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D,
            waterOutputTexture, 0);
        this.waterHeightShaderInfo.waterOutputTexture = waterOutputTexture;

        extensionBuffers.drawBuffersWEBGL([
            extensionBuffers.COLOR_ATTACHMENT0_WEBGL,
        ]);

        const framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (framebufferStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("프레임버퍼 설정이 올바르지 않습니다:", framebufferStatus);
        }
    }

    renderFluxFramebuffer(shaderProgram) {
        const gl = this.simulationInfo.gl;
        const fluxShaderInfo = this.fluxShaderInfo;

        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);
        gl.useProgram(shaderProgram);

        const vertices = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0,
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCellSize",
            this.options.cellSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGridSize",
            this.options.gridSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxHeight",
            this.options.maxHeight);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxFlux",
            this.options.maxFlux);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGravity",
            this.options.gravity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uWaterDensity",
            this.options.waterDensity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uTimeStep",
            this.options.timeStep / Math.sqrt(this.options.cellSize));
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCushionFactor",
            this.options.cushionFactor);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uEvaporationRate",
            this.options.evaporationRate);
        this.shaderLoader.addIntegerUniform(gl, shaderProgram,
            "uSimulationConfine",
            this.options.simulationConfine);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture",
            fluxShaderInfo.waterTexture, 0);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uSourceTexture",
            fluxShaderInfo.sourceTexture, 1);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uTerrainTexture",
            fluxShaderInfo.terrainTexture, 2);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxUpTexture",
            fluxShaderInfo.fluxUpTexture, 3);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxDownTexture",
            fluxShaderInfo.fluxDownTexture, 4);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxLeftTexture",
            fluxShaderInfo.fluxLeftTexture, 5);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxRightTexture",
            fluxShaderInfo.fluxRightTexture, 6);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uMinusSourceTexture", fluxShaderInfo.minusSourceTexture, 7);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uSeaWallTexture",
            fluxShaderInfo.seaWallTexture, 8);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        fluxShaderInfo.waterTexture = fluxShaderInfo.waterOutputTexture;
        fluxShaderInfo.fluxUpTexture = fluxShaderInfo.fluxUpOutputTexture;
        fluxShaderInfo.fluxDownTexture = fluxShaderInfo.fluxDownOutputTexture;
        fluxShaderInfo.fluxLeftTexture = fluxShaderInfo.fluxLeftOutputTexture;
        fluxShaderInfo.fluxRightTexture = fluxShaderInfo.fluxRightOutputTexture;
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    renderWaterFramebuffer(shaderProgram) {
        const gl = this.simulationInfo.gl;
        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);
        gl.useProgram(shaderProgram);

        const fluxShaderInfo = this.fluxShaderInfo;
        const waterVelocityShaderInfo = this.waterVelocityShaderInfo;

        const vertices = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCellSize",
            this.options.cellSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGridSize",
            this.options.gridSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxHeight",
            this.options.maxHeight);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxFlux",
            this.options.maxFlux);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGravity",
            this.options.gravity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uWaterDensity",
            this.options.waterDensity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uTimeStep",
            this.options.timeStep / Math.sqrt(this.options.cellSize));
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCushionFactor",
            this.options.cushionFactor);
        this.shaderLoader.addIntegerUniform(gl, shaderProgram,
            "uSimulationConfine",
            this.options.simulationConfine);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture",
            fluxShaderInfo.waterTexture, 0);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxUpTexture",
            fluxShaderInfo.fluxUpTexture, 1);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxDownTexture",
            fluxShaderInfo.fluxDownTexture, 2);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxLeftTexture",
            fluxShaderInfo.fluxLeftTexture, 3);
        this.shaderLoader.addTextureUniform(gl, shaderProgram,
            "uFluxRightTexture",
            fluxShaderInfo.fluxRightTexture, 4);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        fluxShaderInfo.waterTexture = waterVelocityShaderInfo.waterOutputTexture;
        this.setFluxTexture();
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    renderWaterHeightFramebuffer(shaderProgram) {
        const gl = this.simulationInfo.gl;
        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);
        gl.useProgram(shaderProgram);

        const waterVelocityShaderInfo = this.waterVelocityShaderInfo;
        const fluxShaderInfo = this.fluxShaderInfo;

        const vertices = new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        ]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture",
            waterVelocityShaderInfo.waterOutputTexture, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        fluxShaderInfo.waterTexture = waterVelocityShaderInfo.waterOutputTexture;

        this.setWaterTexture();
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setFluxTexture() {
        const gl = this.simulationInfo.gl;
        const width = this.options.gridSize;
        const height = this.options.gridSize;
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        this.simulationInfo.fluxUint8Array = pixels;
    }

    setWaterTexture() {
        const gl = this.simulationInfo.gl;
        const width = this.options.gridSize;
        const height = this.options.gridSize;
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        this.simulationInfo.waterUint8Array = pixels;
    }

    async getFluxShaderProgram() {
        if (!this.fluxShaderInfo.shaderProgram) {
            return await this.initFluxShaderProgram();
        }
        return this.fluxShaderInfo.shaderProgram;
    }

    async getWaterShaderProgram() {
        if (!this.waterVelocityShaderInfo.shaderProgram) {
            return await this.initWaterShaderProgram();
        }
        return this.waterVelocityShaderInfo.shaderProgram;
    }
}