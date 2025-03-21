// uniforms
uniform sampler2D windPositionTexture;
uniform sampler2D windSpeedTextures;
uniform vec3 dimensions;
uniform float altitudes[30];
uniform vec3 minValues;
uniform vec3 maxValues;
uniform vec3 bounds[4];
uniform float altitudeBounds[2];
uniform float speedFactor;
uniform float randomParam;

// inout
in vec2 v_textureCoordinates;
out vec4 fragColor_1;

vec3 denomalize(vec3 normalizedXYZ) {
    vec3 bottomBack = mix(bounds[0], bounds[1], normalizedXYZ.x);
    vec3 bottomFront = mix(bounds[3], bounds[2], normalizedXYZ.x);
    vec3 bottom = mix(bottomBack, bottomFront, normalizedXYZ.y);

    float altitude = mix(altitudeBounds[0], altitudeBounds[1], normalizedXYZ.z);

    vec3 result = vec3(bottom.xy, altitude);
    return result;
}
// given a point p and a quad defined by four points {a,b,c,d}, return the bilinear
// coordinates of p in the quad. Will not be in the range [0..1]^2 if the point is
// outside the quad.
float cross2d(in vec2 a, in vec2 b) {
    return a.x * b.y - a.y * b.x;
}
vec2 invBilinear(in vec2 p, in vec3 quad[4]) {
    vec2 a = quad[0].xy;
    vec2 b = quad[1].xy;
    vec2 c = quad[2].xy;
    vec2 d = quad[3].xy;

    vec2 res = vec2(-1.0);

    vec2 e = b - a;
    vec2 f = d - a;
    vec2 g = a - b + c - d;
    vec2 h = p - a;

    float k2 = cross2d(g, f);
    float k1 = cross2d(e, f) + cross2d(h, g);
    float k0 = cross2d(h, e);

    // if edges are parallel, this is a linear equation
    if(abs(k2) < 0.001) {
        res = vec2((h.x * k1 + f.x * k0) / (e.x * k1 - g.x * k0), -k0 / k1);
    }
    // otherwise, it's a quadratic
    else {
        float w = k1 * k1 - 4.0 * k0 * k2;
        if(w < 0.0)
            return vec2(-1.0);
        w = sqrt(w);

        float ik2 = 0.5 / k2;
        float v = (-k1 - w) * ik2;
        float u = (h.x - f.x * v) / (e.x + g.x * v);

        if(u < 0.0 || u > 1.0 || v < 0.0 || v > 1.0) {
            v = (-k1 + w) * ik2;
            u = (h.x - f.x * v) / (e.x + g.x * v);
        }
        res = vec2(u, v);
    }

    return res;
}

vec2 lengthOfLonLat(vec3 lonLatLev) {
    // unit conversion: meters -> longitude latitude degrees
    // see https://en.wikipedia.org/wiki/Geographic_coordinate_system#Length_of_a_degree for detail

    // Calculate the length of a degree of latitude and longitude in meters
    float latitude = radians(lonLatLev.y);

    float term1 = 111132.92;
    float term2 = 559.82 * cos(2.0 * latitude);
    float term3 = 1.175 * cos(4.0 * latitude);
    float term4 = 0.0023 * cos(6.0 * latitude);
    float latLength = term1 - term2 + term3 - term4;

    float term5 = 111412.84 * cos(latitude);
    float term6 = 93.5 * cos(3.0 * latitude);
    float term7 = 0.118 * cos(5.0 * latitude);
    float longLength = term5 - term6 + term7;

    return vec2(longLength, latLength);
}

vec3 convertSpeedUnitToLonLat(vec3 lonLatLev, vec3 speed) {
    vec2 lonLatLength = lengthOfLonLat(lonLatLev);
    float u = speed.x / lonLatLength.x;
    float v = speed.y / lonLatLength.y;
    float w = speed.z;  // altitude itself is altitude in meter unit
    vec3 windVectorInLonLatLev = vec3(u, v, w);

    return windVectorInLonLatLev;
}

vec3 calculateNextPosition(vec3 normalizedPosition, vec3 speed) {

    vec3 lonlatalt = denomalize(normalizedPosition);    // lla
    vec3 speedInLonLat = convertSpeedUnitToLonLat(lonlatalt, speed);    // lla

    vec3 movedLonlatalt = lonlatalt + speedInLonLat;

    vec2 uv = invBilinear(movedLonlatalt.xy, bounds);

    if(uv.x == -1.0 || uv.y == -1.0)
        return vec3(0.0);

    float boundaryAltitudeSize = (altitudeBounds[1] - altitudeBounds[0]);
    vec3 movedUVW = vec3(uv, (boundaryAltitudeSize == 0.0) ? 0.5 : ((movedLonlatalt.z - altitudeBounds[0]) / (altitudeBounds[1] - altitudeBounds[0])));

    return movedUVW;
}

// pseudo-random generator
const float randomCoefficient = 1.0;
const vec3 randomConstants = vec3(12.9898, 78.233, 435.85453);
float rand(vec2 seed, vec2 range) {
    vec2 randomSeed = randomCoefficient * seed;
    float temp = dot(randomConstants.xy, randomSeed) * randomParam;
    temp = fract(sin(temp) * (randomConstants.z + temp));
    return temp * (range.y - range.x) + range.x;
}

vec3 generateRandomParticle(vec2 seed) {
    // ensure the longitude is in [0, 360]
    //float randomLon = mod(rand(seed, vec2(minimum.x, maximum.x)), 360.0);
    float randomLon = rand(seed, vec2(0.0, 1.0));
    float randomLat = rand(-seed, vec2(0.0, 1.0));
    float randomAlt = rand(-seed * seed, vec2(0.0, 1.0));//(maximum.z+minimum.z)/2.0;//rand(seed*seed, vec2(minimum.z, maximum.z));

    return vec3(randomLon, randomLat, randomAlt);
}

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

bool checkOutBounds(vec3 normalizedPosition) {
    if(normalizedPosition.x <= 0.0 || normalizedPosition.x >= 1.0)
        return true;
    if(normalizedPosition.y <= 0.0 || normalizedPosition.y >= 1.0)
        return true;
    float boundaryAltitudeSize = (altitudeBounds[1] - altitudeBounds[0]);
    if(boundaryAltitudeSize > 0.0 && (normalizedPosition.z <= 0.0 || normalizedPosition.z >= 1.0))    // 단일면 데이터를 위해
        return true;

    return false;
}

void main() {

    vec2 particleIndex = v_textureCoordinates;

    vec3 normalizedPosition = texture(windPositionTexture, particleIndex).xyz;

    vec3 speed = getWindSpeedAt(normalizedPosition);

    vec3 movedNormalizedPosition = calculateNextPosition(normalizedPosition, speed * speedFactor);

    vec3 clampedNormalized = clamp(movedNormalizedPosition, vec3(0.0), vec3(1.0));

    vec2 seed = particleIndex + clampedNormalized.xy;
    float random = rand(seed, vec2(0.0, 1.0));

    bool shouldReposition = checkOutBounds(clampedNormalized) || random > 0.999;
    float repositioned = 0.0;
    if(shouldReposition) {
        // reposition to random p inside volume
        clampedNormalized = generateRandomParticle(particleIndex);
        repositioned = 1.0;
    }

    // normalized clamped position
    fragColor_1 = vec4(clampedNormalized, repositioned);
}
