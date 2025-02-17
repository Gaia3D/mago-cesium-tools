#extension GL_EXT_draw_buffers : require

precision highp float;

uniform sampler2D uWaterTexture;
uniform sampler2D uSourceTexture;
uniform sampler2D uTerrainTexture;
uniform sampler2D uFluxUpTexture;
uniform sampler2D uFluxDownTexture;
uniform sampler2D uFluxLeftTexture;
uniform sampler2D uFluxRightTexture;

uniform float uGridSize;
uniform float uMaxHeight;
uniform float uMaxFlux;
uniform float uCellSize;

uniform float uGravity;
uniform float uWaterDensity;
uniform float uTimeStep;
uniform float uCushionFactor;

uniform bool uSimulationConfine;

varying vec2 vTexCoordinate;

vec4 packDepth(float v) {
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
    return enc;
}

float unpackDepth(const in vec4 rgba_depth) {
    return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
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
    vec2 textureCoordinate = vTexCoordinate;

    float divX = 1.0 / gridSize;
    float divY = 1.0 / gridSize;

    vec2 up = vec2(textureCoordinate.x, textureCoordinate.y + divY);
    vec2 down = vec2(textureCoordinate.x, textureCoordinate.y - divY);
    vec2 left = vec2(textureCoordinate.x - divX, textureCoordinate.y);
    vec2 right = vec2(textureCoordinate.x + divX, textureCoordinate.y);

    vec4 source = texture2D(uSourceTexture, textureCoordinate);

    vec4 water = texture2D(uWaterTexture, textureCoordinate);
    vec4 waterUp = texture2D(uWaterTexture, up);
    vec4 waterDown = texture2D(uWaterTexture, down);
    vec4 waterLeft = texture2D(uWaterTexture, left);
    vec4 waterRight = texture2D(uWaterTexture, right);

    vec4 terrain = texture2D(uTerrainTexture, textureCoordinate);
    vec4 terrainUp = texture2D(uTerrainTexture, up);
    vec4 terrainDown = texture2D(uTerrainTexture, down);
    vec4 terrainLeft = texture2D(uTerrainTexture, left);
    vec4 terrainRight = texture2D(uTerrainTexture, right);

    vec4 fluxUp = texture2D(uFluxUpTexture, textureCoordinate);
    vec4 fluxDown = texture2D(uFluxDownTexture, textureCoordinate);
    vec4 fluxLeft = texture2D(uFluxLeftTexture, textureCoordinate);
    vec4 fluxRight = texture2D(uFluxRightTexture, textureCoordinate);

    float sourceValue = unpackDepth(source) * maxHeight;

    float waterValue = unpackDepth(water) * maxHeight;
    float waterUpValue = unpackDepth(waterUp) * maxHeight;
    float waterDownValue = unpackDepth(waterDown) * maxHeight;
    float waterLeftValue = unpackDepth(waterLeft) * maxHeight;
    float waterRightValue = unpackDepth(waterRight) * maxHeight;

    float terrainValue = unpackDepth(terrain) * maxHeight;

    float terrainUpValue = unpackDepth(terrainUp) * maxHeight;
    float terrainDownValue = unpackDepth(terrainDown) * maxHeight;
    float terrainLeftValue = unpackDepth(terrainLeft) * maxHeight;
    float terrainRightValue = unpackDepth(terrainRight) * maxHeight;

    if (uSimulationConfine) {
        if (up.y > 1.0) {
            waterUpValue = 0.0;
            terrainUpValue = 0.0;
        }
        if (down.y < 0.0) {
            waterDownValue = 0.0;
            terrainDownValue = 0.0;
        }
        if (left.x < 0.0) {
            waterLeftValue = 0.0;
            terrainLeftValue = 0.0;
        }
        if (right.x > 1.0) {
            waterRightValue = 0.0;
            terrainRightValue = 0.0;
        }
    }


    if (textureCoordinate.x <= 0.0) {
        terrainLeftValue = maxHeight;
    }
    if (textureCoordinate.x >= 1.0) {
        terrainRightValue = maxHeight;
    }
    if (textureCoordinate.y <= 0.0) {
        terrainDownValue = maxHeight;
    }
    if (textureCoordinate.y >= 1.0) {
        terrainUpValue = maxHeight;
    }

    float fluxUpValue = unpackDepth(fluxUp) * maxFlux;
    float fluxDownValue = unpackDepth(fluxDown) * maxFlux;
    float fluxLeftValue = unpackDepth(fluxLeft) * maxFlux;
    float fluxRightValue = unpackDepth(fluxRight) * maxFlux;

    float totalHeight = waterValue + terrainValue;
    float totalHeightUp = waterUpValue + terrainUpValue;
    float totalHeightDown = waterDownValue + terrainDownValue;
    float totalHeightLeft = waterLeftValue + terrainLeftValue;
    float totalHeightRight = waterRightValue + terrainRightValue;

    float slopeUp = totalHeight - totalHeightUp;
    float slopeDown = totalHeight - totalHeightDown;
    float slopeLeft = totalHeight - totalHeightLeft;
    float slopeRight = totalHeight - totalHeightRight;

    float deltaUp = waterDensity * gravity * slopeUp;
    float deltaDown =  waterDensity * gravity * slopeDown;
    float deltaLeft = waterDensity * gravity * slopeLeft;
    float deltaRight = waterDensity * gravity * slopeRight;

    float accelUp = deltaUp / (waterDensity * cellSize);
    float accelDown = deltaDown / (waterDensity * cellSize);
    float accelLeft = deltaLeft / (waterDensity * cellSize);
    float accelRight = deltaRight / (waterDensity * cellSize);

    float newFluxUpValue = (timeStep * accelUp * cellArea);
    float newFluxDownValue = (timeStep * accelDown * cellArea);
    float newFluxLeftValue = (timeStep * accelLeft * cellArea);
    float newFluxRightValue = (timeStep * accelRight * cellArea);

    float outFluxUp = (fluxUpValue + newFluxUpValue) * cushionFactor;
    float outFluxDown = (fluxDownValue + newFluxDownValue) * cushionFactor;
    float outFluxLeft = (fluxLeftValue + newFluxLeftValue) * cushionFactor;
    float outFluxRight = (fluxRightValue + newFluxRightValue) * cushionFactor;

    if (outFluxUp < 0.0) {
        outFluxUp = 0.0;
    }
    if (outFluxDown < 0.0) {
        outFluxDown = 0.0;
    }
    if (outFluxLeft < 0.0) {
        outFluxLeft = 0.0;
    }
    if (outFluxRight < 0.0) {
        outFluxRight = 0.0;
    }

    float vOut = timeStep * (outFluxUp + outFluxDown + outFluxLeft + outFluxRight);
    float currWaterVol = waterValue * cellArea;
    if (vOut > currWaterVol) {
        float factor = currWaterVol / vOut;
        outFluxUp = outFluxUp * factor;
        outFluxDown = outFluxDown * factor;
        outFluxLeft = outFluxLeft * factor;
        outFluxRight = outFluxRight * factor;
    }

    //sourceValue = 1.0 / maxHeight / 60.0;
    waterValue = waterValue + sourceValue;

    // fragColor
    gl_FragData[0] = packDepth(waterValue / maxHeight);
    gl_FragData[1] = packDepth(outFluxUp / maxFlux);
    gl_FragData[2] = packDepth(outFluxDown / maxFlux);
    gl_FragData[3] = packDepth(outFluxLeft / maxFlux);
    gl_FragData[4] = packDepth(outFluxRight / maxFlux);
}