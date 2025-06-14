float minimum = 0.01;
float maximum = 0.3;

vec3 interpolateHeightMapColor(float waterHeight) {
    if (waterHeight > 300.0) {
        return vec3(0.0, 0.0, 0.0);
    } else if (waterHeight > 200.0) {
        return vec3(0.5, 0.0, 0.0);
    } else if (waterHeight > 150.0) {
        return vec3(1.0, 0.0, 0.0);
    } else if (waterHeight > 100.0) {
        return vec3(1.0, 0.5, 0.0);
    } else if (waterHeight > 75.0) {
        return vec3(1.0, 1.0, 0.0);
    } else if (waterHeight > 50.0) {
        return vec3(0.5, 1.0, 0.0);
    } else if (waterHeight > 25.0) {
        return vec3(0.0, 1.0, 0.0);
    } else if (waterHeight > 12.0) {
        return vec3(0.0, 1.0, 0.5);
    } else if (waterHeight > 6.0) {
        return vec3(0.0, 1.0, 1.0);
    } else if (waterHeight > 3.0) {
        return vec3(0.0, 0.5, 1.0);
    } else if (waterHeight > 1.0) {
        return vec3(0.0, 0.0, 1.0);
    } else if (waterHeight > 0.1) {
        return vec3(0.0, 0.0, 0.66);
    } else if (waterHeight > 0.01) {
        return vec3(0.0, 0.0, 0.45);
    } else if (waterHeight > 0.001) {
        return vec3(0.0, 0.0, 0.33);
    } else if (waterHeight > 0.0) {
        return vec3(0.105, 0.105, 0.105);
    } else {
        return vec3(0.1, 0.1, 0.1);
    }
}

float interpolateAlpha(float waterHeight) {
    float minimum = 0.01;
    float maximum = 0.5;
    float intensity = u_color_intensity;
    float maximumOpacity = u_max_opacity;

    maximum = min(maximumOpacity, maximum * intensity);

    float scaledValue = waterHeight / (u_max_height / 1000.0) * intensity;

    float value = min(maximum, max(minimum, scaledValue));
    return value;
}

void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
    //vec3 norTex = getNormalTexture(v_texCoord * 64.0);

    //material.diffuse = vec3(0.0);
    //material.emissive = vec3(0.0);
    //material.roughness = 0.1;
    //material.occlusion = 1.0;
    //material.specular = vec3(0.02);

    vec3 color;
    bool isCompare = gl_FragCoord.x >= 1280.0;
    if (u_height_palette) {
        color = interpolateHeightMapColor(v_water_height);
        if (v_water_height != v_temp_water_height) {
            color = interpolateHeightMapColor(0.0);
        }
        material.alpha = 0.75;
        material.roughness = 1.0;
    } else {
        color = v_water_color * u_water_brightness;
        material.alpha = interpolateAlpha(v_water_height);
        //color = color * (norTex * 0.5 + 0.5);
        //color = color;
        if (v_water_height != v_temp_water_height) {
            material.alpha = interpolateAlpha(0.0);
        }
        material.roughness = 0.1;
    }

    float margin = (1.0 / u_grid_size);
    if (v_texCoord.x <= (0.0 + margin) || v_texCoord.x >= (1.0 - margin * 2.0) || v_texCoord.y <= (0.0 + margin) || v_texCoord.y >= (1.0 - margin * 2.0)) {
        material.diffuse = color * 0.5;
        material.alpha = material.alpha * 0.5;
        material.normalEC = czm_normal * v_normal;
    } else {
        material.diffuse = color;
        material.normalEC = czm_normal * v_normal;
    }
}