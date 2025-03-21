// uniforms
uniform sampler2D windPositionTexture;
uniform sampler2D windSpeedTextures;
uniform vec3 dimensions;
uniform float altitudes[30];
uniform vec3 minValues;
uniform vec3 maxValues;
uniform vec3 bounds[4];
uniform float altitudeBounds[2];

// inout
in vec2 v_textureCoordinates;
out vec4 fragColor_1;

vec3 sampleWindSpeedAtLevel(int levelIndex, vec2 normalizedPosition) {
    float vSizePerLevel = (1.0 / dimensions.z);
    vec2 cellSizeInLevel = vec2((1.0 / (dimensions.x - 1.0)), (1.0 / (dimensions.y - 1.0)));

    vec2 cellStart = cellSizeInLevel * floor(normalizedPosition / cellSizeInLevel);
    vec2 frag = (normalizedPosition.xy - cellStart) / cellSizeInLevel;
    vec2 cellEnd = cellStart + cellSizeInLevel;

    vec2 levelStart = vec2(0.0, vSizePerLevel * float(levelIndex));
    vec2 levelEnd = vec2(1.0, vSizePerLevel * float(levelIndex + 1) - vSizePerLevel / (dimensions.y));  // for clamping
    vec2 toGlobalSize = vec2(1.0, vSizePerLevel);
    vec2 globalStart = clamp(cellStart * toGlobalSize + levelStart, levelStart, levelEnd);
    vec2 globalEnd = clamp(cellEnd * toGlobalSize + levelStart, levelStart, levelEnd);

    vec3 lb = texture(windSpeedTextures, vec2(globalStart.x, globalStart.y)).xyz;
    vec3 rb = texture(windSpeedTextures, vec2(globalEnd.x, globalStart.y)).xyz;
    vec3 lt = texture(windSpeedTextures, vec2(globalStart.x, globalEnd.y)).xyz;
    vec3 rt = texture(windSpeedTextures, vec2(globalEnd.x, globalEnd.y)).xyz;

    vec3 b = mix(lb, rb, frag.x);
    vec3 t = mix(lt, rt, frag.x);
    vec3 r = mix(b, t, frag.y);

    return r;
}

vec3 getWindSpeedAt(vec3 normalizedPosition) {
    int lowLevelIndex = -1;
    int highLevelIndex = -1;

    float boundaryAltitudeSize = (altitudeBounds[1] - altitudeBounds[0]);
    float altitude = (boundaryAltitudeSize == 0.0) ? altitudeBounds[1] : (normalizedPosition.z * (altitudeBounds[1] - altitudeBounds[0]) + altitudeBounds[0]);

    int levels = int(dimensions.z);
    for(int i = 0; i < levels; i++) {
        if(altitudes[i] >= altitude) {
            if(highLevelIndex == -1)
                highLevelIndex = i;
            else if(altitudes[highLevelIndex] >= altitudes[i])
                highLevelIndex = i;
        }
        if(altitudes[i] <= altitude) {
            if(lowLevelIndex == -1)
                lowLevelIndex = i;
            else if(altitudes[lowLevelIndex] <= altitudes[i])
                lowLevelIndex = i;
        }
    }

    if(lowLevelIndex == -1 || highLevelIndex == -1)
        return vec3(-1.0);       // should not excute

    vec3 normalizedWindSpeed = vec3(0.0);
    if(lowLevelIndex == highLevelIndex) {
        normalizedWindSpeed = sampleWindSpeedAtLevel(lowLevelIndex, normalizedPosition.xy);
    } else {
        vec3 low = sampleWindSpeedAtLevel(lowLevelIndex, normalizedPosition.xy);
        vec3 high = sampleWindSpeedAtLevel(highLevelIndex, normalizedPosition.xy);

        float ratio = (altitude - altitudes[lowLevelIndex]) / (altitudes[highLevelIndex] - altitudes[lowLevelIndex]);
        normalizedWindSpeed = low + (high - low) * ratio;
    }

    vec3 realWindSpeed = minValues + normalizedWindSpeed * (maxValues - minValues);
    if(maxValues.x == minValues.x)
        realWindSpeed.x = maxValues.x;
    if(maxValues.y == minValues.y)
        realWindSpeed.y = maxValues.y;
    if(maxValues.z == minValues.z)
        realWindSpeed.z = maxValues.z;
    return realWindSpeed;
}

void main() {

    vec2 particleIndex = v_textureCoordinates;

    vec3 normalizedPosition = texture(windPositionTexture, particleIndex).xyz;  // normalized

    vec3 speed = getWindSpeedAt(normalizedPosition);

    vec3 maxLength = max(abs(minValues), abs(maxValues));

    float normalizeSpeed = length(speed) / length(maxLength);

    // color 
    // fragColor_1 = vec4(vec3(normalizeSpeed), normalizeSpeed);
    fragColor_1 = vec4(vec3(1.0), 1.0);
}
