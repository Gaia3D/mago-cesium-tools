in vec2 st;
in vec3 normal;

uniform int trailLength;
uniform sampler2D trailECEFPositionTextures[10];

out vec2 textureCoordinate;
out float repositioned;

void main() {
    vec2 particleIndex = textureCoordinate = st;

vec4 trails[10];

int trailIndex = int(normal.x);
for (int i = trailIndex; i <= trailIndex; i++) {
if (i == 0)
trails[i] = texture(trailECEFPositionTextures[0], particleIndex).rgba;
if (i == 1)
trails[i] = texture(trailECEFPositionTextures[1], particleIndex).rgba;
if (i == 2)
trails[i] = texture(trailECEFPositionTextures[2], particleIndex).rgba;
if(i == 3)
trails[i] = texture(trailECEFPositionTextures[3], particleIndex).rgba;
if (i == 4)
trails[i] = texture(trailECEFPositionTextures[4], particleIndex).rgba;
if (i == 5)
trails[i] = texture(trailECEFPositionTextures[5], particleIndex).rgba;
if (i == 6)
trails[i] = texture(trailECEFPositionTextures[6], particleIndex).rgba;
if (i == 7)
trails[i] = texture(trailECEFPositionTextures[7], particleIndex).rgba;
if (i == 8)
trails[i] = texture(trailECEFPositionTextures[8], particleIndex).rgba;
if (i == 9)
trails[i] = texture(trailECEFPositionTextures[9], particleIndex).rgba;
}

vec3 currentPosition = trails[trailIndex].rgb;
repositioned = trails[trailIndex].a; //max(trails[trailIndex].a, trails[trailIndex + 1].a);

gl_Position = czm_viewProjection * vec4(currentPosition, 1.0);
}