precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;
uniform mat4 view;
uniform float maxHeight;

// Varying - passed to fragment shader
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vHeight;
varying float vSlope;
varying vec3 vWorldPosition;

void main(void) {
    // Transform position to clip space
    gl_Position = worldViewProjection * vec4(position, 1.0);
    
    // Transform position to world space
    vec4 worldPos = world * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    vWorldPosition = worldPos.xyz;
    
    // Transform normal to world space
    vNormal = normalize((world * vec4(normal, 0.0)).xyz);
    
    // Pass UV coordinates
    vUV = uv;
    
    // Calculate height ratio (0 at bottom, 1 at maxHeight)
    vHeight = position.y / maxHeight;
    
    // Calculate slope (0 for flat ground, 1 for vertical)
    vSlope = 1.0 - vNormal.y;  // y component of normal indicates vertical alignment
}
