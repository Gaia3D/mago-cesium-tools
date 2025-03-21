precision highp float;
uniform sampler2D uParticlesTexture;
varying vec2 vTexCoordinate;

void main() {
    float gridSize = 256.0;
    float gridWidth = gridSize;
    float gridHeight = gridSize;

    vec4 particle = texture2D(uParticlesTexture, vTexCoordinate);
    float particleX = particle.r * gridWidth;
    float particleY = particle.g * gridHeight;

    float particleZ = particle.b;
    float particleW = 1.0;

    gl_FragData[0] = water;
}