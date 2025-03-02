/**
 * Global configuration settings for Infinite Horizons
 */
export default {
    // Terrain generation settings
    terrain: {
        // Size of each chunk in world units
        chunkSize: 100,
        
        // Resolution of each chunk (vertices per side)
        // REDUCED from 128 to 33 (32 segments) which is much more reasonable
        chunkResolution: 33,
        
        // Maximum height of terrain
        maxHeight: 50,
        
        // Number of chunks to load initially (as NxN grid)
        initialChunks: 3,
        
        // Distance (in chunks) from camera at which to load new chunks
        loadDistance: 2,
        
        // Distance (in chunks) from camera at which to unload chunks
        unloadDistance: 4,
        
        // Enable adaptive mesh resolution based on distance
        enableAdaptiveLOD: true
    },
    
    // Noise generation settings
    noise: {
        // Base noise scale (higher = more zoomed in)
        scale: 0.01,
        
        // Number of octaves for fractal noise
        octaves: 4,
        
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
        fov: Math.PI / 4
    },
    
    // Performance settings
    performance: {
        // Enable performance monitoring
        enableStats: true,
        
        // Update interval for stats in milliseconds
        statsUpdateInterval: 1000
    },
    
    // Debug settings
    debug: {
        // Enable Babylon Inspector (press Shift+Ctrl+I to open)
        enableInspector: true,
        
        // Show chunk boundaries for debugging
        showChunkBoundaries: false,
        
        // Show wireframe overlay on terrain
        showWireframe: false
    }
};