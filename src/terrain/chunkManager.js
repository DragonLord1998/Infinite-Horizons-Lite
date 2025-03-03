/**
 * Modified chunk management for seamless transitions
 * Improved for better chunk stitching and performance
 */
import config from '../config.js';
import { createHeightmapGenerator } from './heightmap.js';
import { createTerrainMeshBuilder } from './meshBuilder.js';
import { createTerrainMaterial, applyVertexColors } from '../materials/terrainMaterial.js';

/**
 * Initializes the chunk manager for terrain
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Camera} camera - The camera for position tracking
 * @param {BABYLON.Material} [customMaterial=null] - Optional custom material
 * @returns {Object} Chunk manager object
 */
export function initChunkManager(scene, camera, customMaterial = null) {
    // Create heightmap generator
    const heightmapGenerator = createHeightmapGenerator(config.noise);
    
    // Create terrain mesh builder
    const terrainMeshBuilder = createTerrainMeshBuilder(scene);
    
    // Create or use provided terrain material
    const terrainMaterial = customMaterial || createTerrainMaterial(scene);
    
    // Store loaded chunks
    const loadedChunks = new Map();
    
    // Store chunks currently being generated
    const chunksInProgress = new Set();
    
    // Store last camera position for optimization
    let lastCameraChunkX = null;
    let lastCameraChunkZ = null;
    
    // Last time chunk LOD was updated
    let lastLODUpdateTime = 0;
    
    // Frame counter for skipping updates
    let frameCount = 0;
    
    // Create chunk manager object
    const chunkManager = {
        /**
         * Update chunks based on camera position
         */
        update() {
            // Increment frame counter and skip processing if needed for performance
            frameCount++;
            if (config.performance && config.performance.skipFrames && 
                frameCount % config.performance.skipFrames !== 0) {
                return;
            }
            
            // Reset frame counter after processing
            frameCount = 0;
            
            // Get camera position
            const cameraPosition = camera.position;
            
            // Calculate chunk coordinates from camera position
            const cameraChunkX = Math.floor(cameraPosition.x / config.terrain.chunkSize);
            const cameraChunkZ = Math.floor(cameraPosition.z / config.terrain.chunkSize);
            
            // Only update if camera moved to a different chunk or first update
            if (cameraChunkX !== lastCameraChunkX || cameraChunkZ !== lastCameraChunkZ || 
                lastCameraChunkX === null || lastCameraChunkZ === null) {
                
                // Update last camera position
                lastCameraChunkX = cameraChunkX;
                lastCameraChunkZ = cameraChunkZ;
                
                // Load chunks around camera
                this.loadChunksAroundPosition(cameraChunkX, cameraChunkZ);
                
                // Unload distant chunks
                this.unloadDistantChunks(cameraChunkX, cameraChunkZ);
            }
            
            // Update LOD for chunks less frequently (every 500ms)
            const currentTime = performance.now();
            if (currentTime - lastLODUpdateTime > 500) {
                lastLODUpdateTime = currentTime;
                this.updateChunkLOD(cameraPosition);
            }
        },
        
        /**
         * Load chunks around a position with LOD based on distance
         * @param {number} centerX - Center chunk X coordinate
         * @param {number} centerZ - Center chunk Z coordinate
         */
        loadChunksAroundPosition(centerX, centerZ) {
            // Determine load distance from config
            const loadDistance = config.terrain.loadDistance;
            
            // Create a priority queue based on distance from camera
            const chunkQueue = [];
            
            // Loop through chunks in the load area
            for (let z = centerZ - loadDistance; z <= centerZ + loadDistance; z++) {
                for (let x = centerX - loadDistance; x <= centerX + loadDistance; x++) {
                    // Create a unique key for this chunk
                    const chunkKey = `${x}_${z}`;
                    
                    // Check if chunk is already loaded or in progress
                    if (!loadedChunks.has(chunkKey) && !chunksInProgress.has(chunkKey)) {
                        // Calculate distance from camera chunk (Chebyshev distance for circular load area)
                        const distance = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));
                        
                        // Calculate LOD level based on distance
                        const lodLevel = this.calculateLODLevelForDistance(distance);
                        
                        // Add to queue with distance as priority
                        chunkQueue.push({
                            x: x,
                            z: z,
                            key: chunkKey,
                            distance: distance,
                            lodLevel: lodLevel
                        });
                    }
                }
            }
            
            // Sort by distance (closest first)
            chunkQueue.sort((a, b) => a.distance - b.distance);
            
            // Limit max chunks to load at once for performance
            const maxVisibleChunks = config.performance && config.performance.maxVisibleChunks 
                ? config.performance.maxVisibleChunks 
                : 30;
                
            // If we're already at the max chunks, don't load more
            const visibleChunkCount = loadedChunks.size;
            if (visibleChunkCount >= maxVisibleChunks) {
                const excessChunks = visibleChunkCount - maxVisibleChunks + 5; // Add a buffer
                if (excessChunks > 0) {
                    // Force immediate unload of excess distant chunks
                    this.unloadFurthestChunks(centerX, centerZ, excessChunks);
                }
            }
            
            // Load chunks with a small delay between each to prevent freezing
            let index = 0;
            const maxToLoad = Math.min(chunkQueue.length, maxVisibleChunks - visibleChunkCount);
            
            const loadNextChunk = () => {
                if (index < maxToLoad) {
                    const chunk = chunkQueue[index++];
                    this.loadChunk(chunk.x, chunk.z, chunk.lodLevel);
                    
                    // Schedule next chunk load with a delay that increases with distance
                    const delay = 5 + chunk.distance * 2; // More distant chunks get more delay
                    setTimeout(loadNextChunk, delay);
                }
            };
            
            // Start loading process
            loadNextChunk();
        },
        
        /**
         * Calculate LOD level based on distance from camera
         * @param {number} distance - Distance in chunks
         * @returns {number} LOD level (0 = highest detail)
         */
        calculateLODLevelForDistance(distance) {
            if (!config.terrain.enableAdaptiveLOD) {
                return 0; // Always use highest LOD if adaptive is disabled
            }
            
            // LOD 0 (highest detail) for the closest 1 chunk
            if (distance <= 1) {
                return 0;
            }
            // LOD 1 for chunks at distance 2-3
            else if (distance <= 2) {
                return 1;
            }
            // LOD 2 for chunks at distance 3-4
            else if (distance <= 3) {
                return 2;
            }
            // LOD 3 (lowest detail) for distant chunks
            else {
                return 3;
            }
        },
        
        /**
         * Unload chunks that are too far from the camera
         * @param {number} centerX - Center chunk X coordinate
         * @param {number} centerZ - Center chunk Z coordinate
         */
        unloadDistantChunks(centerX, centerZ) {
            // Determine unload distance from config
            const unloadDistance = config.terrain.unloadDistance;
            
            // Check each loaded chunk
            for (const [chunkKey, chunk] of loadedChunks.entries()) {
                // Parse chunk coordinates from key
                const [x, z] = chunkKey.split('_').map(Number);
                
                // Calculate distance in chunks (Chebyshev distance)
                const distance = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));
                
                // Unload if too far away
                if (distance > unloadDistance) {
                    this.unloadChunk(chunkKey);
                }
            }
        },
        
        /**
         * Unload furthest chunks to maintain performance
         * @param {number} centerX - Center chunk X coordinate
         * @param {number} centerZ - Center chunk Z coordinate
         * @param {number} count - Number of chunks to unload
         */
        unloadFurthestChunks(centerX, centerZ, count) {
            // Create array of chunks with distances
            const chunksWithDistances = [];
            
            for (const [chunkKey, chunk] of loadedChunks.entries()) {
                // Parse chunk coordinates from key
                const [x, z] = chunkKey.split('_').map(Number);
                
                // Calculate distance in chunks (Chebyshev distance)
                const distance = Math.max(Math.abs(x - centerX), Math.abs(z - centerZ));
                
                chunksWithDistances.push({
                    key: chunkKey,
                    distance: distance
                });
            }
            
            // Sort by distance (furthest first)
            chunksWithDistances.sort((a, b) => b.distance - a.distance);
            
            // Unload the furthest chunks
            for (let i = 0; i < Math.min(count, chunksWithDistances.length); i++) {
                this.unloadChunk(chunksWithDistances[i].key);
            }
        },
        
        /**
         * Update LOD (Level of Detail) for chunks based on distance
         * @param {BABYLON.Vector3} cameraPosition - Camera position
         */
        updateChunkLOD(cameraPosition) {
            // Only proceed if adaptive LOD is enabled
            if (!config.terrain.enableAdaptiveLOD) {
                return;
            }
            
            // Calculate camera chunk position
            const cameraChunkX = Math.floor(cameraPosition.x / config.terrain.chunkSize);
            const cameraChunkZ = Math.floor(cameraPosition.z / config.terrain.chunkSize);
            
            // Check each loaded chunk
            for (const [chunkKey, mesh] of loadedChunks.entries()) {
                // Parse chunk coordinates from key
                const [x, z] = chunkKey.split('_').map(Number);
                
                // Calculate distance from camera in chunks (Chebyshev distance)
                const distance = Math.max(Math.abs(x - cameraChunkX), Math.abs(z - cameraChunkZ));
                
                // Calculate optimal LOD level
                const optimalLOD = this.calculateLODLevelForDistance(distance);
                
                // Check if mesh needs LOD update
                if (mesh.lodLevel !== optimalLOD) {
                    // Only update if the difference is significant
                    if (Math.abs(mesh.lodLevel - optimalLOD) >= 2) {
                        this.updateChunkLODLevel(chunkKey, x, z, optimalLOD);
                    }
                }
                
                // Update visibility based on frustum
                if (config.performance.frustumCullingEnabled) {
                    const inFrustum = camera.isInFrustum(mesh);
                    mesh.isVisible = inFrustum;
                }
            }
        },
        
        /**
         * Update a chunk's LOD level
         * @param {string} chunkKey - Chunk key
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} newLODLevel - New LOD level
         */
        updateChunkLODLevel(chunkKey, chunkX, chunkZ, newLODLevel) {
            // Get the existing mesh
            const existingMesh = loadedChunks.get(chunkKey);
            
            // Skip if mesh doesn't exist or already has the target LOD level
            if (!existingMesh || existingMesh.lodLevel === newLODLevel) {
                return;
            }
            
            // Load the chunk with new LOD level
            this.loadChunk(chunkX, chunkZ, newLODLevel, true);
        },
        
        /**
         * Load a specific chunk
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} [lodLevel=0] - Level of detail (0=highest)
         * @param {boolean} [isLODUpdate=false] - Whether this is a LOD update
         * @returns {BABYLON.Mesh} The created terrain mesh
         */
        loadChunk(chunkX, chunkZ, lodLevel = 0, isLODUpdate = false) {
            // Get settings from config
            const { chunkSize, chunkResolution, maxHeight } = config.terrain;
            
            // Create a unique key for this chunk
            const chunkKey = `${chunkX}_${chunkZ}`;
            
            // Check if already loaded with same or better LOD
            const existingMesh = loadedChunks.get(chunkKey);
            if (existingMesh && !isLODUpdate && existingMesh.lodLevel <= lodLevel) {
                return existingMesh;
            }
            
            // Mark chunk as in progress
            chunksInProgress.add(chunkKey);
            
            try {
                // Generate heightmap data
                const heightmapData = heightmapGenerator.generateHeightmapForChunk(
                    chunkX, chunkZ, chunkSize, chunkResolution, maxHeight
                );
                
                // Get neighboring chunks for edge matching if they exist
                const neighbors = {
                    north: loadedChunks.get(`${chunkX}_${chunkZ+1}`),
                    south: loadedChunks.get(`${chunkX}_${chunkZ-1}`),
                    east: loadedChunks.get(`${chunkX+1}_${chunkZ}`),
                    west: loadedChunks.get(`${chunkX-1}_${chunkZ}`)
                };
                
                // Match edges with existing neighbors for perfect seams
                if (Object.values(neighbors).some(n => n)) {
                    this.matchChunkEdges(heightmapData, neighbors);
                }
                
                // Create terrain mesh with LOD
                const terrainMesh = terrainMeshBuilder.createTerrainMesh(
                    heightmapData, terrainMaterial, lodLevel
                );
                
                // Store heightmap data on the mesh for neighbor matching
                terrainMesh.heightData = heightmapData.heights;
                terrainMesh.chunkX = chunkX;
                terrainMesh.chunkZ = chunkZ;
                terrainMesh.lodLevel = lodLevel;
                
                // Apply vertex colors to the mesh
                if (terrainMaterial instanceof BABYLON.PBRMaterial && terrainMaterial.useVertexColors) {
                    applyVertexColors(terrainMesh, maxHeight);
                }
                
                // If this is a LOD update, remove the existing mesh
                if (isLODUpdate && existingMesh) {
                    existingMesh.dispose();
                }
                
                // Store the mesh in loaded chunks
                loadedChunks.set(chunkKey, terrainMesh);
                
                // Remove from in-progress chunks
                chunksInProgress.delete(chunkKey);
                
                console.log(`Loaded chunk ${chunkKey} with LOD ${lodLevel}`);
                
                return terrainMesh;
            } catch (error) {
                console.error(`Error loading chunk ${chunkKey}:`, error);
                chunksInProgress.delete(chunkKey);
                return null;
            }
        },
        
        /**
         * Match chunk edges with neighbors for seamless transitions
         * @param {Object} heightmapData - Heightmap data
         * @param {Object} neighbors - Neighboring chunks
         */
        matchChunkEdges(heightmapData, neighbors) {
            const { heights, resolution } = heightmapData;
            
            // Blend factor for smooth transitions (0.5 = average)
            const BLEND_FACTOR = 0.5;
            
            // Match north edge if neighbor exists
            if (neighbors.north && neighbors.north.heightData) {
                const northHeights = neighbors.north.heightData;
                for (let x = 0; x < resolution; x++) {
                    // Blend heights at boundary 
                    const northIdx = x;
                    const thisIdx = (resolution - 1) * resolution + x;
                    
                    // Smooth blend between this chunk and neighbor
                    heights[thisIdx] = heights[thisIdx] * (1-BLEND_FACTOR) + 
                                     northHeights[northIdx] * BLEND_FACTOR;
                }
            }
            
            // Match south edge if neighbor exists
            if (neighbors.south && neighbors.south.heightData) {
                const southHeights = neighbors.south.heightData;
                for (let x = 0; x < resolution; x++) {
                    // Blend heights at boundary
                    const southIdx = (resolution - 1) * resolution + x;
                    const thisIdx = x;
                    
                    // Smooth blend
                    heights[thisIdx] = heights[thisIdx] * (1-BLEND_FACTOR) + 
                                     southHeights[southIdx] * BLEND_FACTOR;
                }
            }
            
            // Match east edge if neighbor exists
            if (neighbors.east && neighbors.east.heightData) {
                const eastHeights = neighbors.east.heightData;
                for (let z = 0; z < resolution; z++) {
                    // Blend heights at boundary
                    const eastIdx = z * resolution;
                    const thisIdx = z * resolution + (resolution - 1);
                    
                    // Smooth blend
                    heights[thisIdx] = heights[thisIdx] * (1-BLEND_FACTOR) + 
                                     eastHeights[eastIdx] * BLEND_FACTOR;
                }
            }
            
            // Match west edge if neighbor exists
            if (neighbors.west && neighbors.west.heightData) {
                const westHeights = neighbors.west.heightData;
                for (let z = 0; z < resolution; z++) {
                    // Blend heights at boundary
                    const westIdx = z * resolution + (resolution - 1);
                    const thisIdx = z * resolution;
                    
                    // Smooth blend
                    heights[thisIdx] = heights[thisIdx] * (1-BLEND_FACTOR) + 
                                     westHeights[westIdx] * BLEND_FACTOR;
                }
            }
            
            // Extra smoothing for corner vertices
            if (neighbors.north && neighbors.north.heightData && 
                neighbors.east && neighbors.east.heightData) {
                // Northeast corner
                const neCornerIdx = (resolution - 1) * resolution + (resolution - 1);
                const northeastHeight = (heights[neCornerIdx] + 
                                       neighbors.north.heightData[resolution - 1] + 
                                       neighbors.east.heightData[(resolution - 1) * resolution]) / 3;
                heights[neCornerIdx] = northeastHeight;
            }
            
            if (neighbors.north && neighbors.north.heightData && 
                neighbors.west && neighbors.west.heightData) {
                // Northwest corner
                const nwCornerIdx = (resolution - 1) * resolution;
                const northwestHeight = (heights[nwCornerIdx] + 
                                       neighbors.north.heightData[0] + 
                                       neighbors.west.heightData[(resolution - 1) * resolution + (resolution - 1)]) / 3;
                heights[nwCornerIdx] = northwestHeight;
            }
            
            if (neighbors.south && neighbors.south.heightData && 
                neighbors.east && neighbors.east.heightData) {
                // Southeast corner
                const seCornerIdx = resolution - 1;
                const southeastHeight = (heights[seCornerIdx] + 
                                       neighbors.south.heightData[(resolution - 1) * resolution + (resolution - 1)] + 
                                       neighbors.east.heightData[0]) / 3;
                heights[seCornerIdx] = southeastHeight;
            }
            
            if (neighbors.south && neighbors.south.heightData && 
                neighbors.west && neighbors.west.heightData) {
                // Southwest corner
                const swCornerIdx = 0;
                const southwestHeight = (heights[swCornerIdx] + 
                                       neighbors.south.heightData[(resolution - 1) * resolution] + 
                                       neighbors.west.heightData[resolution - 1]) / 3;
                heights[swCornerIdx] = southwestHeight;
            }
        },
        
        /**
         * Unload a specific chunk
         * @param {string} chunkKey - Key for the chunk to unload
         */
        unloadChunk(chunkKey) {
            // Get the mesh from the loaded chunks
            const terrainMesh = loadedChunks.get(chunkKey);
            
            if (terrainMesh) {
                // Dispose of the mesh
                terrainMesh.dispose();
                
                // Remove from loaded chunks
                loadedChunks.delete(chunkKey);
                
                console.log(`Unloaded chunk ${chunkKey}`);
            }
        },
        
        /**
         * Initialize the terrain by loading initial chunks
         */
        initialize() {
            // Number of chunks to load initially (as an NxN grid)
            const initialSize = config.terrain.initialChunks;
            const halfSize = Math.floor(initialSize / 2);
            
            // Load initial chunks in a grid around origin with LOD based on distance
            for (let z = -halfSize; z <= halfSize; z++) {
                for (let x = -halfSize; x <= halfSize; x++) {
                    // Calculate distance from center
                    const distance = Math.max(Math.abs(x), Math.abs(z));
                    
                    // Calculate LOD level based on distance
                    const lodLevel = this.calculateLODLevelForDistance(distance);
                    
                    // Load chunk with appropriate LOD
                    this.loadChunk(x, z, lodLevel);
                }
            }
            
            // Set up update on each frame
            scene.onBeforeRenderObservable.add(() => {
                this.update();
            });
            
            console.log(`Initialized terrain with ${initialSize}x${initialSize} chunks using adaptive LOD`);
        },
        
        /**
         * Get the number of loaded chunks
         * @returns {number} The number of loaded chunks
         */
        getLoadedChunkCount() {
            return loadedChunks.size;
        },
        
        /**
         * Get all loaded chunks
         * @returns {Map} Map of loaded chunks
         */
        getLoadedChunks() {
            return loadedChunks;
        },
        
        /**
         * Get the total number of vertices in all loaded chunks
         * @returns {number} The total vertex count
         */
        getTotalVertexCount() {
            let count = 0;
            
            for (const mesh of loadedChunks.values()) {
                count += mesh.getTotalVertices();
            }
            
            return count;
        },
        
        /**
         * Get the total number of faces in all loaded chunks
         * @returns {number} The total face count
         */
        getTotalFaceCount() {
            let count = 0;
            
            for (const mesh of loadedChunks.values()) {
                // Each face is a triangle, which consists of 3 indices
                count += mesh.getTotalIndices() / 3;
            }
            
            return count;
        },
        
        /**
         * Get height at a specific world position
         * @param {number} worldX - World X coordinate
         * @param {number} worldZ - World Z coordinate
         * @returns {number} Height at the specified position
         */
        getHeightAtPosition(worldX, worldZ) {
            return heightmapGenerator.getHeightAtPosition(
                worldX, worldZ, config.terrain.maxHeight
            );
        }
    };
    
    // Initialize the chunk manager
    chunkManager.initialize();
    
    return chunkManager;
}