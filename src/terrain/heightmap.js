/**
 * Heightmap generation for terrain
 * Improved for better variation and seamless transitions
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
    
    // Minimum acceptable height variation - ensure we always have some terrain features
    const MIN_HEIGHT_VARIATION = 0.1;
    
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
            console.log(`Generating heightmap for chunk (${chunkX},${chunkZ}) with maxHeight ${maxHeight}`);
            
            // Generate raw heightmap from noise with improved method
            const heightValues = noiseGenerator.generateHeightmap(
                chunkX, chunkZ, chunkSize, resolution
            );
            
            // Calculate height range for diagnostic purposes
            let minHeight = 1.0, maxHeightVal = 0.0;
            for (let i = 0; i < heightValues.length; i++) {
                minHeight = Math.min(minHeight, heightValues[i]);
                maxHeightVal = Math.max(maxHeightVal, heightValues[i]);
            }
            
            // Log height range for this chunk
            console.log(`Height range for chunk (${chunkX},${chunkZ}): ${minHeight.toFixed(2)} to ${maxHeightVal.toFixed(2)}`);
            
            // Check if height variation is too small
            const heightVariation = maxHeightVal - minHeight;
            
            // Enhanced heightmap processing for low variation areas
            let processedHeights = heightValues;
            if (heightVariation < MIN_HEIGHT_VARIATION) {
                console.warn(`Chunk (${chunkX},${chunkZ}) has insufficient height variation (${heightVariation.toFixed(3)}), enhancing variation`);
                
                // Apply forced variation to ensure interesting terrain
                processedHeights = this.enhanceHeightVariation(heightValues, resolution, chunkX, chunkZ);
            }
            
            // Create vertex data for the heightmap
            const vertexData = this.createVertexData(
                processedHeights, chunkX, chunkZ, chunkSize, resolution, maxHeight
            );
            
            return {
                heights: processedHeights,
                vertexData: vertexData,
                chunkX: chunkX,
                chunkZ: chunkZ,
                chunkSize: chunkSize,
                resolution: resolution
            };
        },
        
        /**
         * Enhance height variation for flat areas
         * @param {Float32Array} heightValues - Original heightmap
         * @param {number} resolution - Resolution of heightmap
         * @param {number} chunkX - Chunk X coordinate for seed
         * @param {number} chunkZ - Chunk Z coordinate for seed
         * @returns {Float32Array} Enhanced heightmap with more variation
         */
        enhanceHeightVariation(heightValues, resolution, chunkX, chunkZ) {
            const result = new Float32Array(heightValues.length);
            
            // Find the base height (average of the heightmap)
            let avgHeight = 0;
            for (let i = 0; i < heightValues.length; i++) {
                avgHeight += heightValues[i];
            }
            avgHeight /= heightValues.length;
            
            // Add more dramatic variation
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    const index = z * resolution + x;
                    
                    // Normalized coordinates for pattern generation
                    const nx = x / (resolution - 1);
                    const nz = z / (resolution - 1);
                    
                    // Create various patterns to add interest
                    const sinePattern = Math.sin(nx * Math.PI * 3) * Math.cos(nz * Math.PI * 2) * 0.1;
                    const radialPattern = 0.1 * (1.0 - Math.min(1.0, 
                        2.0 * Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(nz - 0.5, 2))
                    ));
                    
                    // Add randomness based on position
                    const randomFactor = this.pseudoRandom(x + chunkX * resolution, z + chunkZ * resolution) * 0.05;
                    
                    // Combine patterns with the original height
                    result[index] = heightValues[index] + sinePattern + radialPattern + randomFactor;
                }
            }
            
            return result;
        },
        
        /**
         * Generate a pseudo-random value from coordinates (helper)
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate 
         * @returns {number} Random value in [0,1]
         */
        pseudoRandom(x, y) {
            const a = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return a - Math.floor(a);
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
            // Debug output
            console.log(`Creating vertex data for chunk ${chunkX},${chunkZ} with maxHeight ${maxHeight}`);
            
            // Create vertex data container
            const vertexData = new BABYLON.VertexData();
            
            // Calculate positions, normals, and UVs
            const positions = [];
            const normals = [];
            const uvs = [];
            const indices = [];
            
            // World position of chunk origin - ensure exact positioning
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Scale factor to convert from grid coordinates to world coordinates
            const scale = chunkSize / (resolution - 1);
            
            // Generate positions and UVs
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    // Get height at this point - ensure we're using the full height range
                    const heightIndex = z * resolution + x;
                    const height = heightValues[heightIndex] * maxHeight;
                    
                    // Calculate world position - ensure exact positioning
                    const xPos = worldX + x * scale;
                    const zPos = worldZ + z * scale;
                    
                    // Add vertex position with height displacement
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
            // Use the noise generator to get consistent height
            const noiseValue = noiseGenerator.getHeightAtPosition(worldX, worldZ);
            
            // Apply height scaling
            return noiseValue * maxHeight;
        }
    };
}