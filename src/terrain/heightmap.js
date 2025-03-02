/**
 * Heightmap generation for terrain
 */
import { createNoiseGenerator } from './noiseGenerator.js';

/**
 * Creates a heightmap generator
 * @param {Object} noiseConfig - Configuration for noise generation
 * @returns {Object} Heightmap generator object
 */
export function createHeightmapGenerator(noiseConfig) {
    // Create the noise generator
    const noiseGenerator = createNoiseGenerator(noiseConfig);
    
    return {
        /**
         * Generate a heightmap for a terrain chunk
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk in world units
         * @param {number} resolution - Resolution of the heightmap (vertices per side)
         * @param {number} maxHeight - Maximum height of the terrain
         * @returns {Object} Generated heightmap data
         */
        generateHeightmapForChunk(chunkX, chunkZ, chunkSize, resolution, maxHeight) {
            // Generate raw heightmap from noise
            const heightValues = noiseGenerator.generateHeightmap(
                chunkX, chunkZ, chunkSize, resolution
            );
            
            // Create vertex data for the heightmap
            const vertexData = this.createVertexData(
                heightValues, chunkX, chunkZ, chunkSize, resolution, maxHeight
            );
            
            return {
                heights: heightValues,
                vertexData: vertexData,
                chunkX: chunkX,
                chunkZ: chunkZ,
                chunkSize: chunkSize,
                resolution: resolution
            };
        },
        
        /**
         * Create vertex data from heightmap
         * @param {Float32Array} heightValues - Heightmap values
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk in world units
         * @param {number} resolution - Resolution of the heightmap
         * @param {number} maxHeight - Maximum height of the terrain
         * @returns {BABYLON.VertexData} Vertex data for mesh creation
         */
        createVertexData(heightValues, chunkX, chunkZ, chunkSize, resolution, maxHeight) {
            // Create vertex data container
            const vertexData = new BABYLON.VertexData();
            
            // Calculate positions, normals, and UVs
            const positions = [];
            const normals = [];
            const uvs = [];
            const indices = [];
            
            // World position of chunk origin
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Scale factor to convert from grid coordinates to world coordinates
            const scale = chunkSize / (resolution - 1);
            
            // Generate positions and UVs
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    // Get height at this point
                    const height = heightValues[z * resolution + x] * maxHeight;
                    
                    // Calculate world position
                    const xPos = worldX + x * scale;
                    const zPos = worldZ + z * scale;
                    
                    // Add vertex position
                    positions.push(xPos, height, zPos);
                    
                    // Add UV coordinates (normalized)
                    uvs.push(x / (resolution - 1), z / (resolution - 1));
                }
            }
            
            // Generate indices for triangles
            for (let z = 0; z < resolution - 1; z++) {
                for (let x = 0; x < resolution - 1; x++) {
                    // Calculate vertex indices
                    const bottomLeft = z * resolution + x;
                    const bottomRight = bottomLeft + 1;
                    const topLeft = (z + 1) * resolution + x;
                    const topRight = topLeft + 1;
                    
                    // Add two triangles for this grid cell
                    indices.push(bottomLeft, bottomRight, topRight);
                    indices.push(bottomLeft, topRight, topLeft);
                }
            }
            
            // Calculate normals
            this.calculateNormals(positions, indices, normals);
            
            // Set vertex data
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.uvs = uvs;
            
            return vertexData;
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
         * Get height at a specific world position
         * @param {number} worldX - World X coordinate
         * @param {number} worldZ - World Z coordinate
         * @param {number} maxHeight - Maximum height of the terrain
         * @returns {number} Height at the specified position
         */
        getHeightAtPosition(worldX, worldZ, maxHeight) {
            // Use the noise generator to get the height
            const noiseValue = noiseGenerator.getFractalNoise(
                worldX * noiseGenerator.scale,
                worldZ * noiseGenerator.scale
            );
            
            return noiseValue * maxHeight;
        }
    };
}
