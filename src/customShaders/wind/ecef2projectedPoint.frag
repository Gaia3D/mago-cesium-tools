out vec4 fragColor_1;

uniform sampler2D color;

in vec2 textureCoordinate;

void main() {
    fragColor_1 = texture(color, textureCoordinate);
}
