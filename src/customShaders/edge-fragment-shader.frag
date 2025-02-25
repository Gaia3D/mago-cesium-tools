uniform sampler2D colorTexture;
uniform sampler2D normalTexture;
uniform sampler2D highDepthTexture;
uniform float edgeWidth;
in vec2 v_textureCoordinates;

vec4 getNormal(vec2 screenPos) {
    return texture(normalTexture, screenPos);
}

vec4 getDepth(vec2 screenPos) {
    return texture(highDepthTexture, screenPos);
}

vec4 getPositionEC(vec2 screenPos) {
    vec4 rawDepthColor = getDepth(screenPos);
    float depth = czm_unpackDepth(rawDepthColor);
    vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
    return positionEC;
}

float getMeterDepth(vec2 screenPos) {
    return abs(getPositionEC(screenPos).z / getPositionEC(screenPos).w) * czm_depthRange.far;
}

float compareNormal(in vec4 normalA, in vec4 normalB) {
    return abs(normalA.x - normalB.x) + abs(normalA.y - normalB.y) + abs(normalA.z - normalB.z);
}

bool checkNormal() {
    vec2 texelSize = edgeWidth / czm_viewport.zw;
    float w = texelSize.x, h = texelSize.y;

    vec4 sn = getNormal(v_textureCoordinates);
    vec4 dn = getNormal(v_textureCoordinates + vec2(0.0, -h));
    vec4 rn = getNormal(v_textureCoordinates + vec2(w, 0.0));

    return (compareNormal(sn, dn) > 0.5 || compareNormal(sn, rn) > 0.5);
}

bool checkDepth() {
    vec2 texelSize = edgeWidth / czm_viewport.zw;
    float w = texelSize.x, h = texelSize.y;

    float sd = getMeterDepth(v_textureCoordinates);
    float offset = sd / 25.0;

    return (abs(sd - getMeterDepth(v_textureCoordinates + vec2(0.0, -h))) > offset ||
    abs(sd - getMeterDepth(v_textureCoordinates + vec2(w, 0.0))) > offset);
}

void main(void) {
    float sd = getMeterDepth(v_textureCoordinates);
    float offsetFactor = min((sd / 1000.0), 1.0);
    float offset = max(0.9 * offsetFactor, 0.5);

    if (checkNormal() || checkDepth()) {
        out_FragColor = texture(colorTexture, v_textureCoordinates) * offset;
    } else {
        out_FragColor = texture(colorTexture, v_textureCoordinates);
    }

    vec4 sunDir = vec4(czm_sunDirectionEC, 1.0);
    float dotResult = dot(getNormal(v_textureCoordinates).xyz, sunDir.xyz);
    float value = max(1.0, dotResult);

    out_FragColor = vec4(out_FragColor.xyz * value, 1.0);
}