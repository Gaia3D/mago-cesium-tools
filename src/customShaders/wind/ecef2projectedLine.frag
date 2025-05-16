out vec4 fragColor_1;

uniform sampler2D color;

in vec2 textureCoordinate;
in float repositioned;

void main() {
    if (repositioned == 0.0) {
        float normalizeSpeed = texture(color, textureCoordinate).x;
        fragColor_1 = vec4(normalizeSpeed);
        fragColor_1 = vec4(1.0);
        fragColor_1 = texture(color, textureCoordinate);
    } else {
        discard;
    }
}
