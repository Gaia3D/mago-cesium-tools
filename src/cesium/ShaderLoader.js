const customVertexShaders = import.meta.glob('/src/customShaders/*.vert', { as: 'raw' });
const customFragmentShaders = import.meta.glob('/src/customShaders/*.frag', { as: 'raw' });
const vertexShaders =  import.meta.glob('/src/shaders/*.vert', { as: 'raw' });
const fragmentShaders = import.meta.glob('/src/shaders/*.frag', { as: 'raw' });

/**
 * ShaderLoader class
 */
export class ShaderLoader {
    /**
     * Constructor for ShaderLoader class
     * @param parentPath
     */
    constructor(parentPath) {
        this.parentPath = parentPath;
        this.shaderMap = new Map();
    }

    /**
     * Fetches the shader source from the given url
     * @param url
     * @returns {Promise<string|void|any>}
     */
    /*async getShaderSource(url) {
        if (this.shaderMap.has(url)) {
            return await this.shaderMap.get(url);
        }

        const fullUrl = this.parentPath + "/" + url;
        let shader = await fetch(fullUrl)
            .then(response => response.text())
            .catch(error => console.error(error));

        this.shaderMap.set(url, shader);
        return shader;
    }*/
    async getShaderSource(url) {
        if (this.shaderMap.has(url)) {
            return await this.shaderMap.get(url);
        }

        let fullUrl = this.parentPath + "/" + url;
        let shaderImport;
        if (customVertexShaders[fullUrl]) {
            shaderImport = await customVertexShaders[fullUrl]();
        } else if (customFragmentShaders[fullUrl]) {
            shaderImport = await customFragmentShaders[fullUrl]();
        } else if (vertexShaders[fullUrl]) {
            shaderImport = await vertexShaders[fullUrl]();
        } else if (fragmentShaders[fullUrl]) {
            shaderImport = await fragmentShaders[fullUrl]();
        } else {
            throw new Error(`Shader file ${fullUrl} not found`);
        }
        this.shaderMap.set(url, shaderImport);
        return shaderImport;
    }

    /**
     * Compiles the shader source
     * @param gl
     * @param program
     * @param name
     * @param value integer value
     * @returns {WebGLShader}
     */
    addIntegerUniform(gl, program, name, value) {
        const location = gl.getUniformLocation(program, name);
        gl.uniform1i(location, value);
    }

    /**
     * Adds integer uniform
     * @param gl
     * @param program
     * @param name
     * @param value float value
     */
     addFloatUniform(gl, program, name, value){
        const location = gl.getUniformLocation(program, name);
        gl.uniform1f(location, value);
    }

    /**
     * Adds vec2 uniform
     * @param gl
     * @param program
     * @param name
     * @param value vec2 value
     */
    addVec2Uniform(gl, program, name, value) {
        const location = gl.getUniformLocation(program, name);
        gl.uniform2fv(location, value);
    }

    /**
     * Adds texture uniform
     * @param gl
     * @param program
     * @param name
     * @param texture
     * @param index texture index
     */
    addTextureUniform(gl, program, name, texture, index) {
        const location = gl.getUniformLocation(program, name);
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(location, index);
    }
}
