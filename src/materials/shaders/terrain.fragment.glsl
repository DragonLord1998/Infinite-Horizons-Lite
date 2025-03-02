precision highp float;

// Uniforms for material colors and properties
uniform vec3 grassColor;
uniform vec3 rockColor;
uniform vec3 snowColor;
uniform vec3 sandColor;
uniform vec3 grassColorVariation;
uniform vec3 rockColorVariation;
uniform vec3 snowColorVariation;
uniform vec3 sandColorVariation;
uniform float grassRoughness;
uniform float rockRoughness;
uniform float snowRoughness;
uniform float sandRoughness;

// Uniforms for biome transitions
uniform float snowHeight;
uniform float rockHeight;
uniform float sandHeight;

// Uniforms for slope-based materials
uniform float steepSlopeThreshold;
uniform float slopeSmoothness;

// Uniforms for noise
uniform float globalNoiseScale;
uniform float detailNoiseScale;
uniform float noiseIntensity;

// Uniforms for material blending
uniform float materialBlendSharpness;

// Uniforms for lighting
uniform float ambientIntensity;
uniform vec3 sunDirection;
uniform vec3 sunColor;

// Varying - passed from vertex shader
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUV;
varying float vHeight;
varying float vSlope;
varying vec3 vWorldPosition;

// Hash function for random values
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// 2D Value noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // Four corners of cell
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // Mix the four corners
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion (multiple octaves of noise)
float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float sum = 0.0;
    
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        
        value += amplitude * noise(p * frequency);
        sum += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value / sum;
}

// Domain warping for more natural noise
float warpedNoise(vec2 p, float scale) {
    // Calculate warp offsets
    float offsetX = noise(p * 0.5) * 2.0 - 1.0;
    float offsetY = noise((p + vec2(100.0, 100.0)) * 0.5) * 2.0 - 1.0;
    
    // Apply warp
    vec2 warped = p + vec2(offsetX, offsetY) * scale;
    
    // Sample noise at warped position
    return fbm(warped, 4);
}

// Smoothstep with adjustable sharpness
float smootherstep(float edge0, float edge1, float x, float sharpness) {
    // Constrain to [0,1]
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    // Apply modified power function for custom sharpness
    return pow(x, sharpness) / (pow(x, sharpness) + pow(1.0 - x, sharpness));
}

void main(void) {
    // Calculate world position with global scale
    vec2 worldPos = vWorldPosition.xz * globalNoiseScale;
    
    // Generate detail noise for color variation
    float detailNoise = noise(vUV * detailNoiseScale) * noiseIntensity;
    
    // Generate larger scale noise for material variations
    float largeScaleNoise = warpedNoise(worldPos, 1.0);
    
    // Create composite noise value
    float noiseValue = detailNoise + largeScaleNoise * 0.3;
    
    // Base material color (default to grass)
    vec3 baseColor = grassColor + grassColorVariation * (2.0 * noiseValue - 1.0);
    float roughness = grassRoughness;
    
    // Calculate slope factor with steepness threshold
    float slopeFactor = smootherstep(
        steepSlopeThreshold - slopeSmoothness, 
        steepSlopeThreshold + slopeSmoothness, 
        vSlope, 
        materialBlendSharpness
    );
    
    // Calculate height factors for different materials
    float snowFactor = smootherstep(
        snowHeight - 0.05, 
        snowHeight + 0.05, 
        vHeight - vSlope * 0.2, 
        materialBlendSharpness
    );
    
    float rockFactor = smootherstep(
        rockHeight - 0.05, 
        rockHeight + 0.05, 
        vHeight, 
        materialBlendSharpness
    ) * (1.0 - snowFactor);
    
    float sandFactor = smootherstep(
        sandHeight + 0.05, 
        sandHeight - 0.05, 
        vHeight, 
        materialBlendSharpness
    ) * (1.0 - rockFactor) * (1.0 - snowFactor);
    
    // Calculate final material weights
    float grassWeight = (1.0 - slopeFactor) * (1.0 - rockFactor) * (1.0 - snowFactor) * (1.0 - sandFactor);
    float rockSlopeWeight = slopeFactor * (1.0 - snowFactor);
    float rockHeightWeight = rockFactor * (1.0 - snowFactor) * (1.0 - slopeFactor);
    float snowWeight = snowFactor;
    float sandWeight = sandFactor;
    
    // Rock can appear either due to height or slope
    float totalRockWeight = rockSlopeWeight + rockHeightWeight;
    
    // Apply noise variation to each material
    vec3 grassVariation = grassColorVariation * (2.0 * noiseValue - 1.0);
    vec3 rockVariation = rockColorVariation * (2.0 * noiseValue - 1.0);
    vec3 snowVariation = snowColorVariation * (2.0 * noiseValue - 1.0);
    vec3 sandVariation = sandColorVariation * (2.0 * noiseValue - 1.0);
    
    // Calculate material colors
    vec3 finalGrassColor = grassColor + grassVariation;
    vec3 finalRockColor = rockColor + rockVariation;
    vec3 finalSnowColor = snowColor + snowVariation;
    vec3 finalSandColor = sandColor + sandVariation;
    
    // Blend materials together
    vec3 materialColor = 
        finalGrassColor * grassWeight + 
        finalRockColor * totalRockWeight + 
        finalSnowColor * snowWeight +
        finalSandColor * sandWeight;
    
    // Blend roughness values
    roughness = 
        grassRoughness * grassWeight + 
        rockRoughness * totalRockWeight + 
        snowRoughness * snowWeight +
        sandRoughness * sandWeight;
    
    // Apply lighting model
    // 1. Directional light (sun)
    float NdotL = max(0.0, dot(vNormal, -sunDirection));
    vec3 directionalLight = sunColor * NdotL;
    
    // 2. Ambient light
    vec3 ambientLight = vec3(ambientIntensity);
    
    // 3. Apply roughness effect to lighting
    vec3 diffuseLight = ambientLight + directionalLight * (1.0 - roughness * 0.5);
    
    // Combine material and lighting
    vec3 finalColor = materialColor * diffuseLight;
    
    // Apply a subtle rim lighting effect
    float rimFactor = 1.0 - max(0.0, dot(vNormal, normalize(vec3(0.0, 0.0, 1.0))));
    finalColor += sunColor * pow(rimFactor, 4.0) * 0.2;
    
    // Set final fragment color
    gl_FragColor = vec4(finalColor, 1.0);
}
