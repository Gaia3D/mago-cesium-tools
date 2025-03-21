#extension GL_EXT_draw_buffers : require

precision highp float;
uniform sampler2D uWaterTexture;
varying vec2 vTexCoordinate;

void main() {
    vec4 water = texture2D(uWaterTexture, vTexCoordinate);
    gl_FragData[0] = water;
}