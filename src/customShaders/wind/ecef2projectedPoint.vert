in vec2 st;

uniform sampler2D ecefPosition;
uniform float pointSize;

out vec2 textureCoordinate;

void main() {
    vec2 particleIndex = textureCoordinate = st;

    vec3 currentPosition = texture(ecefPosition, particleIndex).rgb;

    gl_Position = czm_viewProjection * vec4(currentPosition, 1.0);
    gl_PointSize = pointSize;
}