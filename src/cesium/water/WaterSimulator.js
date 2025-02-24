import {ShaderLoader} from "../ShaderLoader.js";

export class WaterSimulator {
    constructor(options) {
        this.shaderLoader = new ShaderLoader("/src/shaders");
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
        }
        this.waterVelocityShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            waterOutputTexture: null,
            velocityOutputTexture: null,
        }
        this.waterHeightShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            waterOutputTexture: null,
        }
        this.particlesShaderInfo = {
            shaderProgram: null,
            vertexShader: null,
            fragmentShader: null,
            framebuffer: null,
            particlesPositionTexture: null,
            particlesPositionOutputTexture: null,
            particleTexture: null,
        }
        this.simulationInfo = {
            canvas: null,
            gl: null,
            extensionBuffers: null,
            waterUint8Array: null,
            fluxUint8Array: null,
            totalWater: 0, // ton / m^3
        }
    }

    initWebGL() {
        let canvas = this.simulationInfo.canvas;
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.width = this.options.gridSize;
            canvas.height = this.options.gridSize;
            this.simulationInfo.canvas = canvas;
        }

        let gl = this.simulationInfo.gl;
        if (gl) {
            return gl;
        }

        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            let supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
            if (supportEXT > -1) {
                this.simulationInfo.extensionBuffers = gl.getExtension("WEBGL_draw_buffers");
            }
        } catch (e) {
            console.error(e);
        }

        this.simulationInfo.gl = gl;
        return this.simulationInfo.gl;
    }

    calcTotalWater() {
        let gridSize = this.options.gridSize;
        let waterUint8Array = this.simulationInfo.waterUint8Array;
        let totalWater = 0;
        let loop = gridSize * gridSize * 4;
        for (let i = 0; i < loop; i += 4) {
            let r = waterUint8Array[i] / 255;
            let g = waterUint8Array[i + 1] / 255;
            let b = waterUint8Array[i + 2] / 255;
            let a = waterUint8Array[i + 3] / 255;
            let waterArray = [r, g, b, a];
            totalWater += this.unpack(waterArray) * this.options.maxHeight * (this.options.cellSize * this.options.cellSize);
        }

        this.simulationInfo.totalWater = Math.round(totalWater);
        return totalWater;
    }

    saveUint8ArrayAsPNG(uint8Array, width, height, fileName = "output.png") {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        
        const imageData = new ImageData(new Uint8ClampedArray(uint8Array), width, height);
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }, "image/png");
    }


    async calculateSimulation() {
        //const canvas = document.getElementById("webgl-canvas");
        const gl = this.initWebGL();
        if (gl) {
            this.initTexture();

            if (!this.simulationInfo.waterUint8Array) {
                let gridSize = this.options.gridSize;
                this.simulationInfo.waterUint8Array = new Uint8Array(gridSize * gridSize * 4);
            }

            if (!this.simulationInfo.fluxUint8Array) {
                let gridSize = this.options.gridSize;
                this.simulationInfo.fluxUint8Array = new Uint8Array(gridSize * gridSize * 4);
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

            //const particlesShaderProgram = await initParticleShaderProgram();
            //renderParticles(particlesShaderProgram);
            //GL.bindFramebuffer(GL.FRAMEBUFFER, null);

            this.calcTotalWater();

            return this.simulationInfo.waterUint8Array;
        }
        return null;
    }

    compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    async initFluxShaderProgram() {

        const commonVertexShaderSource = await this.shaderLoader.getShaderSource("common-vertex-shader.vert");
        const fluxFragmentShaderSource = await this.shaderLoader.getShaderSource("flux-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, fluxFragmentShaderSource, gl.FRAGMENT_SHADER);
        this.fluxShaderInfo.vertexShader = vertexShader;
        this.fluxShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.fluxShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Shader program link error: " + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initWaterShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource("common-vertex-shader.vert");
        const velocityFragmentShaderSource = await this.shaderLoader.getShaderSource("velocity-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, velocityFragmentShaderSource, gl.FRAGMENT_SHADER);
        this.waterVelocityShaderInfo.vertexShader = vertexShader;
        this.waterVelocityShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.waterVelocityShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Shader program link error: " + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initWaterHeightShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource("common-vertex-shader.vert");
        const waterHeightFragmentShaderSource = await this.shaderLoader.getShaderSource("water-height-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, waterHeightFragmentShaderSource, gl.FRAGMENT_SHADER);
        this.waterHeightShaderInfo.vertexShader = vertexShader;
        this.waterHeightShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.waterHeightShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Shader program link error: " + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    async initParticleShaderProgram() {
        const commonVertexShaderSource = await this.shaderLoader.getShaderSource("common-vertex-shader.vert");
        const particlesFragmentShaderSource = await this.shaderLoader.getShaderSource("particles-fragment-shader.frag");

        const gl = this.simulationInfo.gl;
        const vertexShader = this.compileShader(gl, commonVertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(gl, particlesFragmentShaderSource, gl.FRAGMENT_SHADER);
        this.particlesShaderInfo.vertexShader = vertexShader;
        this.particlesShaderInfo.fragmentShader = fragmentShader;

        const shaderProgram = gl.createProgram();
        this.particlesShaderInfo.shaderProgram = shaderProgram;

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error("Shader program link error: " + gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    resetWaterTexture() {
        const gl = this.simulationInfo.gl;
        let waterTexture = this.fluxShaderInfo.waterTexture;
        if (waterTexture) {
            gl.bindTexture(gl.TEXTURE_2D, waterTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
    }

    initTexture() {
        const gl = this.simulationInfo.gl;
        const fluxShaderInfo = this.fluxShaderInfo;

        let waterTexture = this.fluxShaderInfo.waterTexture;
        if (!waterTexture) {
            waterTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, waterTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            fluxShaderInfo.waterTexture = waterTexture;
        }

        let sourceTexture = fluxShaderInfo.sourceTexture;
        if (!sourceTexture) {
            sourceTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            fluxShaderInfo.sourceTexture = sourceTexture;
        } else {
            const pixel = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
            //const rainAmount = this.options.rainAmount / (this.options.cellSize * this.options.cellSize);
            const gridArea = this.options.gridSize * this.options.gridSize;

            const rainLoop = gridArea / 100 * this.options.rainAmount;

            const precipitation = this.options.rainMaxPrecipitation;
            const rainMaxPrecipitation = precipitation;
            for (let i = 0; i < rainLoop; i++) {
                let randomGridIndex = Math.floor(Math.random() * this.options.gridSize * this.options.gridSize);
                randomGridIndex = randomGridIndex * 4;

                let random = Math.random() * rainMaxPrecipitation;
                let packValue = this.pack(random / this.options.maxHeight);
                pixel[randomGridIndex] = packValue[0] * 255;
                pixel[randomGridIndex + 1] = packValue[1] * 255;
                pixel[randomGridIndex + 2] = packValue[2] * 255;
                pixel[randomGridIndex + 3] = packValue[3] * 255;
            }

            let sampleHeight = this.options.waterSourceAmount / (this.options.cellSize * this.options.cellSize);
            let values= this.pack(sampleHeight / this.options.maxHeight);

            //let gridSize = this.options.gridSize;
            //let cellPosition = ((gridSize * (gridSize / 2)) + (gridSize / 2)) * 4;

            /* water source */
            /*let area = this.options.waterSourceArea;
            let cellPosition = this.options.waterSourcePosition;
            if (cellPosition >= 0) {
                for (let i = 0; i < area; i++) {
                    for (let j = 0; j < area; j++) {
                        if (cellPosition > pixel.length + 3) {
                            return;
                        }
                        let cellIndex = cellPosition + (i * 4) + (j * 4 * this.options.gridSize);
                        pixel[cellIndex] = values[0] * 255;
                        pixel[cellIndex + 1] = values[1] * 255;
                        pixel[cellIndex + 2] = values[2] * 255;
                        pixel[cellIndex + 3] = values[3] * 255;
                    }
                }
            }*/

            /* water source */
            let area = this.options.waterSourceArea;
            let cellPositions = this.options.waterSourcePositions;
            for (let cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            let cellIndex = cellPosition + (i * 4) + (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }

        let minusSourceTexture = fluxShaderInfo.minusSourceTexture;
        if (!minusSourceTexture) {
            minusSourceTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, minusSourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            fluxShaderInfo.minusSourceTexture = minusSourceTexture;
        } else {
            const pixel = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
            let sampleHeight = this.options.waterMinusSourceAmount / (this.options.cellSize * this.options.cellSize);
            let values= this.pack(sampleHeight / this.options.maxHeight);

            /* water minus source */
            let area = this.options.waterMinusSourceArea;
            let cellPositions = this.options.waterMinusSourcePositions;
            for (let cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            let cellIndex = cellPosition + (i * 4) + (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }


            gl.bindTexture(gl.TEXTURE_2D, minusSourceTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }

        let seaWallTexture = fluxShaderInfo.seaWallTexture;
        if (!seaWallTexture) {
            seaWallTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, seaWallTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            fluxShaderInfo.seaWallTexture = seaWallTexture;
        } else {
            const pixel = new Uint8Array(this.options.gridSize * this.options.gridSize * 4);
            let sampleHeight = this.options.waterSeawallHeight;
            let values= this.pack(sampleHeight / this.options.maxHeight);

            /* water minus source */
            let area = this.options.waterSeawallArea;
            let cellPositions = this.options.waterSeawallPositions;
            for (let cellPosition of cellPositions) {
                if (cellPosition >= 0) {
                    for (let i = -area; i <= area; i++) {
                        for (let j = -area; j <= area; j++) {
                            if (cellPosition > pixel.length + 3) {
                                return;
                            } else if (cellPosition < 0) {
                                return;
                            }
                            let cellIndex = cellPosition + (i * 4) + (j * 4 * this.options.gridSize);
                            pixel[cellIndex] = values[0] * 255;
                            pixel[cellIndex + 1] = values[1] * 255;
                            pixel[cellIndex + 2] = values[2] * 255;
                            pixel[cellIndex + 3] = values[3] * 255;
                        }
                    }
                }
            }

            gl.bindTexture(gl.TEXTURE_2D, seaWallTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        }


        let terrainTexture = fluxShaderInfo.terrainTexture;
        if (!terrainTexture) {
            terrainTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            fluxShaderInfo.terrainTexture = terrainTexture;
        }
    }

    setTerrainTexture(typedArray) {
        const gl = this.simulationInfo.gl;
        let terrainTexture = this.fluxShaderInfo.terrainTexture;
        gl.bindTexture(gl.TEXTURE_2D, terrainTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, typedArray);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    initFluxFramebuffer() {
        const gl = this.simulationInfo.gl;
        const extensionBuffers  = this.simulationInfo.extensionBuffers;
        const fluxShaderInfo = this.fluxShaderInfo;

        let framebuffer = this.fluxShaderInfo.framebuffer;
        if (!framebuffer) {
            framebuffer = gl.createFramebuffer();
            this.fluxShaderInfo.framebuffer = framebuffer;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // 텍스처를 프레임버퍼의 색상 버퍼에 연결
        gl.viewport(0, 0, this.options.gridSize, this.options.gridSize);

        let waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, waterOutputTexture, 0);
        fluxShaderInfo.waterOutputTexture = waterOutputTexture;

        let fluxUpOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxUpOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, fluxUpOutputTexture, 0);
        fluxShaderInfo.fluxUpOutputTexture = fluxUpOutputTexture;

        let fluxDownOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxDownOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, fluxDownOutputTexture, 0);
        fluxShaderInfo.fluxDownOutputTexture = fluxDownOutputTexture;

        let fluxLeftOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxLeftOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, fluxLeftOutputTexture, 0);
        fluxShaderInfo.fluxLeftOutputTexture = fluxLeftOutputTexture;

        let fluxRightOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, fluxRightOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT4_WEBGL, gl.TEXTURE_2D, fluxRightOutputTexture, 0);
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

        let velocityOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, velocityOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, velocityOutputTexture, 0);
        waterVelocityShaderInfo.velocityOutputTexture = velocityOutputTexture;

        let waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, waterOutputTexture, 0);
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

        let waterOutputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, waterOutputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.options.gridSize, this.options.gridSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, extensionBuffers.COLOR_ATTACHMENT0_WEBGL, gl.TEXTURE_2D, waterOutputTexture, 0);
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
            1.0, 1.0
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCellSize", this.options.cellSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGridSize", this.options.gridSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxHeight", this.options.maxHeight);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxFlux", this.options.maxFlux);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGravity", this.options.gravity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uWaterDensity", this.options.waterDensity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uTimeStep", this.options.timeStep / Math.sqrt(this.options.cellSize));
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCushionFactor", this.options.cushionFactor);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uEvaporationRate", this.options.evaporationRate);
        this.shaderLoader.addIntegerUniform(gl, shaderProgram, "uSimulationConfine", this.options.simulationConfine);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture", fluxShaderInfo.waterTexture, 0);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uSourceTexture", fluxShaderInfo.sourceTexture, 1);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uTerrainTexture", fluxShaderInfo.terrainTexture, 2);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxUpTexture", fluxShaderInfo.fluxUpTexture, 3);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxDownTexture", fluxShaderInfo.fluxDownTexture, 4);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxLeftTexture", fluxShaderInfo.fluxLeftTexture, 5);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxRightTexture", fluxShaderInfo.fluxRightTexture, 6);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uMinusSourceTexture", fluxShaderInfo.minusSourceTexture, 7);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uSeaWallTexture", fluxShaderInfo.seaWallTexture, 8);

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
            -1.0,  1.0,
            1.0,  1.0
        ]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCellSize", this.options.cellSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGridSize", this.options.gridSize);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxHeight", this.options.maxHeight);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uMaxFlux", this.options.maxFlux);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uGravity", this.options.gravity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uWaterDensity", this.options.waterDensity);
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uTimeStep", this.options.timeStep / Math.sqrt(this.options.cellSize));
        this.shaderLoader.addFloatUniform(gl, shaderProgram, "uCushionFactor", this.options.cushionFactor);
        this.shaderLoader.addIntegerUniform(gl, shaderProgram, "uSimulationConfine", this.options.simulationConfine);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture", fluxShaderInfo.waterTexture, 0);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxUpTexture", fluxShaderInfo.fluxUpTexture, 1);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxDownTexture", fluxShaderInfo.fluxDownTexture, 2);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxLeftTexture", fluxShaderInfo.fluxLeftTexture, 3);
        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uFluxRightTexture", fluxShaderInfo.fluxRightTexture, 4);

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
            -1.0,  1.0,
            1.0,  1.0
        ]);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        this.shaderLoader.addTextureUniform(gl, shaderProgram, "uWaterTexture", waterVelocityShaderInfo.waterOutputTexture, 0);

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

    pack(value) {
        let bit_shift = [16777216.0, 65536.0, 256.0, 1.0];
        let bit_mask = [0.0, 0.00390625, 0.00390625, 0.00390625];
        let value_A = [
            value * bit_shift[0] * 255.0,
            value * bit_shift[1] * 255.0,
            value * bit_shift[2] * 255.0,
            value * bit_shift[3] * 255.0
        ];
        let value_B = [256.0, 256.0, 256.0, 256.0];

        let resAux = [
            (value_A[0] % value_B[0]) / 255.0,
            (value_A[1] % value_B[1]) / 255.0,
            (value_A[2] % value_B[2]) / 255.0,
            (value_A[3] % value_B[3]) / 255.0
        ];

        let resBitMasked = [
            resAux[0] * bit_mask[0],
            resAux[0] * bit_mask[1],
            resAux[1] * bit_mask[2],
            resAux[2] * bit_mask[3]
        ];

        let res = [
            resAux[0] - resBitMasked[0],
            resAux[1] - resBitMasked[1],
            resAux[2] - resBitMasked[2],
            resAux[3] - resBitMasked[3]
        ];
        return [res[3], res[2], res[1], res[0]];
    }

    unpack = (values) => {
        // dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
        return values[0] + values[1] / 255.0 + values[2] / 65025.0 + values[3] / 16581375.0;
        //return values[0] + values[1] / 256.0 + values[2] / 65536.0 + values[3] / 16777216.0;
    }

    unpackDepth = (values) => {
        const r = values[0];
        const g = values[1];
        const b = values[2];
        const a = values[3];
        return (a + (b * 256.0) + (g * 16777216.0) + (r * 16777216));
    }
}