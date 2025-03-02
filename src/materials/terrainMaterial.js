/**
 * Terrain material creation and management
 */
import config from '../config.js';

/**
 * Create terrain material
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {BABYLON.StandardMaterial} Created terrain material
 */
export function createTerrainMaterial(scene) {
    // Create a basic PBR material (for Phase 1, we'll use a simplified material)
    const material = new BABYLON.StandardMaterial("terrainMaterial", scene);
    
    // Set up basic material properties
    material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.3); // Base grass color
    material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specularity
    material.specularPower = 64; // Sharp specular highlights
    material.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Ambient light contribution
    
    // Implement a basic vertex shader for terrain
    const vertexShader = getTerrainVertexShader();
    const fragmentShader = getTerrainFragmentShader();
    
    // In Phase 1, we'll skip custom shader implementation and use the standard material
    // In Phase 2, we'll implement the shader-based material
    
    // Note: Alternatively, we could use a PBR material for better visual quality
    // const material = new BABYLON.PBRMaterial("terrainMaterial", scene);
    // material.metallic = 0.0;
    // material.roughness = 0.9;
    
    return material;
}

/**
 * Create shader-based terrain material (to be implemented in Phase 2)
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {BABYLON.ShaderMaterial} Created shader material
 */
export function createShaderTerrainMaterial(scene) {
    // This is a placeholder for Phase 2
    // We'll implement a custom shader-based material in Phase 2
    
    // For now, we'll create a simple shader material for reference
    const shaderMaterial = new BABYLON.ShaderMaterial(
        "terrainShaderMaterial",
        scene,
        {
            vertex: "terrain",
            fragment: "terrain",
        },
        {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
        }
    );
    
    // Set up basic parameters for the shader
    shaderMaterial.setFloat("maxHeight", config.terrain.maxHeight);
    shaderMaterial.setColor3("grassColor", new BABYLON.Color3(0.4, 0.6, 0.3));
    shaderMaterial.setColor3("rockColor", new BABYLON.Color3(0.5, 0.5, 0.5));
    shaderMaterial.setColor3("snowColor", new BABYLON.Color3(0.95, 0.95, 0.95));
    
    return shaderMaterial;
}

/**
 * Get terrain vertex shader code
 * @returns {string} Vertex shader code
 */
function getTerrainVertexShader() {
    // This will be implemented in Phase 2
    // For now, we just return a placeholder
    return `
    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    // Uniforms
    uniform mat4 world;
    uniform mat4 worldViewProjection;

    // Varying
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUV;

    void main(void) {
        gl_Position = worldViewProjection * vec4(position, 1.0);
        
        vPosition = (world * vec4(position, 1.0)).xyz;
        vNormal = (world * vec4(normal, 0.0)).xyz;
        vUV = uv;
    }
    `;
}

/**
 * Get terrain fragment shader code
 * @returns {string} Fragment shader code
 */
function getTerrainFragmentShader() {
    // This will be implemented in Phase 2
    // For now, we just return a placeholder
    return `
    precision highp float;

    // Uniforms
    uniform float maxHeight;
    uniform vec3 grassColor;
    uniform vec3 rockColor;
    uniform vec3 snowColor;

    // Varying
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUV;

    void main(void) {
        // Calculate height ratio (0 at bottom, 1 at maxHeight)
        float heightRatio = vPosition.y / maxHeight;
        
        // Simple height-based color blending
        vec3 color = grassColor;
        
        // Blend with rock color at higher elevations
        if (heightRatio > 0.3) {
            color = mix(grassColor, rockColor, smoothstep(0.3, 0.5, heightRatio));
        }
        
        // Blend with snow at highest elevations
        if (heightRatio > 0.7) {
            color = mix(rockColor, snowColor, smoothstep(0.7, 0.9, heightRatio));
        }
        
        // Output final color
        gl_FragColor = vec4(color, 1.0);
    }
    `;
}
