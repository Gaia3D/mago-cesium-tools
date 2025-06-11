precision highp float;
in vec3 positionMC;
in vec3 camPosMC;
in vec3 normalMC;
layout (location = 0) out vec4 fragColor;

uniform sampler2D mosaicTexture;
uniform vec3 u_minBoxPosition; // Minimum position for the volume.
uniform vec3 u_maxBoxPosition; // Maximum position for the volume.
uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform vec2 u_minMaxAltitudeSlices[32]; // limited to 32 slices.***
uniform vec2 u_minMaxValues; // The min and max values of the texture.***

// legend colors & values.
uniform vec4 u_legendColors[16];
uniform float u_legendValues[16];
uniform int u_legendColorsCount;
uniform float u_legendValuesScale;

uniform int u_renderingColorType;  // 0= rainbow, 1= monotone, 2= legendColors.
uniform int u_samplingsCount;

uniform vec3 u_AAPlanePosMC; // The position of the plane in model coordinates.***
uniform int u_AAPlaneNormalMC; // The normal of the plane. 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z.***

void checkTexCoordRange(inout vec2 texCoord) {
    float error = 0.0;
    if (texCoord.x < 0.0) {
        texCoord.x = 0.0 + error;
    } else if (texCoord.x > 1.0) {
        texCoord.x = 1.0 - error;
    }

    if (texCoord.y < 0.0) {
        texCoord.y = 0.0 + error;
    } else if (texCoord.y > 1.0) {
        texCoord.y = 1.0 - error;
    }
}

float unpackDepth(const in vec4 rgba_depth) {
    return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col_mosaic, in int row_mosaic) {
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    checkTexCoordRange(subTexCoord);
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    float s = float(col_mosaic) * sRange + subTexCoord.x * sRange;
    float t = float(row_mosaic) * tRange + subTexCoord.y * tRange;

    // must check if the texCoord_tl is boundary in x & y.***************************************************************************
    float mosaicTexSize_x = float(u_texSize[0] * u_mosaicSize[0]); // for example : 150 pixels * 3 columns = 450 pixels.***
    float mosaicTexSize_y = float(u_texSize[1] * u_mosaicSize[1]); // for example : 150 pixels * 3 rows = 450 pixels.***

    float currMosaicStart_x = float(col_mosaic * u_texSize[0]);
    float currMosaicStart_y = float(row_mosaic * u_texSize[1]);
    float currMosaicEnd_x = currMosaicStart_x + float(u_texSize[0]);
    float currMosaicEnd_y = currMosaicStart_y + float(u_texSize[1]);

    float pixel_x = s * mosaicTexSize_x;
    float pixel_y = t * mosaicTexSize_y;

    if (pixel_x < currMosaicStart_x + 1.0) {
        pixel_x = currMosaicStart_x + 1.0;
    } else if (pixel_x > currMosaicEnd_x - 1.0) {
        pixel_x = currMosaicEnd_x - 1.0;
    }

    if (pixel_y < currMosaicStart_y + 1.0) {
        pixel_y = currMosaicStart_y + 1.0;
    } else if (pixel_y > currMosaicEnd_y - 1.0) {
        pixel_y = currMosaicEnd_y - 1.0;
    }

    s = pixel_x / mosaicTexSize_x;
    t = pixel_y / mosaicTexSize_y;


    vec2 resultTexCoord = vec2(s, t);

    return resultTexCoord;
}

bool intersectAABBox(vec3 rayOrigin, vec3 rayDir, out float tMin, out float tMax) {
    vec3 invDir = 1.0 / rayDir;

    vec3 t0s = (u_minBoxPosition - rayOrigin) * invDir;
    vec3 t1s = (u_maxBoxPosition - rayOrigin) * invDir;

    vec3 tsmaller = min(t0s, t1s);
    vec3 tbigger = max(t0s, t1s);

    tMin = max(max(tsmaller.x, tsmaller.y), tsmaller.z);
    tMax = min(min(tbigger.x, tbigger.y), tbigger.z);

    return tMax > max(tMin, 0.0);
}

bool intersectAAPlane(vec3 rayOrigin, vec3 rayDir, int normalAxis, vec3 planePosition, out float t, out vec3 hitPoint) {
    float denom;
    float numer;

    // The normal of the plane. 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z.***

    if (normalAxis == 1 || normalAxis == 4) { // ±X
                                              denom = rayDir.x;
                                              numer = planePosition.x - rayOrigin.x;
    } else if (normalAxis == 2 || normalAxis == 5) { // ±Y
                                                     denom = rayDir.y;
                                                     numer = planePosition.y - rayOrigin.y;
    } else if (normalAxis == 3 || normalAxis == 6) { // ±Z
                                                     denom = rayDir.z;
                                                     numer = planePosition.z - rayOrigin.z;
    } else {
        t = -1.0;
        return false;
    }

    if (abs(denom) < 1e-8) {
        // El rayo es paralelo al plano
        t = -1.0;
        return false;
    }

    t = numer / denom;

    if (t < 0.0) {
        // La intersección está detrás del origen del rayo
        hitPoint = vec3(0.0);
        return false;
    }

    hitPoint = rayOrigin + t * rayDir;
    return true;
}

bool isPointInsideAABB(vec3 point, vec3 minBox, vec3 maxBox) {
    return (point.x >= minBox.x && point.x <= maxBox.x && point.y >= minBox.y && point.y <= maxBox.y && point.z >= minBox.z && point.z <= maxBox.z);
}

vec4 getColorByLegendColors(float realValue) {
    vec4 colorAux = vec4(0.3, 0.3, 0.3, 0.0);
    vec4 colorZero = vec4(0.3, 0.3, 0.3, 0.0);

    // The legendValues are scaled, so must scale the realPollutionValue.***
    float scaledValue = realValue * u_legendValuesScale;

    // find legendIdx.***
    for (int i = 0; i < u_legendColorsCount; i++) {
        if (i >= u_legendColorsCount) {
            break;
        }

        if (i == 0) {
            if (scaledValue < u_legendValues[i]) {
                float value0 = 0.0;
                float value1 = u_legendValues[i];
                float factor = (scaledValue - value0) / (value1 - value0);
                colorAux = mix(colorZero, u_legendColors[i], factor);
                break;
            }
        }

        if (i < u_legendColorsCount - 1) {
            if (scaledValue >= u_legendValues[i] && scaledValue < u_legendValues[i + 1]) {
                float value0 = u_legendValues[i];
                float value1 = u_legendValues[i + 1];
                float factor = (scaledValue - value0) / (value1 - value0);
                colorAux = mix(u_legendColors[i], u_legendColors[i + 1], factor);
                break;
            }
        } else if (i == u_legendColorsCount - 1) {
            if (scaledValue >= u_legendValues[i]) {
                colorAux = u_legendColors[i];
                break;
            } else {
                float value0 = u_legendValues[i];
                float value1 = u_legendValues[i];
                float factor = (scaledValue - value0) / (value1 - value0);
                colorAux = mix(u_legendColors[i], u_legendColors[i], factor);
            }
        }

    }

    return colorAux;
}

vec4 getRainbowColor(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold) {
    float gray = (height - minHeight_rainbow) / (maxHeight_rainbow - minHeight_rainbow);

    if (gray > 1.0) { gray = 1.0; } else if (gray < 0.0) { gray = 0.0; }

    float value = gray * 3.99;
    float h = floor(value);
    float f = fract(value);


    vec4 resultColor = vec4(0.0, 0.0, 0.0, (gray));

    if (hotToCold) {
        // HOT to COLD.***
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init
        if (h >= 0.0 && h < 1.0) {
            // mix red & yellow.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(red, yellow, f);
        } else if (h >= 1.0 && h < 2.0) {
            // mix yellow & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, green, f);
        } else if (h >= 2.0 && h < 3.0) {
            // mix green & cyan.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(green, cyan, f);
        } else if (h >= 3.0) {
            // mix cyan & blue.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, blue, f);
        }
    } else {
        // COLD to HOT.***
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init
        if (h >= 0.0 && h < 1.0) {
            // mix blue & cyan.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(blue, cyan, f);
        } else if (h >= 1.0 && h < 2.0) {
            // mix cyan & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, green, f);
        } else if (h >= 2.0 && h < 3.0) {
            // mix green & yellow.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(green, yellow, f);
        } else if (h >= 3.0) {
            // mix yellow & red.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, red, f);
        }
    }

    return resultColor;
}

vec3 getTexCoord3DFromPositionMC(vec3 positionMC) {
    // Convert the position in model coordinates to texture coordinates.
    vec3 texCoord3D = (positionMC - u_minBoxPosition) / (u_maxBoxPosition - u_minBoxPosition);

    // Normalize the texture coordinates to be in the range [0, 1].
    texCoord3D.x = clamp(texCoord3D.x, 0.0, 1.0);
    texCoord3D.y = clamp(texCoord3D.y, 0.0, 1.0);
    texCoord3D.z = clamp(texCoord3D.z, 0.0, 1.0);
    return texCoord3D;
}

void getSliceIndexFromPositionMC(vec3 positionMC, out int sliceDownIdx, out int sliceUpIdx, out float distUp, out float distDown) {
    float altitude = positionMC.z;
    int currSliceIdx = u_texSize[2] - 1;
    sliceDownIdx = 0;
    sliceUpIdx = 1;
    for (int i = 0; i < 32; i++) {
        vec2 minMaxAltitude = vec2(u_minMaxAltitudeSlices[i]);
        if (altitude >= minMaxAltitude.x && altitude < minMaxAltitude.y) {
            currSliceIdx = i;
            break;
        }

        if (i == u_texSize[2] - 1) {
            break;
        }
    }

    // if(currSliceIdx < 0)
    // {
    //     currSliceIdx = 0;
    // }

    if (currSliceIdx == 0) {
        sliceDownIdx = currSliceIdx;
        sliceUpIdx = currSliceIdx;
    } else {
        sliceDownIdx = currSliceIdx - 1;
        sliceUpIdx = currSliceIdx;
    }

    if (sliceUpIdx > u_texSize[2] - 1) {
        sliceUpIdx = u_texSize[2] - 1;
    }

    // +------------------------------+ <- sliceUp
    //                 |
    //                 |
    //                 |  distUp
    //                 |
    //                 * <- posL.z
    //                 |
    //                 |  distDown
    // +------------------------------+ <- sliceDown
    float sliceUpAltitude = 0.0;
    float sliceDownAltitude = 0.0;
    for (int i = 0; i < 32; i++) {
        if (sliceUpIdx == i) {
            sliceUpAltitude = u_minMaxAltitudeSlices[i].y;
            sliceDownAltitude = u_minMaxAltitudeSlices[i].x;
            break;
        }
    }

    distUp = abs(sliceUpAltitude - altitude);
    distDown = abs(altitude - sliceDownAltitude);
}

void getColunmRowFromSliceIndex(int sliceIndex, out int col_mosaic, out int row_mosaic) {
    // The sliceIndex is the index of the slice in the 3D texture.***
    // The col_mosaic and row_mosaic are the column and row of the mosaic texture.***
    // The u_mosaicSize[0] is the number of columns in the mosaic texture.***
    // The u_mosaicSize[1] is the number of rows in the mosaic texture.***
    // col_mosaic = sliceIndex % u_mosaicSize[0];
    // row_mosaic = sliceIndex / u_mosaicSize[0];

    float rowAux = floor(float(sliceIndex) / float(u_mosaicSize[0]));
    float colAux = float(sliceIndex) - rowAux * float(u_mosaicSize[0]);
    col_mosaic = int(colAux);
    row_mosaic = int(rowAux);
}

float getValue_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic) {
    // The subTexCoord2d is the 2D texture coordinate of the slice.***
    // The col_mosaic and row_mosaic are the column and row of the mosaic texture.***

    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec2 px = 1.0 / sim_res3d.xy;
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);
    vec2 texCoord_tl = vc + vec2(0.0, 0.0);
    vec2 texCoord_tr = vc + vec2(px.x, 0.0);
    vec2 texCoord_bl = vc + vec2(0.0, px.y);
    vec2 texCoord_br = vc + vec2(px.x, px.y);

    texCoord_tl.y = 1.0 - texCoord_tl.y; // Invert Y coordinate for texture sampling.
    texCoord_tr.y = 1.0 - texCoord_tr.y; // Invert Y coordinate for texture sampling.
    texCoord_bl.y = 1.0 - texCoord_bl.y; // Invert Y coordinate for texture sampling.
    texCoord_br.y = 1.0 - texCoord_br.y; // Invert Y coordinate for texture sampling.

    vec4 texColor_tl = texture(mosaicTexture, subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic));
    vec4 texColor_tr = texture(mosaicTexture, subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic));
    vec4 texColor_bl = texture(mosaicTexture, subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic));
    vec4 texColor_br = texture(mosaicTexture, subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic));

    float realvalueRange = u_minMaxValues.y - u_minMaxValues.x;
    float value_tl = unpackDepth(texColor_tl) * realvalueRange + u_minMaxValues.x;
    float value_tr = unpackDepth(texColor_tr) * realvalueRange + u_minMaxValues.x;
    float value_bl = unpackDepth(texColor_bl) * realvalueRange + u_minMaxValues.x;
    float value_br = unpackDepth(texColor_br) * realvalueRange + u_minMaxValues.x;

    float value_t = mix(value_tl, value_tr, f.x);
    float value_b = mix(value_bl, value_br, f.x);
    float value = mix(value_t, value_b, f.y);

    return value;
}

float getValue_NEAREST(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic) {
    // The subTexCoord2d is the 2D texture coordinate of the slice.***
    // The col_mosaic and row_mosaic are the column and row of the mosaic texture.***
    vec2 subTexCoord = subTexCoord2d;
    subTexCoord.y = 1.0 - subTexCoord.y; // Invert Y coordinate for texture sampling.
    vec4 texColor_tl = texture(mosaicTexture, subTexCoord_to_texCoord(subTexCoord, col_mosaic, row_mosaic));
    float realvalueRange = u_minMaxValues.y - u_minMaxValues.x;
    float value_tl = unpackDepth(texColor_tl) * realvalueRange + u_minMaxValues.x;

    return value_tl;
}

void getValueFAST(in vec3 texCoord3d, in vec3 positionMC, out float value) {
    int sliceDownIdx, sliceUpIdx;
    float distUp, distDown;
    getSliceIndexFromPositionMC(positionMC, sliceDownIdx, sliceUpIdx, distUp, distDown);

    int colDown, rowDown;
    getColunmRowFromSliceIndex(sliceDownIdx, colDown, rowDown);
    vec2 subTexCoordDown = vec2(texCoord3d.x, texCoord3d.y);
    float valueDown = getValue_NEAREST(subTexCoordDown, colDown, rowDown);
    if (valueDown > u_minMaxValues.x) {
        value = valueDown;
        return;
    }

    int colUp, rowUp;
    getColunmRowFromSliceIndex(sliceUpIdx, colUp, rowUp);
    vec2 subTexCoordUp = vec2(texCoord3d.x, texCoord3d.y);
    float valueUp = getValue_NEAREST(subTexCoordUp, colUp, rowUp);
    if (valueUp > u_minMaxValues.x) {
        value = valueUp;
        return;
    }

    value = 0.0;
}

void getValue(in vec3 texCoord3d, in vec3 positionMC, out float value) {
    int sliceDownIdx, sliceUpIdx;
    float distUp, distDown;
    getSliceIndexFromPositionMC(positionMC, sliceDownIdx, sliceUpIdx, distUp, distDown);

    float totalDist = distUp + distDown;
    float distDownRatio = distDown / totalDist;

    int colDown, rowDown;
    getColunmRowFromSliceIndex(sliceDownIdx, colDown, rowDown);
    int colUp, rowUp;
    getColunmRowFromSliceIndex(sliceUpIdx, colUp, rowUp);

    vec2 subTexCoordDown = vec2(texCoord3d.x, texCoord3d.y);
    vec2 subTexCoordUp = vec2(texCoord3d.x, texCoord3d.y);
    float valueDown = getValue_triLinearInterpolation(subTexCoordDown, colDown, rowDown);
    float valueUp = getValue_triLinearInterpolation(subTexCoordUp, colUp, rowUp);

    // The value is the linear interpolation of the two values.***
    value = mix(valueDown, valueUp, distDownRatio);
}

bool findFirstSamplePosition(in vec3 frontPosMC, in vec3 camDirMC, in float increLength, out vec3 result_samplePos) {
    // The frontPosMC is the position of the camera.***
    // The result_samplePos is the position of the first sample.***
    vec3 samplePosMC;
    vec3 samplePosMC_prev;
    for (int i = 0; i < 30; i++) {
        float dist = float(i) * increLength;
        samplePosMC = frontPosMC + camDirMC * dist;

        if (i == 0) {
            samplePosMC_prev = samplePosMC;
        }

        vec3 texCoord3d = getTexCoord3DFromPositionMC(samplePosMC);
        float value;
        getValueFAST(texCoord3d, samplePosMC, value);
        if (value > u_minMaxValues.x) {
            // if(i > 0) {
            //     // check the previous sample.***
            //     vec3 samplePosMC_semiPrev = samplePosMC - camDirMC * (increLength * 0.5);
            //     vec3 texCoord3d_semiPrev = getTexCoord3DFromPositionMC(samplePosMC_semiPrev);
            //     float value_semiPrev;
            //     getValueFAST(texCoord3d_semiPrev, samplePosMC_semiPrev, value_semiPrev);
            //     if(value_semiPrev > u_minMaxValues.x) {
            //         result_samplePos = samplePosMC_prev;
            //         return true;
            //     }
            //     else {
            //         result_samplePos = texCoord3d_semiPrev;
            //         return true;
            //     }
            // }

            result_samplePos = samplePosMC;
            return true;
        }

        samplePosMC_prev = samplePosMC;
    }

    return false;
}

vec4 getColor(float value) {
    vec4 colorCurrent;

    if (u_renderingColorType == 0) {
        colorCurrent = getRainbowColor(value, u_minMaxValues.x, u_minMaxValues.y, false);
    } else if (u_renderingColorType == 1) {
        float unitaryValue = (value - u_minMaxValues.x) / (u_minMaxValues.y - u_minMaxValues.x);
        colorCurrent = vec4(unitaryValue, 0.0, 0.0, unitaryValue);
    } else if (u_renderingColorType == 2) {
        colorCurrent = getColorByLegendColors(value);
    }
    return colorCurrent;
}

vec3 getPlanePositionMC() {
    // Get the position of the cutting plane in model coordinates.
    // clamp the position to the box limits to avoid precision issues.
    float clampFactor = 0.9999;
    vec3 planePosMC = vec3(u_AAPlanePosMC);
    if (u_AAPlaneNormalMC == 1 || u_AAPlaneNormalMC == 4) {
        if (planePosMC.x >= u_maxBoxPosition.x * clampFactor) {
            planePosMC.x = u_maxBoxPosition.x * clampFactor; // Avoid precision issues.
        } else if (planePosMC.x <= u_minBoxPosition.x * clampFactor) {
            planePosMC.x = u_minBoxPosition.x * clampFactor; // Avoid precision issues.
        }
    } else if (u_AAPlaneNormalMC == 2 || u_AAPlaneNormalMC == 5) {
        if (planePosMC.y >= u_maxBoxPosition.y * clampFactor) {
            planePosMC.y = u_maxBoxPosition.y * clampFactor; // Avoid precision issues.
        } else if (planePosMC.y <= u_minBoxPosition.y * clampFactor) {
            planePosMC.y = u_minBoxPosition.y * clampFactor; // Avoid precision issues.
        }
    } else if (u_AAPlaneNormalMC == 3 || u_AAPlaneNormalMC == 6) {
        if (planePosMC.z >= u_maxBoxPosition.z * clampFactor) {
            planePosMC.z = u_maxBoxPosition.z * clampFactor; // Avoid precision issues.
        } else if (planePosMC.z <= u_minBoxPosition.z * clampFactor) {
            planePosMC.z = u_minBoxPosition.z * clampFactor; // Avoid precision issues.
        }
    }

    return planePosMC;
}

bool isInFrontOfCuttingPlane(vec3 posMC) {
    // Check if the position is in front of the cutting plane.
    // u_AAPlaneNormalMC : 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z.***
    vec3 planePosMC = getPlanePositionMC();

    if (u_AAPlaneNormalMC == 0) {
        return false; // No cutting plane.
    } else if (u_AAPlaneNormalMC == 1) {
        // x positive.
        return posMC.x > planePosMC.x;
    } else if (u_AAPlaneNormalMC == 2) {
        // y positive.
        return posMC.y > planePosMC.y;
    } else if (u_AAPlaneNormalMC == 3) {
        // z positive.
        return posMC.z > planePosMC.z;
    } else if (u_AAPlaneNormalMC == 4) {
        // x negative.
        return posMC.x < planePosMC.x;
    } else if (u_AAPlaneNormalMC == 5) {
        // y negative.
        return posMC.y < planePosMC.y;
    } else if (u_AAPlaneNormalMC == 6) {
        // z negative.
        return posMC.z < planePosMC.z;
    }
    return false; // Default case, should not happen.
}

void recalculateMinOrMaxSamplePositionWithCuttingPlane(inout vec3 minSamplePos, inout vec3 maxSamplePos, inout float tMin, inout float tMax, in vec3 camPosMC, in vec3 camDirMC) {
    // u_AAPlaneNormalMC : 0 = noApply, 1 = x, 2 = y, 3 = z, 4 = -x, 5 = -y, 6 = -z.***
    if (u_AAPlaneNormalMC != 0) {
        // do not draw in front of cutting planes.***
        bool minSamplePosInFrontOfPlane = isInFrontOfCuttingPlane(minSamplePos);
        bool maxSamplePosInFrontOfPlane = isInFrontOfCuttingPlane(maxSamplePos);
        if (minSamplePosInFrontOfPlane && maxSamplePosInFrontOfPlane) {
            // Both points are in front of the cutting plane, so we discard the fragment.
            discard;
        } else if (minSamplePosInFrontOfPlane != maxSamplePosInFrontOfPlane) {
            vec3 planeHitPoint;
            float t;
            vec3 planePosMC = getPlanePositionMC();
            if (intersectAAPlane(camPosMC, camDirMC, u_AAPlaneNormalMC, planePosMC, t, planeHitPoint)) {
                if (t > tMin) {
                    if (minSamplePosInFrontOfPlane) {
                        tMin = t;
                        minSamplePos = camPosMC + tMin * camDirMC;
                    } else if (maxSamplePosInFrontOfPlane) {
                        tMax = t;
                        maxSamplePos = camPosMC + tMax * camDirMC;
                    }
                }
            }
        }
    }
}

vec4 getColorWhenCameraIsOutSideBox(vec3 groundPosMC) {
    vec4 color = vec4(1.0, 0.0, 0.0, 1.0); // Default color
    vec3 camDirMC = normalize(positionMC - camPosMC);
    float dot = dot(normalMC, camDirMC);
    if (dot > 0.0) {
        discard;
    }

    float distToGround = distance(camPosMC, groundPosMC);

    float tMin, tMax;
    bool isIntersect = intersectAABBox(camPosMC, camDirMC, tMin, tMax);
    if (tMin > distToGround) {
        discard;
    }
    tMin = max(tMin, 0.0); // Ensure tMin is not negative.
    if (tMax > distToGround) {
        tMax = distToGround;
    }
    vec3 minSamplePos = camPosMC + tMin * camDirMC;
    vec3 maxSamplePos = camPosMC + tMax * camDirMC;
    recalculateMinOrMaxSamplePositionWithCuttingPlane(minSamplePos, maxSamplePos, tMin, tMax, camPosMC, camDirMC);

    // calculate the distance from tMin to tMax.
    float segmentDist = distance(maxSamplePos, minSamplePos);

    color = vec4(0.0, 0.0, 0.0, 0.0);
    float increDist = segmentDist / 30.0;

    vec3 firstPosMC;
    if (!findFirstSamplePosition(minSamplePos, camDirMC, increDist, firstPosMC)) {
        discard;
    }

    //firstPosMC = minSamplePos;
    float dist = distance(firstPosMC, maxSamplePos);
    increDist = dist / float(u_samplingsCount);

    // sample from far to near.
    bool alphaSaturated = false;
    for (int i = 0; i < u_samplingsCount; i++) {
        vec3 samplePos = firstPosMC + camDirMC * increDist * float(i);
        if (samplePos.z < u_minBoxPosition.z) {
            continue;
        }
        vec3 texCoord3D = getTexCoord3DFromPositionMC(samplePos);

        // calculate the slice index.
        float value;
        getValue(texCoord3D, samplePos, value);
        vec4 colorCurrent = getColor(value);

        color.rgb += (1.0 - color.a) * colorCurrent.a * colorCurrent.rgb;
        color.a += (1.0 - color.a) * colorCurrent.a;

        if (color.a >= 0.95) {
            alphaSaturated = true;
            break;
        }
    }

    return color;
}

vec4 getColorWhenCameraIsInSideBox(vec3 groundPosMC) {
    vec4 color = vec4(1.0, 0.0, 0.0, 1.0); // Default color
    vec3 camDirMC = normalize(positionMC - camPosMC);
    float dot = dot(normalMC, camDirMC);
    if (dot < 0.0) {
        discard;
    }

    float distToGround = distance(camPosMC, groundPosMC);

    float tMin, tMax;
    bool isIntersect = intersectAABBox(camPosMC, camDirMC, tMin, tMax);
    if (tMin > distToGround) {
        discard;
    }
    tMin = max(tMin, 0.0); // Ensure tMin is not negative.
    if (tMax > distToGround) {
        tMax = distToGround;
    }

    // calculate the distance from tMin to tMax.
    vec3 minSamplePos = camPosMC; // here the camera is inside the box.
    vec3 maxSamplePos = camPosMC + tMax * camDirMC;
    recalculateMinOrMaxSamplePositionWithCuttingPlane(minSamplePos, maxSamplePos, tMin, tMax, camPosMC, camDirMC);

    float segmentDist = distance(maxSamplePos, minSamplePos);
    color = vec4(0.0, 0.0, 0.0, 0.0);
    float increDist = segmentDist / 30.0;

    vec3 firstPosMC;
    if (!findFirstSamplePosition(minSamplePos, camDirMC, increDist, firstPosMC)) {
        discard;
    }

    float dist = distance(firstPosMC, maxSamplePos);
    increDist = dist / float(u_samplingsCount);

    // sample from far to near.
    bool alphaSaturated = false;
    for (int i = 0; i < u_samplingsCount; i++) {
        vec3 samplePos = firstPosMC + camDirMC * increDist * float(i);
        if (samplePos.z < u_minBoxPosition.z) {
            continue;
        }
        vec3 texCoord3D = getTexCoord3DFromPositionMC(samplePos);

        // calculate the slice index.
        float value;
        getValue(texCoord3D, samplePos, value);
        vec4 colorCurrent = getColor(value);

        color.rgb += (1.0 - color.a) * colorCurrent.a * colorCurrent.rgb;
        color.a += (1.0 - color.a) * colorCurrent.a;

        if (color.a >= 0.95) {
            alphaSaturated = true;
            break;
        }
    }

    return color;
}

bool isBoxEdge(vec3 posMC) {
    // Check if the position is on the edge of the box.
    vec3 texCoord3d = getTexCoord3DFromPositionMC(posMC);
    float edgeThreshold = 0.002; // Adjust this value as needed.
    bool isEdgeX = (texCoord3d.x < edgeThreshold || texCoord3d.x > 1.0 - edgeThreshold);
    bool isEdgeY = (texCoord3d.y < edgeThreshold || texCoord3d.y > 1.0 - edgeThreshold);
    bool isEdgeZ = (texCoord3d.z < edgeThreshold || texCoord3d.z > 1.0 - edgeThreshold);

    int isEdgesCount = 0;
    if (isEdgeX) isEdgesCount++;
    if (isEdgeY) isEdgesCount++;
    if (isEdgeZ) isEdgesCount++;

    if (isEdgesCount > 1) {
        return true; // Not a single edge
    }

    return false;

}

bool isCuttingPlane(vec3 posMC) {
    if (u_AAPlaneNormalMC == 0) {
        return false; // No cutting plane
    }

    vec3 texCoord3d = getTexCoord3DFromPositionMC(posMC);
    float edgeThreshold = 0.002; // Adjust this value as needed.
    bool isEdgeX = (texCoord3d.x < edgeThreshold || texCoord3d.x > 1.0 - edgeThreshold);
    bool isEdgeY = (texCoord3d.y < edgeThreshold || texCoord3d.y > 1.0 - edgeThreshold);
    bool isEdgeZ = (texCoord3d.z < edgeThreshold || texCoord3d.z > 1.0 - edgeThreshold);

    //vec3 planeTexCoord3d = getTexCoord3DFromPositionMC(u_AAPlanePosMC);
    float maxSize = distance(u_maxBoxPosition, u_minBoxPosition);

    if (u_AAPlaneNormalMC == 1 || u_AAPlaneNormalMC == 4) {
        float diffPosX = abs(posMC.x - u_AAPlanePosMC.x);
        float edgeThreshold = maxSize * 0.001; // Adjust this value as needed.
        if (isEdgeY || isEdgeZ) {
            if (diffPosX < edgeThreshold) {
                return true; // Cutting plane in X direction
            }
        }
    } else if (u_AAPlaneNormalMC == 2 || u_AAPlaneNormalMC == 5) {
        float diffPosY = abs(posMC.y - u_AAPlanePosMC.y);
        float edgeThreshold = maxSize * 0.001; // Adjust this value as needed.
        if (isEdgeX || isEdgeZ) {
            if (diffPosY < edgeThreshold) {
                return true; // Cutting plane in Y direction
            }
        }
    } else if (u_AAPlaneNormalMC == 3 || u_AAPlaneNormalMC == 6) {
        float diffPosZ = abs(posMC.z - u_AAPlanePosMC.z);
        float edgeThreshold = maxSize * 0.001; // Adjust this value as needed.
        if (isEdgeX || isEdgeY) {
            if (diffPosZ < edgeThreshold) {
                return true; // Cutting plane in Z direction
            }
        }
    }

    return false;
}

bool isCuttingPlane_original(vec3 posMC) {
    if (u_AAPlaneNormalMC == 0) {
        return false; // No cutting plane
    }

    vec3 texCoord3d = getTexCoord3DFromPositionMC(posMC);
    float edgeThreshold = 0.002; // Adjust this value as needed.
    bool isEdgeX = (texCoord3d.x < edgeThreshold || texCoord3d.x > 1.0 - edgeThreshold);
    bool isEdgeY = (texCoord3d.y < edgeThreshold || texCoord3d.y > 1.0 - edgeThreshold);
    bool isEdgeZ = (texCoord3d.z < edgeThreshold || texCoord3d.z > 1.0 - edgeThreshold);

    vec3 planeTexCoord3d = getTexCoord3DFromPositionMC(u_AAPlanePosMC);

    if (u_AAPlaneNormalMC == 1 || u_AAPlaneNormalMC == 4) {
        float diffPosX = abs(texCoord3d.x - planeTexCoord3d.x);
        if (isEdgeY || isEdgeZ) {
            if (diffPosX < edgeThreshold * 10.0) {
                return true; // Cutting plane in X direction
            }
        }
    } else if (u_AAPlaneNormalMC == 2 || u_AAPlaneNormalMC == 5) {
        float diffPosY = abs(texCoord3d.y - planeTexCoord3d.y);
        if (isEdgeX || isEdgeZ) {
            if (diffPosY < edgeThreshold * 10.0) {
                return true; // Cutting plane in Y direction
            }
        }
    } else if (u_AAPlaneNormalMC == 3 || u_AAPlaneNormalMC == 6) {
        float diffPosZ = abs(texCoord3d.z - planeTexCoord3d.z);
        if (isEdgeX || isEdgeY) {
            if (diffPosZ < edgeThreshold * 10.0) {
                return true; // Cutting plane in Z direction
            }
        }
    }

    return false;
}

vec3 getDepthTexPositionMC() {
    vec2 screenTexCoord2 = gl_FragCoord.xy / czm_viewport.zw;
    float unpackDepth = czm_unpackDepth(texture(czm_globeDepthTexture, screenTexCoord2));
    vec4 clipPos;
    clipPos.xy = screenTexCoord2 * 2.0 - 1.0;
    clipPos.z = unpackDepth * 2.0 - 1.0;
    clipPos.w = 1.0;

    vec4 eyeCoords = czm_windowToEyeCoordinates(gl_FragCoord.xy, unpackDepth);
    eyeCoords /= eyeCoords.w;

    vec4 worldEyePos = czm_inverseView * eyeCoords;
    vec4 eyePosMC = czm_inverseModel * worldEyePos;
    return eyePosMC.xyz; // Return the position in model coordinates.
}

void main() {
    vec3 groundPosMC = getDepthTexPositionMC();
    if (isCuttingPlane(positionMC)) {
        float distToCamMC = distance(camPosMC, positionMC);
        float distGroundToCamMC = distance(camPosMC, groundPosMC);
        float alpha = 1.0;
        if (distToCamMC > distGroundToCamMC) {
            alpha = 0.2;
        }
        fragColor = vec4(0.9, 0.5, 0.5, alpha); // Default color
        return;
    }
    if (isBoxEdge(positionMC)) {
        float distToCamMC = distance(camPosMC, positionMC);
        float distGroundToCamMC = distance(camPosMC, groundPosMC);
        float alpha = 1.0;
        if (distToCamMC > distGroundToCamMC) {
            alpha = 0.2;
        }
        fragColor = vec4(0.5, 0.5, 0.5, alpha); // Default color
        return;
    }

    bool isCameraInsideBox = isPointInsideAABB(camPosMC, u_minBoxPosition, u_maxBoxPosition);
    if (isCameraInsideBox) {
        fragColor = getColorWhenCameraIsInSideBox(groundPosMC);
        return;
    }

    fragColor = getColorWhenCameraIsOutSideBox(groundPosMC);
}