in vec2 st;
in vec3 normal;

uniform int trailLength;
uniform sampler2D trailECEFPositionTextures[10];
uniform vec3 cameraPosition;
uniform float lineWidth;

out vec2 textureCoordinate;
out float repositioned;
out float trailAlpha;

vec4 calculateOffsetOnNormalDirection(vec4 pointA, vec4 pointB, float offsetSign) {
    float aspect = 1.0;
    vec2 aspectVec2 = vec2(aspect, 1.0);
    vec2 pointA_XY = (pointA.xy / pointA.w) * aspectVec2;
    vec2 pointB_XY = (pointB.xy / pointB.w) * aspectVec2;

    float offsetLength = lineWidth / 2.0;
    vec2 direction = normalize(pointB_XY - pointA_XY);
    vec2 normalVector = vec2(-direction.y, direction.x);
    normalVector.x = normalVector.x / aspect;
    normalVector = offsetLength * normalVector;

    vec4 offset = vec4(offsetSign * normalVector, 0.0, 0.0);
    return offset;
}

void main() {
    vec2 particleIndex = textureCoordinate = st;

    vec4 trails[10];

    int trailIndex = int(normal.x);
    for(int i = trailIndex; i <= trailIndex; i++) {
        if(i == 0)
            trails[i] = texture(trailECEFPositionTextures[0], particleIndex).rgba;
        if(i == 1)
            trails[i] = texture(trailECEFPositionTextures[1], particleIndex).rgba;
        if(i == 2)
            trails[i] = texture(trailECEFPositionTextures[2], particleIndex).rgba;
        if(i == 3)
            trails[i] = texture(trailECEFPositionTextures[3], particleIndex).rgba;
        if(i == 4)
            trails[i] = texture(trailECEFPositionTextures[4], particleIndex).rgba;
        if(i == 5)
            trails[i] = texture(trailECEFPositionTextures[5], particleIndex).rgba;
        if(i == 6)
            trails[i] = texture(trailECEFPositionTextures[6], particleIndex).rgba;
        if(i == 7)
            trails[i] = texture(trailECEFPositionTextures[7], particleIndex).rgba;
        if(i == 8)
            trails[i] = texture(trailECEFPositionTextures[8], particleIndex).rgba;
        if(i == 9)
            trails[i] = texture(trailECEFPositionTextures[9], particleIndex).rgba;
    }

    float vertexIndex = normal.y;

    vec3 currentPosition = trails[trailIndex].rgb;

    if(0 <= trailIndex && trailIndex + 1 < trailLength) {
        // 1. 진행 방향에 노말 방향으로 offset
        // vec3 prevPosition = trails[trailIndex + 1].rgb;
        // vec3 direction = normalize(currentPosition - prevPosition);

        // vec3 viewDir = -normalize( cameraPosition);

        // vec3 sideDir = normalize(cross(viewDir,direction));
        // currentPosition = currentPosition + sideDir * vertexIndex * lineWidth;

        // 2. 진행 방향에 노말 방향으로 offset
        vec3 prevPosition = trails[trailIndex + 1].rgb;

        vec4 curr = czm_modelView * vec4(currentPosition, 1.0).xyzw;
        vec4 prev = czm_modelView * vec4(prevPosition, 1.0).xyzw;

        vec2 direction = normalize(curr.xy - prev.xy);
        vec2 perp = vec2(-direction.y, direction.x);

        vec2 offset = curr.xy + perp * vertexIndex * lineWidth;

        vec3 moved = (czm_inverseModelView * vec4(offset.x, offset.y, curr.z, curr.w)).xyz;

        currentPosition = moved.xyz;

        // 3.진행 방향에 노말 방향으로 offset
        // vec3 prevPosition = trails[trailIndex + 1].rgb;

        // vec4 offset = calculateOffsetOnNormalDirection(vec4(currentPosition, 1.0), vec4(prevPosition, 1.0), vertexIndex);
        // currentPosition = currentPosition + offset.xyz * lineWidth;

    }

    repositioned = trails[trailIndex].a;
    trailAlpha = float(trailLength - trailIndex) / float(trailLength);  // 뒤로 갈수록 투명하게

    gl_Position = czm_modelViewProjection * vec4(currentPosition, 1.0);
}