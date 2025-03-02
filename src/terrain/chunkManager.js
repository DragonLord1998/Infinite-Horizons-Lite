/**
 * Chunk management for terrain loading and unloading
 */
import config from '../config.js';
import { createHeightmapGenerator } from './heightmap.js';
import { createTerrainMeshBuilder } from './meshBuilder.js';
import { createTerrainMaterial } from '../materials/terrainMaterial.js';

/**
 * Initializes the chunk manager for terrain
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Camera} camera - The camera for position tracking
 * @returns {Object} Chunk manager object
 */
export function initChunkManager(scene, camera) {
    // Create heightmap generator
    const heightmapGenerator = createHeightmapGenerator(config.noise);
    
    // Create terrain mesh builder
    const terrainMeshBuilder = createTerrainMeshBuilder(scene);
    
    // Create terrain material
    const terrainMaterial = createTerrainMaterial(scene);
    
    // Store loaded chunks
    const loadedChunks = new Map();
    
    // Create chunk manager object
    const chunkManager = {
        /**
         * Update chunks based on camera position
         */
        update() {
            // Get camera position
            const cameraPosition = camera.position;
            
            // Calculate chunk coordinates from camera position
            const cameraChunkX = Math.floor(cameraPosition.x / config.terrain.chunkSize);
            const cameraChunkZ = Math.floor(cameraPosition.z / config.terrain.chunkSize);
            
            // Load chunks around camera
            this.loadChunksAroundPosition(cameraChunkX, cameraChunkZ);
            
            // Unload distant chunks
            this.unloadDistantChunks(cameraChunkX, cameraChunkZ);
        },
        
        /**
         * Load chunks around a position
         * @param {number} centerX - Center chunk X coordinate
         * @param {number} centerZ - Center chunk Z coordinate
         */
        loadChunksAroundPosition(centerX, centerZ) {
            // Determine load distance from config
            const loadDistance = config.terrain.loadDistance;
            
            // Loop through chunks in the load area
            for (let z = centerZ - loadDistance; z <= centerZ + loadDistance; z++) {
                for (let x = centerX - loadDistance; x <= centerX + loadDistance; x++) {
                    // Create a unique key for this chunk
                    const chunkKey = `${x}_${z}`;
                    
                    // Check if chunk is already loaded
                    if (!loadedChunks.has(chunkKey)) {
                        // Load this chunk
                        this.loadChunk(x, z);
                    }
                }
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
                
                // Calculate distance in chunks
                const distanceX = Math.abs(x - centerX);
                const distanceZ = Math.abs(z - centerZ);
                const maxDistance = Math.max(distanceX, distanceZ);
                
                // Unload if too far away
                if (maxDistance > unloadDistance) {
                    this.unloadChunk(chunkKey);
                }
            }
        },
        
        /**
         * Load a specific chunk
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @returns {BABYLON.Mesh} The created terrain mesh
         */
        loadChunk(chunkX, chunkZ) {
            // Get settings from config
            const { chunkSize, chunkResolution, maxHeight } = config.terrain;
            
            // Generate heightmap data
            const heightmapData = heightmapGenerator.generateHeightmapForChunk(
                chunkX, chunkZ, chunkSize, chunkResolution, maxHeight
            );
            
            // Create terrain mesh
            const terrainMesh = terrainMeshBuilder.createTerrainMesh(
                heightmapData, terrainMaterial
            );
            
            // Store the mesh in loaded chunks
            const chunkKey = `${chunkX}_${chunkZ}`;
            loadedChunks.set(chunkKey, terrainMesh);
            
            console.log(`Loaded chunk ${chunkKey}`);
            
            return terrainMesh;
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
            
            // Load initial chunks in a grid around origin
            for (let z = -halfSize; z <= halfSize; z++) {
                for (let x = -halfSize; x <= halfSize; x++) {
                    this.loadChunk(x, z);
                }
            }
            
            // Set up update on each frame
            scene.onBeforeRenderObservable.add(() => {
                this.update();
            });
            
            console.log(`Initialized terrain with ${initialSize}x${initialSize} chunks`);
        },
        
        /**
         * Get the number of loaded chunks
         * @returns {number} The number of loaded chunks
         */
        getLoadedChunkCount() {
            return loadedChunks.size;
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
