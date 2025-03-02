/**
 * Enhanced noise generation functions for terrain generation
 */

/**
 * Creates a noise generator with the given settings
 * @param {Object} noiseConfig - Configuration for noise generation
 * @returns {Object} Noise generator functions
 */
export function createNoiseGenerator(noiseConfig) {
    const seed = noiseConfig.seed || Math.random() * 1000000;
    
    // Initialize the noise generator state
    const state = {
        seed: seed,
        scale: noiseConfig.scale || 0.01,
        octaves: noiseConfig.octaves || 4,
        persistence: noiseConfig.persistence || 0.5,
        lacunarity: noiseConfig.lacunarity || 2.0
    };
    
    return {
        /**
         * Generate a heightmap for a chunk
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk in world units
         * @param {number} resolution - Resolution of the heightmap
         * @returns {Float32Array} The generated heightmap
         */
        generateHeightmap(chunkX, chunkZ, chunkSize, resolution) {
            // Create a new Float32Array to store the heightmap
            const heightmap = new Float32Array(resolution * resolution);
            
            // Calculate the world position of the chunk's corner
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Scale factor to convert from grid coordinates to world coordinates
            const scale = chunkSize / (resolution - 1);
            
            // Generate heightmap values with additional noise variations
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    // Calculate world coordinates for this point
                    const wx = worldX + x * scale;
                    const wz = worldZ + z * scale;
                    
                    // Get base noise value
                    let noiseValue = this.getFractalNoise(wx, wz);
                    
                    // Apply terrain enhancements
                    noiseValue = this.enhanceTerrain(wx, wz, noiseValue);
                    
                    // Store in the heightmap array
                    heightmap[z * resolution + x] = noiseValue;
                }
            }
            
            return heightmap;
        },
        
        /**
         * Enhance terrain with additional features
         * @param {number} x - X coordinate in world space
         * @param {number} z - Z coordinate in world space
         * @param {number} baseNoise - Base noise value
         * @returns {number} Enhanced noise value
         */
        enhanceTerrain(x, z, baseNoise) {
            // Add ridged noise for mountains
            const ridgedNoise = this.getRidgedNoise(x, z) * 0.3;
            
            // Add warped noise for valleys
            const warpedNoise = this.getWarpedNoise(x, z) * 0.15;
            
            // Combine different noise types
            let enhancedNoise = baseNoise * 0.6 + ridgedNoise + warpedNoise;
            
            // Apply plateaus
            enhancedNoise = this.applyPlateaus(enhancedNoise);
            
            // Ensure value is in [0, 1] range
            return Math.max(0, Math.min(1, enhancedNoise));
        },
        
        /**
         * Apply plateaus to create more interesting terrain features
         * @param {number} noiseValue - Input noise value
         * @returns {number} Noise with plateau effects
         */
        applyPlateaus(noiseValue) {
            // Create plateaus by slightly flattening certain height ranges
            if (noiseValue > 0.75) {
                // Flatten high peaks slightly
                return 0.75 + (noiseValue - 0.75) * 0.8;
            } else if (noiseValue > 0.5 && noiseValue < 0.58) {
                // Create a mid-level plateau
                return 0.5 + (noiseValue - 0.5) * 0.3;
            } else if (noiseValue < 0.2) {
                // Flatten low areas for valleys
                return noiseValue * 0.9;
            }
            
            return noiseValue;
        },
        
        /**
         * Generate fractal noise (multiple octaves of noise)
         * @param {number} x - X coordinate in world space
         * @param {number} z - Z coordinate in world space
         * @returns {number} Noise value in range [0, 1]
         */
        getFractalNoise(x, z) {
            let amplitude = 1.0;
            let frequency = state.scale;
            let noiseValue = 0;
            let amplitudeSum = 0;
            
            // Sum multiple octaves of noise
            for (let i = 0; i < state.octaves; i++) {
                // Add scaled noise value for this octave
                noiseValue += amplitude * this.getNoise(x * frequency, z * frequency);
                
                // Track total amplitude for normalization
                amplitudeSum += amplitude;
                
                // Update amplitude and frequency for next octave
                amplitude *= state.persistence;
                frequency *= state.lacunarity;
            }
            
            // Normalize the result to [0, 1]
            return (noiseValue / amplitudeSum) * 0.5 + 0.5;
        },
        
        /**
         * Generate ridged noise (absolute value of noise with inversion)
         * @param {number} x - X coordinate in world space
         * @param {number} z - Z coordinate in world space
         * @returns {number} Ridged noise value in range [0, 1]
         */
        getRidgedNoise(x, z) {
            let amplitude = 1.0;
            let frequency = state.scale * 1.8; // Different base frequency
            let noiseValue = 0;
            let amplitudeSum = 0;
            
            // Sum multiple octaves
            for (let i = 0; i < state.octaves; i++) {
                // Get noise value
                let n = this.getNoise(x * frequency, z * frequency);
                
                // Make ridged by taking absolute value and inverting
                n = 1.0 - Math.abs(n);
                
                // Square the result to create sharper ridges
                n *= n;
                
                // Add to sum
                noiseValue += n * amplitude;
                amplitudeSum += amplitude;
                
                // Update for next octave
                amplitude *= state.persistence;
                frequency *= state.lacunarity;
            }
            
            // Normalize the result to [0, 1]
            return (noiseValue / amplitudeSum);
        },
        
        /**
         * Generate domain-warped noise for more natural terrain
         * @param {number} x - X coordinate in world space
         * @param {number} z - Z coordinate in world space
         * @returns {number} Warped noise value in range [0, 1]
         */
        getWarpedNoise(x, z) {
            // Apply domain warping by using noise to offset sampling coordinates
            const warpX = this.getNoise(x * state.scale * 0.5, z * state.scale * 0.5) * 10.0;
            const warpZ = this.getNoise(x * state.scale * 0.5 + 100, z * state.scale * 0.5 + 100) * 10.0;
            
            // Sample noise at the warped location
            return this.getFractalNoise(x + warpX, z + warpZ);
        },
        
        /**
         * Get raw noise value at coordinates
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {number} Noise value in range [-1, 1]
         */
        getNoise(x, y) {
            // Get integer and fractional parts
            const xi = Math.floor(x);
            const yi = Math.floor(y);
            const xf = x - xi;
            const yf = y - yi;
            
            // Get values for corners of the grid cell
            const n00 = this.pseudoRandom(xi, yi);
            const n01 = this.pseudoRandom(xi, yi + 1);
            const n10 = this.pseudoRandom(xi + 1, yi);
            const n11 = this.pseudoRandom(xi + 1, yi + 1);
            
            // Smooth interpolation using quintic curve
            const u = this.smootherstep(xf);
            const v = this.smootherstep(yf);
            
            // Bilinear interpolation
            const nx0 = this.lerp(n00, n10, u);
            const nx1 = this.lerp(n01, n11, u);
            const nxy = this.lerp(nx0, nx1, v);
            
            return nxy * 2 - 1; // Scale to [-1, 1]
        },
        
        /**
         * Generate pseudo-random value from coordinates
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {number} Random value in range [0, 1]
         */
        pseudoRandom(x, y) {
            // Simple but effective hash function
            const h = this.hashFunction(x, y, state.seed);
            return h / 4294967296; // Convert to [0, 1]
        },
        
        /**
         * Hash function for generating deterministic random values
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @param {number} seed - Random seed
         * @returns {number} Integer hash value
         */
        hashFunction(x, y, seed) {
            // Convert to integers
            let ix = Math.floor(x);
            let iy = Math.floor(y);
            let iseed = Math.floor(seed);
            
            // Improved hash function for better distribution
            let h = iseed & 0xFFFF;
            h = (h * 73 + ix) & 0xFFFF;
            h = (h * 73 + iy) & 0xFFFF;
            h = h * (h + 19) & 0xFFFF;
            h = (h * h * 60493) & 0xFFFF;
            
            return h;
        },
        
        /**
         * Linear interpolation
         * @param {number} a - First value
         * @param {number} b - Second value
         * @param {number} t - Interpolation factor in range [0, 1]
         * @returns {number} Interpolated value
         */
        lerp(a, b, t) {
            return a + t * (b - a);
        },
        
        /**
         * Smoother step function - better than Smoothstep for noise
         * @param {number} t - Input in range [0, 1]
         * @returns {number} Smoothed value in range [0, 1]
         */
        smootherstep(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }
    };
}
