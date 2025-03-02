/**
 * Enhanced standard terrain material creation and management
 * This version uses Babylon.js built-in materials with no external files
 */
import config from '../config.js';

/**
 * Create terrain material
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {BABYLON.PBRMaterial} Created terrain material
 */
export function createTerrainMaterial(scene) {
    // Create a PBR material for better visual quality
    const material = new BABYLON.PBRMaterial("terrainMaterial", scene);
    
    // Set up material properties
    material.metallic = 0.0;         // Non-metallic surface
    material.roughness = 0.9;        // Rough surface like natural terrain
    material.albedoColor = new BABYLON.Color3(0.4, 0.6, 0.3); // Base grass color
    material.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Ambient light contribution
    
    // Add micro-surface variation for a more natural look
    material.microSurface = 0.95;
    
    // Use vertex colors for height-based coloring
    material.useVertexColors = true;
    
    // Create a procedural texture for extra detail (optional)
    try {
        // Create a noise procedural texture for terrain detail
        const noiseTexture = new BABYLON.NoiseProceduralTexture("terrainNoise", 256, scene);
        noiseTexture.octaves = 4;
        noiseTexture.persistence = 0.7;
        noiseTexture.animationSpeedFactor = 0; // Static noise
        noiseTexture.brightness = 0.7;
        noiseTexture.uploadState();
        
        // Use noise as bump map for extra detail
        material.bumpTexture = noiseTexture;
        material.bumpTexture.level = 0.4; // Adjust bump strength
        
        // Use noise to add some roughness variation
        material.roughness = 0.8;
        
        console.log("Added procedural noise texture to terrain material");
    } catch (error) {
        // Procedural textures might not be available in all Babylon.js versions
        console.warn("Couldn't create procedural texture, using simple material:", error);
    }
    
    return material;
}

/**
 * Apply vertex colors based on height to a terrain mesh
 * @param {BABYLON.Mesh} mesh - Terrain mesh
 * @param {number} maxHeight - Maximum terrain height
 */
export function applyVertexColors(mesh, maxHeight) {
    // Check if mesh already has colors
    if (mesh._hasVertexColors) {
        return;
    }
    
    // Get positions
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) {
        return;
    }
    
    // Get normals for slope calculation
    const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    
    // Create colors array
    const colors = [];
    
    // Define color bands based on height
    // Grass (low)
    const grassColor = new BABYLON.Color4(0.4, 0.6, 0.3, 1.0);
    // Dirt/Rock (medium)
    const rockColor = new BABYLON.Color4(0.5, 0.45, 0.37, 1.0);
    // Snow (high)
    const snowColor = new BABYLON.Color4(0.95, 0.95, 0.95, 1.0);
    // Sand (beach)
    const sandColor = new BABYLON.Color4(0.76, 0.7, 0.5, 1.0);
    
    // Apply colors based on height and slope
    for (let i = 0; i < positions.length; i += 3) {
        const height = positions[i + 1]; // Y coordinate is height
        const normalizedHeight = height / maxHeight;
        
        // Calculate slope if normals are available
        let slope = 0;
        if (normals) {
            // Normal's Y component indicates vertical alignment
            // 1 = facing up (flat), 0 = perpendicular to up (vertical)
            const normalY = normals[i + 1];
            slope = 1.0 - normalY; // 0 for flat, 1 for vertical
        }
        
        // Choose color based on height and slope
        let color;
        
        // Rock on steep slopes regardless of height
        if (slope > 0.7) {
            color = rockColor;
        }
        // Sand at low elevations near water
        else if (normalizedHeight < 0.1) {
            color = sandColor;
        }
        // Low elevation: grass
        else if (normalizedHeight < 0.4) {
            color = grassColor;
        }
        // Medium elevation: blend grass and rock
        else if (normalizedHeight < 0.7) {
            const blend = (normalizedHeight - 0.4) / 0.3;
            color = BABYLON.Color4.Lerp(grassColor, rockColor, blend);
        }
        // High elevation: blend rock and snow
        else {
            const blend = (normalizedHeight - 0.7) / 0.3;
            color = BABYLON.Color4.Lerp(rockColor, snowColor, blend);
        }
        
        // Add some subtle random variation to avoid uniform appearance
        const variation = (Math.random() * 0.1) - 0.05;
        color.r = Math.max(0, Math.min(1, color.r + variation));
        color.g = Math.max(0, Math.min(1, color.g + variation));
        color.b = Math.max(0, Math.min(1, color.b + variation));
        
        // Add vertex color (RGBA)
        colors.push(color.r, color.g, color.b, color.a);
    }
    
    // Apply colors to the mesh
    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    mesh._hasVertexColors = true;
}