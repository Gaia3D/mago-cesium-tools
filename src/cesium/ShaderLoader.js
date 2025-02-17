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
    async getShaderSource(url) {
        if (this.shaderMap.has(url)) {
            return await this.shaderMap.get(url);
        }

        const fullUrl = this.parentPath + "/" + url;
        let shader = await fetch(fullUrl)
            .then(response => response.text())
            .catch(error => console.error(error));

        this.shaderMap.set(url, shader);
        return shader;
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
