/**
 * Properly fixed shader-based terrain material for Infinite Horizons
 * This implements procedural materials entirely through GLSL shaders
 */
import config from '../config.js';

/**
 * Create a shader-based terrain material
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {BABYLON.ShaderMaterial} The created shader material
 */
export function createShaderTerrainMaterial(scene) {
    // Get the shader code directly
    const vertexShaderCode = getVertexShaderCode();
    const fragmentShaderCode = getFragmentShaderCode();
    
    // Create a shader material with inline shader code
    const shaderMaterial = new BABYLON.ShaderMaterial(
        "terrainShaderMaterial",
        scene,
        {
            vertex: 'terrainVertex',
            fragment: 'terrainFragment',
        },
        {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world", "worldView", "worldViewProjection", 
                "view", "projection", "maxHeight"
            ]
        }
    );

    // Add the actual shader code using BABYLON.Effect
    BABYLON.Effect.ShadersStore["terrainVertexShader"] = vertexShaderCode;
    BABYLON.Effect.ShadersStore["terrainFragmentShader"] = fragmentShaderCode;
    
    // Set initial shader parameters 
    shaderMaterial.setFloat("maxHeight", config.terrain.maxHeight);
    
    // Set material parameters for biomes
    // Grass biome
    shaderMaterial.setColor3("grassColor", new BABYLON.Color3(0.3, 0.5, 0.2));
    shaderMaterial.setColor3("grassColorVariation", new BABYLON.Color3(0.1, 0.1, 0.05));
    shaderMaterial.setFloat("grassRoughness", 0.8);
    
    // Rock biome
    shaderMaterial.setColor3("rockColor", new BABYLON.Color3(0.5, 0.45, 0.4));
    shaderMaterial.setColor3("rockColorVariation", new BABYLON.Color3(0.1, 0.1, 0.1));
    shaderMaterial.setFloat("rockRoughness", 0.9);
    
    // Snow biome
    shaderMaterial.setColor3("snowColor", new BABYLON.Color3(0.9, 0.9, 0.95));
    shaderMaterial.setColor3("snowColorVariation", new BABYLON.Color3(0.05, 0.05, 0.05));
    shaderMaterial.setFloat("snowRoughness", 0.7);
    
    // Sand biome
    shaderMaterial.setColor3("sandColor", new BABYLON.Color3(0.76, 0.7, 0.5));
    shaderMaterial.setColor3("sandColorVariation", new BABYLON.Color3(0.1, 0.1, 0.05));
    shaderMaterial.setFloat("sandRoughness", 0.6);
    
    // Material boundaries
    shaderMaterial.setFloat("snowHeight", 0.75); // Where snow begins
    shaderMaterial.setFloat("rockHeight", 0.4);  // Where rock begins
    shaderMaterial.setFloat("sandHeight", 0.1);  // Where sand begins
    
    // Slopes
    shaderMaterial.setFloat("steepSlopeThreshold", 0.5); // Above this slope value, use rock material
    shaderMaterial.setFloat("slopeSmoothness", 0.1);    // Transition smoothness between slope materials
    
    // Noise parameters
    shaderMaterial.setFloat("globalNoiseScale", 0.01);  // Global scale for all noise
    shaderMaterial.setFloat("detailNoiseScale", 50.0);  // Detail noise scale
    shaderMaterial.setFloat("noiseIntensity", 0.1);     // Intensity of noise effect on colors
    
    // Material blending
    shaderMaterial.setFloat("materialBlendSharpness", 10.0); // Higher values = sharper transitions
    
    // Lighting parameters
    shaderMaterial.setFloat("ambientIntensity", 0.3);   // Ambient light intensity
    shaderMaterial.setVector3("sunDirection", new BABYLON.Vector3(-0.5, -0.6, 0.3).normalize());
    shaderMaterial.setColor3("sunColor", new BABYLON.Color3(1.0, 0.9, 0.7)); // Warm sunlight
    
    // Backface culling for performance
    shaderMaterial.backFaceCulling = true;
    
    // Disable alpha blending (fully opaque)
    shaderMaterial.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
    
    // Update parameters from scene lighting
    scene.onBeforeRenderObservable.add(() => {
        // Find directional light to use as sun
        const sunLight = scene.lights.find(light => 
            light instanceof BABYLON.DirectionalLight);
        
        if (sunLight) {
            shaderMaterial.setVector3("sunDirection", sunLight.direction.normalize());
            shaderMaterial.setColor3("sunColor", sunLight.diffuse);
        }
    });
    
    return shaderMaterial;
}

/**
 * Get the vertex shader code
 * @returns {string} Vertex shader code
 */
function getVertexShaderCode() {
    return `
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
    `;
}

/**
 * Get the fragment shader code
 * @returns {string} Fragment shader code
 */
function getFragmentShaderCode() {
    return `
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
    `;
}

/**
 * Updates shader material parameters from UI controls
 * @param {BABYLON.ShaderMaterial} material - The shader material to update
 * @param {Object} parameters - Object containing parameter values
 */
export function updateShaderParameters(material, parameters) {
    // Update color parameters
    if (parameters.grassColor) {
        material.setColor3("grassColor", BABYLON.Color3.FromHexString(parameters.grassColor));
    }
    
    if (parameters.rockColor) {
        material.setColor3("rockColor", BABYLON.Color3.FromHexString(parameters.rockColor));
    }
    
    if (parameters.snowColor) {
        material.setColor3("snowColor", BABYLON.Color3.FromHexString(parameters.snowColor));
    }
    
    if (parameters.sandColor) {
        material.setColor3("sandColor", BABYLON.Color3.FromHexString(parameters.sandColor));
    }
    
    // Update height parameters
    if (parameters.snowHeight !== undefined) {
        material.setFloat("snowHeight", parameters.snowHeight);
    }
    
    if (parameters.rockHeight !== undefined) {
        material.setFloat("rockHeight", parameters.rockHeight);
    }
    
    if (parameters.sandHeight !== undefined) {
        material.setFloat("sandHeight", parameters.sandHeight);
    }
    
    // Update slope parameters
    if (parameters.steepSlopeThreshold !== undefined) {
        material.setFloat("steepSlopeThreshold", parameters.steepSlopeThreshold);
    }
    
    if (parameters.slopeSmoothness !== undefined) {
        material.setFloat("slopeSmoothness", parameters.slopeSmoothness);
    }
    
    // Update noise parameters
    if (parameters.globalNoiseScale !== undefined) {
        material.setFloat("globalNoiseScale", parameters.globalNoiseScale);
    }
    
    if (parameters.detailNoiseScale !== undefined) {
        material.setFloat("detailNoiseScale", parameters.detailNoiseScale);
    }
    
    if (parameters.noiseIntensity !== undefined) {
        material.setFloat("noiseIntensity", parameters.noiseIntensity);
    }
    
    // Update material blending
    if (parameters.materialBlendSharpness !== undefined) {
        material.setFloat("materialBlendSharpness", parameters.materialBlendSharpness);
    }
}

/**
 * Save current material parameters to localStorage
 * @param {BABYLON.ShaderMaterial} material - The shader material
 * @param {string} presetName - Optional name for the preset
 */
export function saveMaterialPreset(material, presetName = "default") {
    const preset = {
        // Colors
        grassColor: material.getColor3("grassColor").toHexString(),
        rockColor: material.getColor3("rockColor").toHexString(),
        snowColor: material.getColor3("snowColor").toHexString(),
        sandColor: material.getColor3("sandColor").toHexString(),
        
        // Heights
        snowHeight: material.getFloat("snowHeight"),
        rockHeight: material.getFloat("rockHeight"),
        sandHeight: material.getFloat("sandHeight"),
        
        // Slopes
        steepSlopeThreshold: material.getFloat("steepSlopeThreshold"),
        slopeSmoothness: material.getFloat("slopeSmoothness"),
        
        // Noise
        globalNoiseScale: material.getFloat("globalNoiseScale"),
        detailNoiseScale: material.getFloat("detailNoiseScale"),
        noiseIntensity: material.getFloat("noiseIntensity"),
        
        // Blending
        materialBlendSharpness: material.getFloat("materialBlendSharpness")
    };
    
    // Save to localStorage
    const key = `infiniteHorizons_materialPreset_${presetName}`;
    localStorage.setItem(key, JSON.stringify(preset));
    
    return preset;
}

/**
 * Load material parameters from localStorage
 * @param {BABYLON.ShaderMaterial} material - The shader material
 * @param {string} presetName - Name of the preset to load
 * @returns {boolean} True if preset was loaded successfully
 */
export function loadMaterialPreset(material, presetName = "default") {
    const key = `infiniteHorizons_materialPreset_${presetName}`;
    const presetJson = localStorage.getItem(key);
    
    if (presetJson) {
        try {
            const preset = JSON.parse(presetJson);
            updateShaderParameters(material, preset);
            return true;
        } catch (e) {
            console.error("Error loading material preset:", e);
            return false;
        }
    }
    
    return false;
}

/**
 * Get predefined material presets
 * @returns {Object} Object containing predefined material presets
 */
export function getPredefinedPresets() {
    return {
        default: {
            grassColor: "#4C8033",
            rockColor: "#7F7267",
            snowColor: "#E6E6F2",
            sandColor: "#C2B280",
            snowHeight: 0.75,
            rockHeight: 0.4,
            sandHeight: 0.1,
            steepSlopeThreshold: 0.5,
            slopeSmoothness: 0.1,
            globalNoiseScale: 0.01,
            detailNoiseScale: 50.0,
            noiseIntensity: 0.1,
            materialBlendSharpness: 10.0
        },
        desert: {
            grassColor: "#7D9C42",
            rockColor: "#B39169",
            snowColor: "#F2E5D3",
            sandColor: "#D2B48C",
            snowHeight: 0.8,
            rockHeight: 0.5,
            sandHeight: 0.0,
            steepSlopeThreshold: 0.6,
            slopeSmoothness: 0.1,
            globalNoiseScale: 0.008,
            detailNoiseScale: 70.0,
            noiseIntensity: 0.15,
            materialBlendSharpness: 5.0
        },
        alpine: {
            grassColor: "#567D46",
            rockColor: "#6F6F6F",
            snowColor: "#FFFFFF",
            sandColor: "#A9A088",
            snowHeight: 0.6,
            rockHeight: 0.3,
            sandHeight: 0.15,
            steepSlopeThreshold: 0.45,
            slopeSmoothness: 0.15,
            globalNoiseScale: 0.012,
            detailNoiseScale: 60.0,
            noiseIntensity: 0.08,
            materialBlendSharpness: 12.0
        },
        volcanic: {
            grassColor: "#3B5323",
            rockColor: "#3F3F3F",
            snowColor: "#D3D3D3",
            sandColor: "#595959",
            snowHeight: 0.85,
            rockHeight: 0.25,
            sandHeight: 0.05,
            steepSlopeThreshold: 0.4,
            slopeSmoothness: 0.08,
            globalNoiseScale: 0.015,
            detailNoiseScale: 40.0,
            noiseIntensity: 0.12,
            materialBlendSharpness: 15.0
        }
    };
}