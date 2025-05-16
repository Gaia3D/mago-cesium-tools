/**
 * ShaderLoader class
 * @ignore
 * @class
 * @example
 * const shaderLoader = new ShaderLoader("/src/shaders");
 * await shaderLoader.getShaderSource("depth-fragment-shader.frag");
 */
export class ShaderLoader {
    /**
     * Constructor for ShaderLoader class
     * @param parentPath
     */
    constructor(parentPath: any);
    parentPath: any;
    shaderMap: Map<any, any>;
    /**
     * Fetches the shader source from the given url
     * @param url
     * @returns {Promise<string|void|any>}
     */
    getShaderSource(url: any): Promise<string | void | any>;
    /**
     * Compiles the shader source
     * @param gl
     * @param program
     * @param name
     * @param value integer value
     * @returns {WebGLShader}
     */
    addIntegerUniform(gl: any, program: any, name: any, value: any): WebGLShader;
    /**
     * Adds integer uniform
     * @param gl
     * @param program
     * @param name
     * @param value float value
     */
    addFloatUniform(gl: any, program: any, name: any, value: any): void;
    /**
     * Adds vec2 uniform
     * @param gl
     * @param program
     * @param name
     * @param value vec2 value
     */
    addVec2Uniform(gl: any, program: any, name: any, value: any): void;
    /**
     * Adds texture uniform
     * @param gl
     * @param program
     * @param name
     * @param texture
     * @param index texture index
     */
    addTextureUniform(gl: any, program: any, name: any, texture: any, index: any): void;
}
