in vec2 v_textureCoordinates;
void main(void) {
    out_FragColor = texture(czm_globeDepthTexture, v_textureCoordinates.xy);
}