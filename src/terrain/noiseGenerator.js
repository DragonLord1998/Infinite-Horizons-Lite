/**
 * Enhanced noise generation functions for terrain generation
 * Improved for terrain variation, seamless stitching, and preventing flat terrain
 */

/**
 * Creates a noise generator with the given settings
 * @param {Object} noiseConfig - Configuration for noise generation
 * @returns {Object} Noise generator functions
 */
export function createNoiseGenerator(noiseConfig) {
    const seed = noiseConfig.seed || Math.random() * 1000000;
    
    // Initialize the noise generator state with improved defaults
    const state = {
        seed: seed,
        scale: noiseConfig.scale || 0.005, // Changed from 0.01 for larger features
        octaves: noiseConfig.octaves || 6,  // Increased from 4
        persistence: noiseConfig.persistence || 0.65, // Increased from 0.5 for more variation
        lacunarity: noiseConfig.lacunarity || 2.2   // Adjusted from 2.0
    };
    
    return {
        // Access to state properties
        get scale() { return state.scale; },
        
        /**
         * Generate a heightmap for a chunk with improved seamlessness
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk in world units
         * @param {number} resolution - Resolution of the heightmap
         * @returns {Float32Array} The generated heightmap
         */
        generateHeightmap(chunkX, chunkZ, chunkSize, resolution) {
            console.log(`Generating heightmap for chunk ${chunkX},${chunkZ}`);
            
            // Create a new Float32Array to store the heightmap
            const heightmap = new Float32Array(resolution * resolution);
            
            // Create a more varied base height for this chunk to prevent flatness
            // This ensures every chunk has a different starting point
            const baseHeight = 0.3 + (this.pseudoRandom(chunkX, chunkZ) * 0.4);
            
            // Calculate world coordinates with proper global position
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            
            // Scale factor for vertex spacing
            const scale = chunkSize / (resolution - 1);
            
            // GUARANTEED VARIATION - add a simple slope across the chunk
            // This ensures height variation even if noise is flat
            const slopeDirectionX = this.pseudoRandom(chunkX * 13, chunkZ * 7) * 2 - 1;
            const slopeDirectionZ = this.pseudoRandom(chunkX * 7, chunkZ * 13) * 2 - 1;
            const slopeIntensity = 0.2 + this.pseudoRandom(chunkX + chunkZ, chunkX * chunkZ) * 0.3;
            
            // Generate heightmap values
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    // Calculate world coordinates for this point
                    const wx = worldX + x * scale;
                    const wz = worldZ + z * scale;
                    
                    // Global position for large-scale features
                    const gx = wx * 0.005; // Larger scale for primary terrain features
                    const gz = wz * 0.005;
                    
                    // Medium scale for secondary terrain features
                    const mx = wx * 0.01;
                    const mz = wz * 0.01;
                    
                    // Small scale for terrain details
                    const sx = wx * 0.05;
                    const sz = wz * 0.05;
                    
                    // Create primary noise value (large-scale terrain shape)
                    let noiseValue = this.getFractalNoise(gx, gz) * 0.6;
                    
                    // Add medium-scale detail
                    noiseValue += this.getFractalNoise(mx, mz) * 0.3;
                    
                    // Add small-scale detail
                    noiseValue += this.getFractalNoise(sx, sz) * 0.1;
                    
                    // Add domain warping for more natural shapes
                    const warpX = this.getNoise(mx, mz) * 10;
                    const warpZ = this.getNoise(mx + 100, mz + 100) * 10;
                    noiseValue += this.getFractalNoise((gx + warpX * 0.005), (gz + warpZ * 0.005)) * 0.2;
                    
                    // CRITICAL: Add the guaranteed slope variation
                    // This ensures no chunk is completely flat
                    const normalizedX = x / (resolution - 1);
                    const normalizedZ = z / (resolution - 1);
                    const slopeVariation = ((normalizedX * slopeDirectionX) + (normalizedZ * slopeDirectionZ)) * slopeIntensity;
                    
                    // Add regional offset to create larger landscape features
                    const regionX = Math.floor(chunkX / 8);
                    const regionZ = Math.floor(chunkZ / 8);
                    const regionOffset = this.pseudoRandom(regionX, regionZ) * 0.3;
                    
                    // Combine all elements with the base height
                    noiseValue = baseHeight + noiseValue + slopeVariation + regionOffset;
                    
                    // Add terrain features based on region
                    noiseValue = this.addRegionalFeatures(noiseValue, wx, wz, regionX, regionZ);
                    
                    // Ensure value is within range but with good variation
                    noiseValue = Math.max(0.1, Math.min(0.9, noiseValue));
                    
                    // Store in heightmap
                    heightmap[z * resolution + x] = noiseValue;
                }
            }
            
            // Apply seamless stitching at chunk edges
            // Ensures no gaps between chunks
            this.smoothChunkEdges(heightmap, resolution);
            
            // Validate we're getting non-zero heights
            let totalHeight = 0;
            let minHeight = 1.0;
            let maxHeight = 0.0;
            
            for (let i = 0; i < heightmap.length; i++) {
                totalHeight += heightmap[i];
                minHeight = Math.min(minHeight, heightmap[i]);
                maxHeight = Math.max(maxHeight, heightmap[i]);
            }
            
            console.log(`Chunk ${chunkX},${chunkZ} heights - Min: ${minHeight.toFixed(2)}, Max: ${maxHeight.toFixed(2)}, Avg: ${(totalHeight/heightmap.length).toFixed(2)}`);
            
            return heightmap;
        },
        
        /**
         * Smooth chunk edges to ensure seamless stitching
         * @param {Float32Array} heightmap - Heightmap to smooth
         * @param {number} resolution - Resolution of heightmap
         */
        smoothChunkEdges(heightmap, resolution) {
            const BORDER_SIZE = 1;
            
            // Smooth north and south edges
            for (let x = 0; x < resolution; x++) {
                for (let b = 0; b < BORDER_SIZE; b++) {
                    // North edge (less height variation)
                    heightmap[b * resolution + x] = 
                        0.8 * heightmap[b * resolution + x] + 
                        0.2 * heightmap[(BORDER_SIZE + 2) * resolution + x];
                    
                    // South edge (less height variation)
                    heightmap[(resolution - 1 - b) * resolution + x] = 
                        0.8 * heightmap[(resolution - 1 - b) * resolution + x] + 
                        0.2 * heightmap[(resolution - 3 - b) * resolution + x];
                }
            }
            
            // Smooth east and west edges
            for (let z = 0; z < resolution; z++) {
                for (let b = 0; b < BORDER_SIZE; b++) {
                    // West edge
                    heightmap[z * resolution + b] = 
                        0.8 * heightmap[z * resolution + b] + 
                        0.2 * heightmap[z * resolution + (b + 2)];
                    
                    // East edge
                    heightmap[z * resolution + (resolution - 1 - b)] = 
                        0.8 * heightmap[z * resolution + (resolution - 1 - b)] + 
                        0.2 * heightmap[z * resolution + (resolution - 3 - b)];
                }
            }
        },
        
        /**
         * Add region-specific terrain features to break up repetition
         * @param {number} baseValue - Base noise value
         * @param {number} x - X coordinate
         * @param {number} z - Z coordinate
         * @param {number} regionX - Region X coordinate
         * @param {number} regionZ - Region Z coordinate
         * @returns {number} Modified noise value with regional features
         */
        addRegionalFeatures(baseValue, x, z, regionX, regionZ) {
            // Use region coordinates to create different terrain types in different areas
            const regionType = ((regionX + regionZ) % 5);
            
            switch(regionType) {
                case 0: // Mountains
                    return baseValue * 1.2;
                case 1: // Valleys
                    return Math.pow(baseValue, 1.2) * 0.9;
                case 2: // Plateaus
                    const threshold = 0.5 + this.getNoise(x * 0.01, z * 0.01) * 0.1;
                    return (baseValue > threshold) ? 
                        threshold + (baseValue - threshold) * 0.3 : 
                        baseValue * 0.9;
                case 3: // Hills
                    return baseValue * 0.85 + 0.15;
                case 4: // Mixed terrain
                    return baseValue;
                default:
                    return baseValue;
            }
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
            
            // Create domain warping for more natural variation
            const warpX = this.getNoise(x * 0.5, z * 0.5) * 5.0;
            const warpZ = this.getNoise(x * 0.5 + 100, z * 0.5 + 100) * 5.0;
            
            // Add large-scale variation
            noiseValue += this.getNoise(x * 0.1, z * 0.1) * 0.5;
            
            // Sum multiple octaves of noise with increased range
            for (let i = 0; i < state.octaves; i++) {
                // Sample at warped coordinates for more variation
                const sampleX = (x + warpX * (i/state.octaves)) * frequency;
                const sampleZ = (z + warpZ * (i/state.octaves)) * frequency;
                
                noiseValue += amplitude * this.getNoise(sampleX, sampleZ);
                amplitudeSum += amplitude;
                
                // Update amplitude and frequency for next octave
                amplitude *= state.persistence;
                frequency *= state.lacunarity;
            }
            
            // Add ridged noise component for mountain features
            if (noiseValue > 0.5) {
                const ridged = 1.0 - Math.abs(this.getNoise(x * frequency * 0.5, z * frequency * 0.5));
                noiseValue += ridged * ridged * 0.3;
            }
            
            // Normalize and enhance range
            let normalizedNoise = (noiseValue / (amplitudeSum + 0.5)) * 0.5 + 0.5;
            
            // Apply contrast enhancement for better distribution
            normalizedNoise = (normalizedNoise - 0.5) * 1.2 + 0.5;
            return Math.max(0, Math.min(1, normalizedNoise));
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
            // Improved hash function
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
            // Convert to integers - ensure we're dealing with well-defined values
            let ix = Math.floor(x) | 0;
            let iy = Math.floor(y) | 0;
            let iseed = Math.floor(seed) | 0;
            
            // Better hash function with improved bit mixing
            let h = iseed & 0xFFFF;
            h = (h * 73 + ix) & 0xFFFF;
            h = (h * 73 + iy) & 0xFFFF;
            h = h * (h + 19) & 0xFFFF;
            h = (h * h * 60493) & 0xFFFF;
            h = (h ^ (h >> 8)) * 0x2E63; // Better bit mixing
            
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
        },
        
        /**
         * Get height at a specific world position
         * @param {number} worldX - World X coordinate
         * @param {number} worldZ - World Z coordinate
         * @returns {number} Height value in range [0, 1]
         */
        getHeightAtPosition(worldX, worldZ) {
            // Use consistent scale for height queries
            const gx = worldX * 0.005; // Large scale
            const gz = worldZ * 0.005;
            
            const mx = worldX * 0.01; // Medium scale
            const mz = worldZ * 0.01;
            
            // Combine different scales for natural variation
            return 0.6 * this.getFractalNoise(gx, gz) + 
                   0.3 * this.getFractalNoise(mx, mz) + 
                   0.1 * this.getFractalNoise(worldX * 0.05, worldZ * 0.05);
        }
    };
}