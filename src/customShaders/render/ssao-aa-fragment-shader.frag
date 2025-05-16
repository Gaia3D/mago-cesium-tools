in vec2 v_textureCoordinates;
uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D magoDepthTextureForSsao;
uniform sampler2D ssaoTexture;
uniform int gridSize;
uniform float threshold;
uniform float intensity;

vec4 getDepth(vec2 screenPos) {
    return texture(magoDepthTextureForSsao, screenPos);
}
vec4 getPositionEC(vec2 screenPos) {
    vec4 rawDepthColor = getDepth(screenPos);
    float depth = czm_unpackDepth(rawDepthColor);
    vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
    return positionEC;
}
float znkimDepth(vec2 screenPos) {
    vec4 positionEC = getPositionEC(screenPos);
    return abs(positionEC.z / positionEC.w);
}
float getMeterDepth(vec2 screenPos) {
    return znkimDepth(screenPos) * czm_depthRange.far;
}

vec4 getSsaoValue(vec2 screenPos) {
    return texture(ssaoTexture, screenPos);
}

vec2 calcScreenPos(vec2 screenPos, vec2 offset) {
    return (gl_FragCoord.xy + offset) / czm_viewport.zw;
}

float getSsao(vec2 screenPos) {
    float result = 0.0;

    vec2 size = 1.0 / czm_viewport.zw;
    float pixelXSize = size.x * 1.0;
    float pixelYSize = size.y * 1.0;
    vec2 pixelSize = vec2(pixelXSize, pixelYSize);

    int loopSize = gridSize;
    int loopHalf = loopSize / 2;

    float centerDepth = getMeterDepth(screenPos);
    int pixelCount = 0;
    for (int x = 0; x < loopSize; x++) {
        int col = x - loopHalf;
        for (int y = 0; y < loopSize; y++) {
            int row = y - loopHalf;
            vec2 localCoord = vec2(float(col), float(row));
            vec2 screenPos = calcScreenPos(screenPos, localCoord);
            float depth = getMeterDepth(screenPos);
            if ((screenPos.x >= 0.0 && screenPos.x <= 1.0) && (screenPos.y >= 0.0 && screenPos.y <= 1.0)) {
                if (abs(centerDepth - depth) < threshold) {
                    vec4 value = getSsaoValue(screenPos);
                    result += value.x;
                    pixelCount++;
                }
            }
        }
    }

    result = result / float(pixelCount);

    if (pixelCount < 1) {
        result = 1.0;
    }
    return result;
}

vec4 getAlbedo(vec2 screenPos) {
    return texture(colorTexture, screenPos);
}

void main(void) {
    vec4 color = getAlbedo(v_textureCoordinates);
    float ssao = getSsao(v_textureCoordinates);
    //out_FragColor = vec4(ssao, ssao, ssao, 1.0);
    out_FragColor = color * vec4(ssao, ssao, ssao, 1.0);
}