/**
 * Global configuration settings for Infinite Horizons
 * Updated for better terrain generation
 */
export default {
    // Terrain generation settings
    terrain: {
        // Size of each chunk in world units
        chunkSize: 100,

        // Resolution of each chunk (vertices per side)
        chunkResolution: 33,
        
        // Maximum height of terrain
        maxHeight: 60, // Increased for more dramatic terrain
        
        // Number of chunks to load initially (as NxN grid)
        initialChunks: 3,
        
        // Distance (in chunks) from camera at which to load new chunks
        loadDistance: 3,
        
        // Distance (in chunks) from camera at which to unload chunks
        unloadDistance: 5,
        
        // Enable adaptive mesh resolution based on distance
        enableAdaptiveLOD: true,
        
        // Use enhanced shader-based materials
        useShaderMaterials: false
    },
    
    // Noise generation settings
    noise: {
        // Base noise scale (higher = more zoomed in)
        scale: 0.005, // Decreased from 0.01 for larger features
        
        // Number of octaves for fractal noise
        octaves: 6, // Increased from 4
        
        // Persistence factor for each octave (amplitude multiplier)
        persistence: 0.65, // Increased from 0.5 for more variation
        
        // Lacunarity factor for each octave (frequency multiplier)
        lacunarity: 2.2, // Adjusted from 2.0
        
        // Random seed for noise generation (42 is the answer!)
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
    
    // Material settings
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
        optimizeShaders: true,
        
        // Enable adaptive performance adjustments
        enableAdaptivePerformance: true,
        
        // FPS threshold for performance adjustments
        fpsThreshold: 30,
        
        // Interval for adaptive performance checks (ms)
        adaptiveCheckInterval: 2000,
        
        // Maximum number of visible chunks at once
        maxVisibleChunks: 32,
        
        // Frame skipping for chunk updates (update every N frames)
        skipFrames: 2,
        
        // Enable frustum culling for performance
        frustumCullingEnabled: true
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
        logShaders: false,
        
        // Show debug height visualization
        showHeightColors: false
    }
};