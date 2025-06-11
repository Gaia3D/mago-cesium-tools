float unpackDepth(const in vec4 rgba_depth) {
    return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getTerrainHeight(vec2 texCoord) {
    return unpackDepth(texture(u_terrain, texCoord)) * u_max_height;
}

float getWaterHeight(vec2 texCoord) {
    return unpackDepth(texture(u_water, texCoord)) * u_max_height;
}

float getFlux(vec2 texCoord) {
    return unpackDepth(texture(u_flux, texCoord)) * u_max_height;
}

vec2 decodeVelocity(in vec2 encodedVel) {
    return vec2(encodedVel.xy * 2.0 - 1.0);
}

vec2 getVelocity(vec2 texCoord) {
    vec4 encodedVel = texture(u_flux, texCoord);
    vec2 velocity = decodeVelocity(encodedVel.xy);
    return velocity;
}

/*float getBuildingHeight(vec2 texCoord) {
    return texture(u_building, texCoord).z * 255.0;
}*/


vec3 calculateWaterSurfaceNormal(in VertexInput vsInput) {
    float divX = 1.0 / u_grid_size;
    float divY = 1.0 / u_grid_size;
    float cellSize = u_grid_size;
    vec2 texCoord = vec2(vsInput.attributes.texCoord_0);
    vec2 texCooordRight = texCoord + vec2(divX, 0.0);
    vec2 texCooordTop = texCoord + vec2(0.0, divY);

    float currentHeight = getWaterHeight(texCoord) + getTerrainHeight(texCoord);
    float rightHeight = getWaterHeight(texCooordRight) + getTerrainHeight(texCooordRight);
    float topHeight = getWaterHeight(texCooordTop) + getTerrainHeight(texCooordTop);

    vec3 p0 = vec3(vsInput.attributes.positionMC.x, currentHeight, vsInput.attributes.positionMC.z);
    vec3 p1 = vec3(vsInput.attributes.positionMC.x + 1.0, rightHeight, vsInput.attributes.positionMC.z);
    vec3 p2 = vec3(vsInput.attributes.positionMC.x, topHeight, vsInput.attributes.positionMC.z + 1.0);

    vec3 v0 = p1 - p0;
    vec3 v1 = p2 - p0;
    return normalize(cross(v1, v0));
}

float getCliffWaterHeight(vec2 texCoord) {
    vec2 texCoordRight = texCoord + vec2(1.0 / u_grid_size, 0.0);
    vec2 texCoordTop = texCoord + vec2(0.0, 1.0 / u_grid_size);
    vec2 texCoordLeft = texCoord + vec2(-1.0 / u_grid_size, 0.0);
    vec2 texCoordBottom = texCoord + vec2(0.0, -1.0 / u_grid_size);
    vec2 texCoordRightTop = texCoord + vec2(1.0 / u_grid_size, 1.0 / u_grid_size);
    vec2 texCoordLeftTop = texCoord + vec2(-1.0 / u_grid_size, 1.0 / u_grid_size);
    vec2 texCoordRightBottom = texCoord + vec2(1.0 / u_grid_size, -1.0 / u_grid_size);
    vec2 texCoordLeftBottom = texCoord + vec2(-1.0 / u_grid_size, -1.0 / u_grid_size);

    float currentWaterHeight = getWaterHeight(texCoord);
    float rightWaterHeight = getWaterHeight(texCoordRight);
    float topWaterHeight = getWaterHeight(texCoordTop);
    float leftWaterHeight = getWaterHeight(texCoordLeft);
    float bottomWaterHeight = getWaterHeight(texCoordBottom);
    float rightTopWaterHeight = getWaterHeight(texCoordRightTop);
    float leftTopWaterHeight = getWaterHeight(texCoordLeftTop);
    float rightBottomWaterHeight = getWaterHeight(texCoordRightBottom);
    float leftBottomWaterHeight = getWaterHeight(texCoordLeftBottom);

    float currentTerrainHeight = getTerrainHeight(texCoord);
    float rightTerrainHeight = getTerrainHeight(texCoordRight);
    float topTerrainHeight = getTerrainHeight(texCoordTop);
    float leftTerrainHeight = getTerrainHeight(texCoordLeft);
    float bottomTerrainHeight = getTerrainHeight(texCoordBottom);
    float rightTopTerrainHeight = getTerrainHeight(texCoordRightTop);
    float leftTopTerrainHeight = getTerrainHeight(texCoordLeftTop);
    float rightBottomTerrainHeight = getTerrainHeight(texCoordRightBottom);
    float leftBottomTerrainHeight = getTerrainHeight(texCoordLeftBottom);

    float currentTotalHeight = currentWaterHeight + currentTerrainHeight;
    float rightTotalHeight = rightWaterHeight + rightTerrainHeight;
    float topTotalHeight = topWaterHeight + topTerrainHeight;
    float leftTotalHeight = leftWaterHeight + leftTerrainHeight;
    float bottomTotalHeight = bottomWaterHeight + bottomTerrainHeight;
    float rightTopTotalHeight = rightTopWaterHeight + rightTopTerrainHeight;
    float leftTopTotalHeight = leftTopWaterHeight + leftTopTerrainHeight;
    float rightBottomTotalHeight = rightBottomWaterHeight + rightBottomTerrainHeight;
    float leftBottomTotalHeight = leftBottomWaterHeight + leftBottomTerrainHeight;

    float highestNeighborTotalHeight = u_max_height;
    if (rightTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, rightTotalHeight);
    }

    if (topTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, topTotalHeight);
    }

    if (leftTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, leftTotalHeight);
    }

    if (bottomTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, bottomTotalHeight);
    }

    if (rightTopTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, rightTopTotalHeight);
    }

    if (leftTopTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, leftTopTotalHeight);
    }

    if (rightBottomTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, rightBottomTotalHeight);
    }

    if (leftBottomTotalHeight < currentTotalHeight) {
        highestNeighborTotalHeight = min(highestNeighborTotalHeight, leftBottomTotalHeight);
    }

    float diffHeight = currentTerrainHeight - highestNeighborTotalHeight;
    float waterHeight = currentWaterHeight - diffHeight;
    if (highestNeighborTotalHeight == u_max_height) {
        waterHeight = currentWaterHeight;
    }
    return waterHeight;
}

void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
    vec2 texCoord = vec2(vsInput.attributes.texCoord_0);
    float terrainHeight = getTerrainHeight(texCoord);
    float waterHeight = getWaterHeight(texCoord);
    float tempWaterHeight = waterHeight;

    if (tempWaterHeight <= 0.001) {
        tempWaterHeight = getCliffWaterHeight(texCoord);
    }

    v_texCoord = texCoord;
    v_normal = calculateWaterSurfaceNormal(vsInput);
    //v_normal_texture = getNormalTexture(texCoord * 16.0) ;

    v_water_height = waterHeight;
    v_temp_water_height = tempWaterHeight;
    v_flux_value = getVelocity(texCoord);
    v_water_color = u_water_color;

    vsOutput.positionMC = vsInput.attributes.positionMC + vec3(-(u_grid_size / 2.0), terrainHeight + waterHeight, + (u_grid_size / 2.0));

    float margin = (1.0 / u_grid_size);
    bool isSkirt = u_water_skirt;
    bool isBorder = v_texCoord.x <= (0.0) || v_texCoord.x >= (1.0 - margin) || v_texCoord.y <= (0.0) || v_texCoord.y >= (1.0 - margin);
    if (isSkirt && isBorder) {
        //vsOutput.positionMC = vsInput.attributes.positionMC + vec3(-(u_grid_size / 2.0), terrainHeight, + (u_grid_size / 2.0));
        vsOutput.positionMC = vsInput.attributes.positionMC + vec3(0.0, terrainHeight - u_height_offset, 0.0);
    } else {
        //vsOutput.positionMC = vsInput.attributes.positionMC + vec3(-(u_grid_size / 2.0), terrainHeight + waterHeight, + (u_grid_size / 2.0));
        vsOutput.positionMC = vsInput.attributes.positionMC + vec3(0.0, terrainHeight + waterHeight - u_height_offset, 0.0);
    }
}