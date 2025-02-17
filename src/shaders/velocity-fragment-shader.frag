#extension GL_EXT_draw_buffers : require

precision highp float;

uniform sampler2D uWaterTexture;
uniform sampler2D uFluxUpTexture;
uniform sampler2D uFluxDownTexture;
uniform sampler2D uFluxLeftTexture;
uniform sampler2D uFluxRightTexture;

varying vec2 vTexCoordinate;

uniform float uGridSize;
uniform float uMaxHeight;
uniform float uMaxFlux;
uniform float uCellSize;

uniform float uGravity;
uniform float uWaterDensity;
uniform float uTimeStep;
uniform float uCushionFactor;

uniform bool uWaterSkirt;

vec2 encodeVelocity(in vec2 vel) {
    return vel * 0.5 + 0.5;
}

vec2 decodeVelocity(in vec2 encodedVel) {
    return vec2(encodedVel.xy * 2.0 - 1.0);
}

vec4 packDepth(float v) {
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
    return enc;
}

float unpackDepth(const in vec4 rgba_depth) {
    return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

vec2 clampTexcoord(in vec2 texCoord) {
    vec2 texCoordUp = vec2(texCoord.x, texCoord.y);
    if (texCoordUp.x < 0.0) {
        texCoordUp.x = 0.0;
    } else if (texCoordUp.x > 1.0) {
        texCoordUp.x = 1.0;
    }
    return texCoordUp;
}

void main() {
    float cellSize = uCellSize;
    float gridSize = uGridSize;
    float maxHeight = uMaxHeight;
    float maxFlux = uMaxFlux;

    float gravity = uGravity;
    float waterDensity = uWaterDensity;
    float timeStep = uTimeStep;
    float cushionFactor = uCushionFactor;

    float cellArea = cellSize * cellSize;
    float timeStepPerCellArea = timeStep / cellArea;

    vec2 textureCoordinate = vTexCoordinate;

    float divX = 1.0 / gridSize;
    float divY = 1.0 / gridSize;

    vec2 up = vec2(textureCoordinate.x, textureCoordinate.y + divY);
    vec2 down = vec2(textureCoordinate.x, textureCoordinate.y - divY);
    vec2 left = vec2(textureCoordinate.x - divX, textureCoordinate.y);
    vec2 right = vec2(textureCoordinate.x + divX, textureCoordinate.y);
    vec4 water = texture2D(uWaterTexture, textureCoordinate);

    vec4 fluxUp = texture2D(uFluxUpTexture, textureCoordinate);
    vec4 fluxDown = texture2D(uFluxDownTexture, textureCoordinate);
    vec4 fluxLeft = texture2D(uFluxLeftTexture, textureCoordinate);
    vec4 fluxRight = texture2D(uFluxRightTexture, textureCoordinate);

    vec4 fluxFromUp = texture2D(uFluxDownTexture, up);
    vec4 fluxFromDown = texture2D(uFluxUpTexture, down);
    vec4 fluxFromLeft = texture2D(uFluxRightTexture, left);
    vec4 fluxFromRight = texture2D(uFluxLeftTexture, right);

    float waterValue = unpackDepth(water) * maxHeight;

    // out Flux
    float fluxUpValue = unpackDepth(fluxUp) * maxFlux;
    float fluxDownValue = unpackDepth(fluxDown) * maxFlux;
    float fluxLeftValue = unpackDepth(fluxLeft) * maxFlux;
    float fluxRightValue = unpackDepth(fluxRight) * maxFlux;

    // in Flux
    float fluxFromUpValue = unpackDepth(fluxFromUp) * maxFlux;
    if (up.y > 1.0) {
        fluxFromUpValue = 0.0;
    }

    float fluxFromDownValue = unpackDepth(fluxFromDown) * maxFlux;
    if (down.y < 0.0) {
        fluxFromDownValue = 0.0;
    }

    float fluxFromLeftValue = unpackDepth(fluxFromLeft) * maxFlux;
    if (left.x < 0.0) {
        fluxFromLeftValue = 0.0;
    }

    float fluxFromRightValue = unpackDepth(fluxFromRight) * maxFlux;
    if (right.x > 1.0) {
        fluxFromRightValue = 0.0;
    }

    int fragX = int(textureCoordinate.x * gridSize);
    int fragY = int(textureCoordinate.y * gridSize);


    fluxFromUpValue = fluxFromUpValue * timeStepPerCellArea;
    fluxFromDownValue = fluxFromDownValue * timeStepPerCellArea;
    fluxFromLeftValue = fluxFromLeftValue * timeStepPerCellArea;
    fluxFromRightValue = fluxFromRightValue * timeStepPerCellArea;

    float totalFluxOut = (fluxUpValue + fluxDownValue + fluxLeftValue + fluxRightValue) * timeStepPerCellArea;
    float totalFluxIn = fluxFromUpValue + fluxFromDownValue + fluxFromLeftValue + fluxFromRightValue;
    float deltaWaterHeight = totalFluxIn - totalFluxOut;

    float waterResultHeight = waterValue + deltaWaterHeight;
    if (waterResultHeight < 0.0) {
        waterResultHeight = 0.0;
    }

    vec2 velocity = vec2((fluxRightValue - fluxFromRightValue) + (fluxFromLeftValue - fluxLeftValue), (fluxUpValue - fluxFromUpValue) + (fluxFromDownValue - fluxDownValue)) / 2.0;

    float da = (waterValue + waterValue + deltaWaterHeight) / 2.0;
    if(da <= 1e-8) {
        velocity = vec2(0.0);
    } else {
        velocity = velocity / (da * vec2(cellSize, cellSize));
    }

    vec2 encodedVelocity = encodeVelocity(velocity / 25.0);
    vec4 velocityResult = vec4(encodedVelocity, 0.0, 1.0);
    vec4 waterResult = packDepth(waterResultHeight / maxHeight);

    gl_FragData[0] = velocityResult;
    gl_FragData[1] = waterResult;
}