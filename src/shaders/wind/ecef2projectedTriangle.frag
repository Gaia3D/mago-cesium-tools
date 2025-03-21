out vec4 fragColor_1;

uniform sampler2D color;

in vec2 textureCoordinate;
in float repositioned;
in float trailAlpha;

void main() {
    if(repositioned == 0.0) {
        vec4 sampling = texture(color, textureCoordinate);
        vec3 color = sampling.xyz;
        fragColor_1 = vec4(color, sampling.a * trailAlpha);
    } else {
        discard;
    }
}
