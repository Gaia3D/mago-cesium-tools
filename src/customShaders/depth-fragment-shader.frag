in vec2 v_textureCoordinates;
uniform sampler2D depthTexture;
void main(void) {
    float unpackDepth = czm_unpackDepth(texture(depthTexture, v_textureCoordinates.xy));
    vec4 packDepth = czm_packDepth(unpackDepth);
    out_FragColor = packDepth;
}