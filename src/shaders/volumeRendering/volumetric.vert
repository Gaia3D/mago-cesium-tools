#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
uniform vec4 u_camPosWC;

out vec3 positionMC; // Output variable for model coordinates.
out vec3 camPosMC; // Output variable for camera position in model coordinates.

out vec3 normalMC;

void main() {
    // Convert the input position to model coordinates.
    positionMC = position;
    normalMC = normal;

    // Convert the camera position to model coordinates.
    camPosMC = (czm_inverseModel * vec4(u_camPosWC.xyz, 1.0)).xyz;
    gl_Position = czm_modelViewProjection * vec4(position, 1.0);
}