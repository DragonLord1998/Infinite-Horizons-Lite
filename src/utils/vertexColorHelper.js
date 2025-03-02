/**
 * Utility functions for applying vertex colors to terrain meshes
 */

/**
 * Apply vertex colors to a terrain mesh based on height
 * @param {BABYLON.Mesh} mesh - Terrain mesh
 * @param {number} maxHeight - Maximum terrain height
 */
export function applyVertexColors(mesh, maxHeight) {
    console.log(`Applying vertex colors to mesh ${mesh.name}`);
    
    // Check if mesh already has colors
    if (mesh._hasVertexColors) {
        console.log(`Mesh ${mesh.name} already has vertex colors, skipping`);
        return;
    }
    
    // Get positions
    const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) {
        console.warn(`Could not get vertex positions for mesh ${mesh.name}`);
        return;
    }
    
    console.log(`Generating colors for ${positions.length / 3} vertices`);
    
    try {
        // Create colors array
        const colors = [];
        
        // Define color bands based on height
        // Grass (low)
        const grassColor = new BABYLON.Color4(0.4, 0.6, 0.3, 1.0);
        // Dirt/Rock (medium)
        const rockColor = new BABYLON.Color4(0.5, 0.45, 0.37, 1.0);
        // Snow (high)
        const snowColor = new BABYLON.Color4(0.95, 0.95, 0.95, 1.0);
        
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
                color = BABYLON.Color4.Lerp(grassColor, rockColor, blend);
            } else {
                // High elevation: blend rock and snow
                const blend = (normalizedHeight - 0.7) / 0.3;
                color = BABYLON.Color4.Lerp(rockColor, snowColor, blend);
            }
            
            // Add vertex color (RGBA)
            colors.push(color.r, color.g, color.b, color.a);
        }
        
        console.log(`Setting ${colors.length / 4} vertex colors for mesh ${mesh.name}`);
        
        // Apply colors to the mesh
        mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        mesh._hasVertexColors = true;
        
        console.log(`Vertex colors applied to mesh ${mesh.name}`);
    } catch (error) {
        console.error(`Error applying vertex colors to mesh ${mesh.name}:`, error);
    }
}