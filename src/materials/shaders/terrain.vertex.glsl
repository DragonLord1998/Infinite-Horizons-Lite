precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;
uniform float maxHeight;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vHeight;

void main(void) {
    // Transform the vertex position
    gl_Position = worldViewProjection * vec4(position, 1.0);
    
    // Pass position to fragment shader in world space
    vPosition = (world * vec4(position, 1.0)).xyz;
    
    // Pass normal to fragment shader in world space
    vNormal = normalize((world * vec4(normal, 0.0)).xyz);
    
    // Pass UV coordinates
    vUV = uv;
    
    // Pass normalized height for material blending
    vHeight = position.y / maxHeight;
}
