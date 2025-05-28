in vec2 v_textureCoordinates;
uniform sampler2D depthTexture;
uniform bool grayScale;
void main(void) {
    float unpackDepth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates.xy));
    if (grayScale) {
        out_FragColor = vec4(unpackDepth, unpackDepth, unpackDepth, 1.0);
    } else {
        vec4 packDepth = czm_packDepth(unpackDepth);
        out_FragColor = packDepth;
    }
}