/**
 * Terrain mesh creation from heightmap data with optimized face count
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
         * @param {number} [lodLevel=0] - Level of detail (0=highest, higher values reduce resolution)
         * @returns {BABYLON.Mesh} Created terrain mesh
         */
        createTerrainMesh(heightmapData, material, lodLevel = 0) {
            // Extract needed values from heightmap data
            const { chunkX, chunkZ, chunkSize, vertexData, heights, resolution } = heightmapData;
            
            // Create a unique name for the mesh
            const meshName = `terrain_${chunkX}_${chunkZ}`;
            
            // Create an empty mesh
            const terrainMesh = new BABYLON.Mesh(meshName, scene);
            
            // Use optimized vertex data that skips vertices based on LOD level
            const optimizedVertexData = this.optimizeVertexData(vertexData, heights, resolution, lodLevel);
            
            // Apply optimized vertex data to the mesh
            optimizedVertexData.applyToMesh(terrainMesh);
            
            // Apply material
            terrainMesh.material = material;
            
            // Store chunk coordinates on the mesh for easy reference
            terrainMesh.chunkX = chunkX;
            terrainMesh.chunkZ = chunkZ;
            terrainMesh.lodLevel = lodLevel;
            
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
         * Optimize vertex data based on LOD level
         * @param {BABYLON.VertexData} vertexData - Original vertex data
         * @param {Float32Array} heights - Heightmap values
         * @param {number} resolution - Resolution of heightmap
         * @param {number} lodLevel - Level of detail (0=highest, higher values reduce resolution)
         * @returns {BABYLON.VertexData} Optimized vertex data
         */
        optimizeVertexData(vertexData, heights, resolution, lodLevel) {
            // If LOD level is 0 or adaptive LOD is disabled, use original data
            if (lodLevel === 0 || !config.terrain.enableAdaptiveLOD) {
                return vertexData;
            }
            
            // Calculate skip factor based on LOD level
            // LOD 0 = use every vertex (skip=1)
            // LOD 1 = use every 2nd vertex (skip=2)
            // LOD 2 = use every 4th vertex (skip=4)
            // etc.
            const skipFactor = Math.pow(2, lodLevel);
            
            // Calculate new resolution after skipping vertices
            const newResolution = Math.floor((resolution - 1) / skipFactor) + 1;
            
            // Create new vertex data container
            const optimizedData = new BABYLON.VertexData();
            
            // Extract original data
            const origPositions = vertexData.positions;
            const origIndices = vertexData.indices;
            const origUvs = vertexData.uvs;
            
            // Create new arrays for optimized data
            const positions = [];
            const indices = [];
            const uvs = [];
            
            // Map from original vertex indices to new indices
            const indexMap = new Map();
            
            // Process positions and UVs by skipping vertices
            for (let z = 0; z < resolution; z += skipFactor) {
                for (let x = 0; x < resolution; x += skipFactor) {
                    // Get original vertex index
                    const origIndex = z * resolution + x;
                    
                    // Calculate new vertex index
                    const newIndex = (z / skipFactor) * newResolution + (x / skipFactor);
                    
                    // Map original index to new index
                    indexMap.set(origIndex, newIndex);
                    
                    // Copy position and UV
                    positions.push(origPositions[origIndex * 3]);
                    positions.push(origPositions[origIndex * 3 + 1]);
                    positions.push(origPositions[origIndex * 3 + 2]);
                    
                    uvs.push(origUvs[origIndex * 2]);
                    uvs.push(origUvs[origIndex * 2 + 1]);
                }
            }
            
            // Create new indices for triangles
            for (let z = 0; z < newResolution - 1; z++) {
                for (let x = 0; x < newResolution - 1; x++) {
                    // Calculate vertex indices for this grid cell
                    const bottomLeft = z * newResolution + x;
                    const bottomRight = bottomLeft + 1;
                    const topLeft = (z + 1) * newResolution + x;
                    const topRight = topLeft + 1;
                    
                    // Add two triangles (counter-clockwise winding)
                    indices.push(bottomLeft, bottomRight, topRight);
                    indices.push(bottomLeft, topRight, topLeft);
                }
            }
            
            // Calculate normals
            const normals = [];
            this.calculateNormals(positions, indices, normals);
            
            // Set vertex data
            optimizedData.positions = positions;
            optimizedData.indices = indices;
            optimizedData.normals = normals;
            optimizedData.uvs = uvs;
            
            return optimizedData;
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
            
            // Set as non-pickable to improve performance
            mesh.isPickable = false;
        },
        
        /**
         * Calculate normals for the mesh
         * @param {Array} positions - Vertex positions
         * @param {Array} indices - Vertex indices
         * @param {Array} normals - Output array for normals
         */
        calculateNormals(positions, indices, normals) {
            // Initialize normals array with zeros
            for (let i = 0; i < positions.length; i++) {
                normals.push(0);
            }
            
            // Calculate normals for each face
            for (let i = 0; i < indices.length; i += 3) {
                // Get vertex indices for this face
                const i1 = indices[i];
                const i2 = indices[i + 1];
                const i3 = indices[i + 2];
                
                // Get vertex positions
                const v1 = new BABYLON.Vector3(
                    positions[i1 * 3], 
                    positions[i1 * 3 + 1], 
                    positions[i1 * 3 + 2]
                );
                const v2 = new BABYLON.Vector3(
                    positions[i2 * 3], 
                    positions[i2 * 3 + 1], 
                    positions[i2 * 3 + 2]
                );
                const v3 = new BABYLON.Vector3(
                    positions[i3 * 3], 
                    positions[i3 * 3 + 1], 
                    positions[i3 * 3 + 2]
                );
                
                // Calculate face normal
                const normal = BABYLON.Vector3.Cross(
                    v2.subtract(v1),
                    v3.subtract(v1)
                ).normalize();
                
                // Add to vertex normals
                normals[i1 * 3] += normal.x;
                normals[i1 * 3 + 1] += normal.y;
                normals[i1 * 3 + 2] += normal.z;
                
                normals[i2 * 3] += normal.x;
                normals[i2 * 3 + 1] += normal.y;
                normals[i2 * 3 + 2] += normal.z;
                
                normals[i3 * 3] += normal.x;
                normals[i3 * 3 + 1] += normal.y;
                normals[i3 * 3 + 2] += normal.z;
            }
            
            // Normalize all vertex normals
            for (let i = 0; i < normals.length; i += 3) {
                const normal = new BABYLON.Vector3(
                    normals[i],
                    normals[i + 1],
                    normals[i + 2]
                ).normalize();
                
                normals[i] = normal.x;
                normals[i + 1] = normal.y;
                normals[i + 2] = normal.z;
            }
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
