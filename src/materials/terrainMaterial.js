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
    // Create a PBR material for better visual quality
    const material = new BABYLON.PBRMaterial("terrainMaterial", scene);
    
    // Set up material properties
    material.metallic = 0.0;         // Non-metallic surface
    material.roughness = 0.9;        // Rough surface like natural terrain
    material.albedoColor = new BABYLON.Color3(0.4, 0.6, 0.3); // Base grass color
    material.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Ambient light contribution
    
    // Add micro-surface variation for a more natural look
    material.microSurface = 0.95;
    
    // Use the terrain height to dynamically color the vertex
    material.useVertexColors = true;
    
    // Create a custom onBind function to apply vertex colors based on height
    material.onBindObservable.add(function() {
        const effect = material._activeEffect;
        effect.setFloat("maxHeight", config.terrain.maxHeight);
    });
    
    // Add vertex color function to the scene's onBeforeRenderObservable
    scene.onBeforeRenderObservable.add(() => {
        // Apply vertex colors to all terrain meshes
        scene.meshes.forEach(mesh => {
            if (mesh.name.startsWith('terrain_')) {
                applyVertexColors(mesh, config.terrain.maxHeight);
            }
        });
    });
    
    return material;
}

/**
 * Apply vertex colors based on height
 * @param {BABYLON.Mesh} mesh - Terrain mesh
 * @param {number} maxHeight - Maximum terrain height
 */
function applyVertexColors(mesh, maxHeight) {
    // Check if mesh already has colors
    if (mesh._hasVertexColors) {
        return;
    }
    
    // Get positions
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) {
        return;
    }
    
    // Create colors array
    const colors = [];
    
    // Define color bands based on height
    // Grass (low)
    const grassColor = new BABYLON.Color3(0.4, 0.6, 0.3);
    // Dirt/Rock (medium)
    const rockColor = new BABYLON.Color3(0.5, 0.45, 0.37);
    // Snow (high)
    const snowColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    
    // Apply colors based on height
    for (let i = 0; i < positions.length; i += 3) {
        const height = positions[i + 1]; // Y coordinate is height
        const normalizedHeight = height / maxHeight;
        
        let color;
        
        if (normalizedHeight < 0.3) {
            // Low elevation: grass
            color = grassColor;
        } else if (normalizedHeight < 0.7) {
            // Medium elevation: blend grass and rock
            const blend = (normalizedHeight - 0.3) / 0.4;
            color = BABYLON.Color3.Lerp(grassColor, rockColor, blend);
        } else {
            // High elevation: blend rock and snow
            const blend = (normalizedHeight - 0.7) / 0.3;
            color = BABYLON.Color3.Lerp(rockColor, snowColor, blend);
        }
        
        // Add vertex color (RGBA)
        colors.push(color.r, color.g, color.b, 1.0);
    }
    
    // Apply colors to the mesh
    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
    mesh._hasVertexColors = true;
}

/**
 * Create shader-based terrain material (to be implemented in Phase 2)
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {BABYLON.ShaderMaterial} Created shader material
 */
export function createShaderTerrainMaterial(scene) {
    // This is a placeholder for Phase 2
    // We'll implement a custom shader-based material in Phase 2
    return null;
}