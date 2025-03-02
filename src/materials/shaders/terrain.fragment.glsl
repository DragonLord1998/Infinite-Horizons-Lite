precision highp float;

// Uniforms
uniform vec3 grassColor;
uniform vec3 rockColor;
uniform vec3 snowColor;

// Varying
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vHeight;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Simple noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main(void) {
    // Calculate slope based on normal
    float slope = 1.0 - vNormal.y; // 0 on flat ground, 1 on vertical surfaces
    
    // Generate noise for texture variation
    float noiseValue = noise(vUV * 50.0);
    
    // Base grass color with noise variation
    vec3 baseColor = grassColor + vec3(noiseValue * 0.1 - 0.05);
    
    // Blend rock on steep slopes
    if (slope > 0.2) {
        baseColor = mix(baseColor, rockColor, smoothstep(0.2, 0.5, slope));
    }
    
    // Blend snow at high elevations
    if (vHeight > 0.7) {
        baseColor = mix(baseColor, snowColor, smoothstep(0.7, 0.9, vHeight));
        
        // Less snow on steep slopes
        baseColor = mix(baseColor, rockColor, smoothstep(0.3, 0.6, slope) * vHeight);
    }
    
    // Apply simple lighting
    float lightIntensity = max(0.3, dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))));
    
    // Output final color
    gl_FragColor = vec4(baseColor * lightIntensity, 1.0);
}
