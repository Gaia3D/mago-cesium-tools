uniform sampler2D projectedPosition;
uniform sampler2D projectedDepth;

in vec2 textureCoordinate;

out vec4 fragColor_1;

void main() {
    vec4 position = texture(projectedPosition, textureCoordinate);
    float depth = texture(projectedDepth, textureCoordinate).r;

    float globeDepth = czm_unpackDepth(texture(czm_globeDepthTexture, textureCoordinate));
    if(globeDepth == 0.0) {
        // 화면 상에서 지구의 바깥
        fragColor_1 = position;
    } else {
        // 화면 상에서 지구와 겹치는 부분
        if(depth < globeDepth) {
            // 화면상 지구보다 앞에 있는 부분
            fragColor_1 = position;
        } else {
            // 화면상 지구보다 뒤에 있는 부분
            // fragColor_1 = position;
        }
    }

}