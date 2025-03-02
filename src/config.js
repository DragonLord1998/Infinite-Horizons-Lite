/**
 * Global configuration settings for Infinite Horizons (Phase 2)
 */
export default {
    // Terrain generation settings
    terrain: {
        // Size of each chunk in world units
        chunkSize: 100,

        //useShaderMaterials: false,
        // Resolution of each chunk (vertices per side)
        chunkResolution: 33,
        
        // Maximum height of terrain
        maxHeight: 50,
        
        // Number of chunks to load initially (as NxN grid)
        initialChunks: 3,
        
        // Distance (in chunks) from camera at which to load new chunks
        loadDistance: 3,
        
        // Distance (in chunks) from camera at which to unload chunks
        unloadDistance: 5,
        
        // Enable adaptive mesh resolution based on distance
        enableAdaptiveLOD: true,
        
        // Use enhanced shader-based materials
        useShaderMaterials: true
    },
    
    // Noise generation settings
    noise: {
        // Base noise scale (higher = more zoomed in)
        scale: 0.01,
        
        // Number of octaves for fractal noise
        octaves: 5, // Increased for more detail in Phase 2
        
        // Persistence factor for each octave (amplitude multiplier)
        persistence: 0.5,
        
        // Lacunarity factor for each octave (frequency multiplier)
        lacunarity: 2.0,
        
        // Random seed for noise generation
        seed: 42
    },
    
    // Camera settings
    camera: {
        // Initial camera position [x, y, z]
        initialPosition: [0, 80, -80],
        
        // Camera movement speed
        moveSpeed: 1.0,
        
        // Camera rotation speed
        rotationSpeed: 0.005,
        
        // Field of view in radians
        fov: Math.PI / 4,
        
        // Camera collision settings
        collisionEnabled: true,
        
        // Height above terrain in walking mode
        walkingHeight: 2.0
    },
    
    // Material settings (new in Phase 2)
    materials: {
        // Grass material settings
        grass: {
            color: [0.3, 0.5, 0.2],
            roughness: 0.8
        },
        
        // Rock material settings
        rock: {
            color: [0.5, 0.45, 0.4],
            roughness: 0.9
        },
        
        // Snow material settings
        snow: {
            color: [0.9, 0.9, 0.95],
            roughness: 0.7
        },
        
        // Sand material settings
        sand: {
            color: [0.76, 0.7, 0.5],
            roughness: 0.6
        }
    },
    
    // Performance settings
    performance: {
        // Enable performance monitoring
        enableStats: true,
        
        // Update interval for stats in milliseconds
        statsUpdateInterval: 1000,
        
        // Enable shader optimization
        optimizeShaders: true
    },
    
    // Debug settings
    debug: {
        // Enable Babylon Inspector (press Shift+Ctrl+I to open)
        enableInspector: true,
        
        // Show chunk boundaries for debugging
        showChunkBoundaries: false,
        
        // Show wireframe overlay on terrain
        showWireframe: false,
        
        // Log shader compilation
        logShaders: false
    }
};