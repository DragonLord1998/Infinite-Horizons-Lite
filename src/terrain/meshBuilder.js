/**
 * Terrain mesh creation from heightmap data
 */
import config from '../config.js';

/**
 * Creates a terrain mesh builder
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @returns {Object} Mesh builder object
 */
export function createTerrainMeshBuilder(scene) {
    return {
        /**
         * Create a terrain mesh from heightmap data
         * @param {Object} heightmapData - Heightmap data from heightmap generator
         * @param {BABYLON.Material} material - Material to apply to the mesh
         * @returns {BABYLON.Mesh} Created terrain mesh
         */
        createTerrainMesh(heightmapData, material) {
            // Extract needed values from heightmap data
            const { chunkX, chunkZ, chunkSize, vertexData } = heightmapData;
            
            // Create a unique name for the mesh
            const meshName = `terrain_${chunkX}_${chunkZ}`;
            
            // Create an empty mesh
            const terrainMesh = new BABYLON.Mesh(meshName, scene);
            
            // Apply vertex data to the mesh
            vertexData.applyToMesh(terrainMesh);
            
            // Apply material
            terrainMesh.material = material;
            
            // Store chunk coordinates on the mesh for easy reference
            terrainMesh.chunkX = chunkX;
            terrainMesh.chunkZ = chunkZ;
            
            // Optimize the mesh for rendering
            this.optimizeMesh(terrainMesh);
            
            // Add debug wireframe if enabled
            if (config.debug.showWireframe) {
                this.addWireframe(terrainMesh);
            }
            
            // Add chunk boundary markers if enabled
            if (config.debug.showChunkBoundaries) {
                this.addChunkBoundaries(terrainMesh, chunkX, chunkZ, chunkSize);
            }
            
            return terrainMesh;
        },
        
        /**
         * Optimize a mesh for rendering
         * @param {BABYLON.Mesh} mesh - The mesh to optimize
         */
        optimizeMesh(mesh) {
            // Freeze world matrix for static meshes
            mesh.freezeWorldMatrix();
            
            // Convert to flat shaded if needed
            // mesh.convertToFlatShadedMesh(); // Uncomment for flat shading
            
            // Enable vertex buffer updates only when needed
            mesh.doNotSyncBoundingInfo = true;
            
            // For terrains, backface culling can improve performance
            mesh.material.backFaceCulling = true;
            
            // Freeze normals since they won't change
            mesh.freezeNormals();
        },
        
        /**
         * Add wireframe display to a mesh
         * @param {BABYLON.Mesh} mesh - The mesh to add wireframe to
         */
        addWireframe(mesh) {
            // Create a wireframe material
            const wireframeMat = new BABYLON.StandardMaterial(`${mesh.name}_wireframe`, mesh.getScene());
            wireframeMat.wireframe = true;
            wireframeMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
            wireframeMat.disableLighting = true;
            
            // Clone the mesh and apply wireframe material
            const wireframe = mesh.clone(`${mesh.name}_wireframe`);
            wireframe.material = wireframeMat;
            wireframe.position = mesh.position;
            
            // Small offset to prevent z-fighting
            wireframe.position.y += 0.01;
            
            // Make the wireframe mesh a child of the original mesh
            wireframe.parent = mesh;
        },
        
        /**
         * Add visible boundaries around a chunk for debugging
         * @param {BABYLON.Mesh} mesh - The terrain mesh
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk
         */
        addChunkBoundaries(mesh, chunkX, chunkZ, chunkSize) {
            // Calculate world position of chunk
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Create lines for chunk boundaries
            const lines = BABYLON.MeshBuilder.CreateLines(
                `${mesh.name}_boundary`,
                {
                    points: [
                        new BABYLON.Vector3(worldX, 0, worldZ),
                        new BABYLON.Vector3(worldX + chunkSize, 0, worldZ),
                        new BABYLON.Vector3(worldX + chunkSize, 0, worldZ + chunkSize),
                        new BABYLON.Vector3(worldX, 0, worldZ + chunkSize),
                        new BABYLON.Vector3(worldX, 0, worldZ)
                    ],
                    colors: [
                        new BABYLON.Color4(1, 0, 0, 1),
                        new BABYLON.Color4(1, 0, 0, 1),
                        new BABYLON.Color4(1, 0, 0, 1),
                        new BABYLON.Color4(1, 0, 0, 1),
                        new BABYLON.Color4(1, 0, 0, 1)
                    ]
                },
                mesh.getScene()
            );
            
            // Make lines a child of the mesh
            lines.parent = mesh;
        }
    };
}
