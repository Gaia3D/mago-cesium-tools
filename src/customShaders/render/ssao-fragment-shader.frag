uniform sampler2D colorTexture;
uniform sampler2D magoNormalTextureForSsao;
uniform sampler2D magoDepthTextureForSsao;
uniform float tangentOfFovy;
uniform float aspectRatio;
uniform float near;
uniform float far;
uniform float uIntensity;
uniform float uRadius;

float noiseBuffer[256] = float[256](
186.0, 114.0, 194.0, 163.0,
99.0, 71.0, 104.0, 93.0,
70.0, 86.0, 70.0, 179.0,
202.0, 130.0, 242.0, 202.0,
99.0, 113.0, 123.0, 214.0,
91.0, 170.0, 111.0, 156.0,
111.0, 236.0, 68.0, 153.0,
64.0, 74.0, 176.0, 93.0,
87.0, 105.0, 202.0, 205.0,
197.0, 98.0, 105.0, 232.0,
248.0, 217.0, 120.0, 72.0,
145.0, 148.0, 163.0, 245.0,
190.0, 102.0, 103.0, 203.0,
84.0, 233.0, 206.0, 243.0,
87.0, 77.0, 167.0, 226.0,
77.0, 195.0, 221.0, 154.0,
196.0, 107.0, 224.0, 161.0,
117.0, 219.0, 97.0, 160.0,
64.0, 223.0, 244.0, 152.0,
80.0, 171.0, 83.0, 166.0,
205.0, 218.0, 76.0, 243.0,
160.0, 209.0, 199.0, 102.0,
160.0, 173.0, 91.0, 157.0,
112.0, 182.0, 99.0, 98.0,
250.0, 248.0, 234.0, 168.0,
93.0, 66.0, 241.0, 150.0,
104.0, 176.0, 95.0, 222.0,
95.0, 125.0, 232.0, 254.0,
172.0, 71.0, 134.0, 173.0,
107.0, 238.0, 66.0, 127.0,
169.0, 90.0, 102.0, 199.0,
116.0, 224.0, 142.0, 158.0,
202.0, 194.0, 76.0, 90.0,
189.0, 90.0, 213.0, 172.0,
79.0, 210.0, 205.0, 87.0,
126.0, 204.0, 66.0, 148.0,
169.0, 216.0, 240.0, 73.0,
198.0, 255.0, 124.0, 151.0,
102.0, 76.0, 65.0, 127.0,
239.0, 195.0, 115.0, 79.0,
155.0, 125.0, 144.0, 189.0,
183.0, 101.0, 92.0, 93.0,
86.0, 120.0, 209.0, 151.0,
186.0, 149.0, 75.0, 91.0,
74.0, 202.0, 200.0, 114.0,
101.0, 253.0, 147.0, 216.0,
230.0, 198.0, 109.0, 141.0,
136.0, 83.0, 240.0, 162.0,
86.0, 220.0, 215.0, 129.0,
126.0, 85.0, 107.0, 151.0,
191.0, 172.0, 118.0, 211.0,
211.0, 118.0, 81.0, 77.0,
93.0, 242.0, 81.0, 108.0,
132.0, 254.0, 109.0, 66.0,
68.0, 129.0, 209.0, 224.0,
253.0, 229.0, 123.0, 214.0,
147.0, 70.0, 146.0, 81.0,
185.0, 73.0, 105.0, 227.0,
157.0, 120.0, 162.0, 163.0,
174.0, 244.0, 182.0, 81.0,
244.0, 137.0, 220.0, 154.0,
94.0, 156.0, 163.0, 86.0,
114.0, 184.0, 189.0, 146.0,
181.0, 220.0, 90.0, 70.0
);

float kernels[96] = float[96](
0.33, 0.0, 0.85,
0.25, 0.3, 0.5,
0.1, 0.3, 0.85,
-0.15, 0.2, 0.85,
-0.33, 0.05, 0.6,
-0.1, -0.15, 0.85,
-0.05, -0.32, 0.25,
0.2, -0.15, 0.85,
0.6, 0.0, 0.55,
0.5, 0.6, 0.45,
-0.01, 0.7, 0.35,
-0.33, 0.5, 0.45,
-0.45, 0.0, 0.55,
-0.65, -0.5, 0.7,
0.0, -0.5, 0.55,
0.33, 0.3, 0.35,
0.33, 0.0, -0.85,
0.25, 0.3, -0.5,
0.1, 0.3, -0.85,
-0.15, 0.2, -0.85,
-0.33, 0.05, -0.6,
-0.1, -0.15, -0.85,
-0.05, -0.32, -0.25,
0.2, -0.15, -0.85,
0.6, 0.0, -0.55,
0.5, 0.6, -0.45,
-0.01, 0.7, -0.35,
-0.33, 0.5, -0.45,
-0.45, 0.0, -0.55,
-0.65, -0.5, -0.7,
0.0, -0.5, -0.55,
0.33, 0.3, -0.35
);


in vec2 v_textureCoordinates;

float randomFloat(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}
vec4 getAlbedo(vec2 screenPos) {
    return texture(colorTexture, screenPos);
}
vec3 encodeNormal(in vec3 normal) {
    return normal.xyz * 0.5 + 0.5;
}
vec4 decodeNormal(in vec4 normal) {
    return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}
vec4 getNormal(vec2 screenPos) {
    return texture(magoNormalTextureForSsao, screenPos);
}

vec4 getDepth(vec2 screenPos) {
    return texture(magoDepthTextureForSsao, screenPos);
}
vec4 getPositionEC(vec2 screenPos) {
    vec4 rawDepthColor = getDepth(screenPos);
    float depth = czm_unpackDepth(rawDepthColor);
    vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
    return positionEC;
}
float znkimDepth(vec2 screenPos) {
    vec4 positionEC = getPositionEC(screenPos);
    return abs(positionEC.z / positionEC.w);
}
float getMeterDepth(vec2 screenPos) {
    return znkimDepth(screenPos) * czm_depthRange.far;
}

vec3 getViewRay(vec2 screenPos, in float relFar) {
    float hfar = 2.0 * tangentOfFovy * relFar;
    float wfar = hfar * aspectRatio;
    vec3 ray = vec3(wfar * (screenPos.x - 0.5), hfar * (screenPos.y - 0.5), -relFar);
    return ray;
}
float compareNormalOffset(in vec4 normalA, in vec4 normalB) {
    float result = 0.0;
    result += abs(normalA.x - normalB.x);
    result += abs(normalA.y - normalB.y);
    result += abs(normalA.z - normalB.z);
    return result;
}

float getOcclusion(vec3 origin, vec3 rotatedKernel, float radius) {
    float resultOcclusion = 1.0;
    vec3 sampleKernel = origin + (rotatedKernel * radius);
    vec4 offset = czm_projection * vec4(sampleKernel, 1.0);
    vec3 offsetCoord = vec3(offset.xyz);
    offsetCoord.xyz /= offset.w;
    offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;

    if ((abs(offsetCoord.x) > 1.0 || abs(offsetCoord.y) > 1.0) && (abs(offsetCoord.x) < 0.0 || abs(offsetCoord.y) < 0.0)) {
        resultOcclusion = 0.0;
    } else {
        float bufferZ = znkimDepth(offsetCoord.xy) * czm_depthRange.far;
        float sampleZ = -sampleKernel.z * czm_depthRange.far;
        float zDiff = abs(bufferZ - sampleZ);
        if (zDiff < radius * 2.0) {
            if (bufferZ < sampleZ) {
                resultOcclusion = 0.0;
            }
        }
    }
    return resultOcclusion;
}

float getNoiseTexIndex(vec2 screenPos) {
    vec2 fragCoord = mod(gl_FragCoord.xy, 4.0);
    float yValue = fragCoord.y * 4.0;
    float xValue = fragCoord.x;
    return (xValue + yValue) * 4.0;
}

vec4 getSSAO(in vec2 screenPos) {
    vec3 test = vec3(0.0);
    int iKernelSize = 32;
    float fKernelSize = 32.0;

    float occlusionA = 0.0;
    float occlusionB = 0.0;
    float occlusionC = 0.0;
    float occlusionD = 0.0;

    float farDepth = czm_depthRange.far;
    vec3 normal = decodeNormal(getNormal(screenPos)).xyz;
    float originDepth = getMeterDepth(screenPos);

    vec3 origin = getViewRay(screenPos, originDepth);

    float noiseIndex = getNoiseTexIndex(screenPos.xy);
    int iNoiseIndex = int(noiseIndex);
    float noiseR = noiseBuffer[iNoiseIndex];
    float noiseG = noiseBuffer[iNoiseIndex + 1];
    float noiseB = noiseBuffer[iNoiseIndex + 2];
    float noiseA = noiseBuffer[iNoiseIndex + 3];

    float noiseX = noiseR / 256.0;
    float noiseY = noiseG / 256.0;
    float noiseZ = noiseB / 256.0;
    float noiseW = noiseA / 256.0;

    vec4 noise = vec4(noiseX, noiseY, noiseZ, noiseW);
    vec3 rvec = noise.xyz * 2.0 - 1.0;

    vec3 tangent = normalize(rvec - normal * dot(rvec, normal));
    vec3 bitangent = normalize(cross(normal, tangent));
    mat3 tbn = mat3(tangent, bitangent, normal);

    int loopSize = iKernelSize * 3;
    mat3 modelViewRotation = mat3(czm_modelViewRelativeToEye);
    for (int i = 0; i < loopSize; i += 3) {
        vec3 kernel = rvec * vec3(kernels[i], kernels[i + 1], kernels[i + 2]);
        float radiusA = 0.1 * uRadius;
        float radiusB = 0.25 * uRadius;
        float radiusC = 0.5 * uRadius;
        float radiusD = 0.75 * uRadius;

        occlusionA += getOcclusion(origin, kernel, radiusA);
        occlusionB += getOcclusion(origin, kernel, radiusB);
        occlusionC += getOcclusion(origin, kernel, radiusC);
        occlusionD += getOcclusion(origin, kernel, radiusD);
    }

    float offset = 10.0;
    if (occlusionA > offset) {
        occlusionA = 16.0;
    }
    if (occlusionB > offset) {
        occlusionB = 16.0;
    }
    if (occlusionC > offset) {
        occlusionC = 16.0;
    }
    if (occlusionD > offset) {
        occlusionD = 16.0;
    }

    float maxValue = 1.0 - uIntensity;
    occlusionA = max(maxValue, occlusionA / 16.0);
    occlusionB = max(maxValue, occlusionB / 16.0);
    occlusionC = max(maxValue, occlusionC / 16.0);
    occlusionD = max(maxValue, occlusionD / 16.0);

    return vec4(occlusionA, occlusionB, occlusionC, occlusionD);
}

void main(void) {
    vec4 color = getAlbedo(v_textureCoordinates);
    vec4 depth = getDepth(v_textureCoordinates);
    vec4 normal = getNormal(v_textureCoordinates);

    vec4 ssao = getSSAO(v_textureCoordinates);
    out_FragColor = vec4(1.0);
    out_FragColor = out_FragColor * ssao.x * ssao.y * ssao.z * ssao.w;
}