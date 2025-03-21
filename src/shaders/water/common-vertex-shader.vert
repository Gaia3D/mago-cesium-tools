attribute vec2 aPosition;
varying vec2 vTexCoordinate;

void main() {
    vTexCoordinate = aPosition;
    vec2 position = (-1.0 + 2.0 * aPosition);
    gl_Position = vec4(position, 0.0, 1.0);
}