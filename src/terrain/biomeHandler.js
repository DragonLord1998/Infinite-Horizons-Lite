/**
 * Biome generation and management for procedural materials
 * Added in Phase 2 to support material parameter control based on biomes
 */
import config from '../config.js';

/**
 * Create a biome handler for procedural terrain
 * @param {Object} noiseGenerator - Noise generator instance
 * @returns {Object} Biome handler object
 */
export function createBiomeHandler(noiseGenerator) {
    // Biome definitions with material parameters
    const biomes = {
        // Plains/grasslands biome
        plains: {
            name: 'Plains',
            grassColor: [0.3, 0.5, 0.2],
            rockColor: [0.5, 0.45, 0.4],
            snowColor: [0.9, 0.9, 0.95],
            sandColor: [0.76, 0.7, 0.5],
            snowHeight: 0.75,
            rockHeight: 0.4,
            sandHeight: 0.05,
            heightScale: 1.0,
            noiseScale: 1.0
        },
        
        // Mountains biome
        mountains: {
            name: 'Mountains',
            grassColor: [0.25, 0.4, 0.2],
            rockColor: [0.45, 0.43, 0.4],
            snowColor: [0.95, 0.95, 1.0],
            sandColor: [0.5, 0.45, 0.4],
            snowHeight: 0.55, // Snow starts lower in mountains
            rockHeight: 0.3,  // More rocks in mountains
            sandHeight: 0.1,
            heightScale: 1.4,  // Higher peaks
            noiseScale: 1.2    // More rugged
        },
        
        // Desert biome
        desert: {
            name: 'Desert',
            grassColor: [0.5, 0.48, 0.2],  // Yellowish grass
            rockColor: [0.6, 0.5, 0.35],  // Sandstone
            snowColor: [0.95, 0.95, 0.9],
            sandColor: [0.85, 0.75, 0.55],
            snowHeight: 0.8,  // Less snow
            rockHeight: 0.45, 
            sandHeight: 0.0,  // Sand starts at bottom
            heightScale: 0.8,  // Lower terrain
            noiseScale: 0.9    // Smoother
        },
        
        // Tundra biome
        tundra: {
            name: 'Tundra',
            grassColor: [0.35, 0.4, 0.3],  // Darker grass
            rockColor: [0.4, 0.4, 0.45],   // Darker rock
            snowColor: [0.9, 0.9, 0.95],
            sandColor: [0.45, 0.4, 0.35],  // Darker sand
            snowHeight: 0.4,  // Snow starts much lower
            rockHeight: 0.25, 
            sandHeight: 0.1,
            heightScale: 0.9,
            noiseScale: 0.8
        }
    };
    
    // Return the biome handler object
    return {
        /**
         * Get all defined biomes
         * @returns {Object} All biome definitions
         */
        getAllBiomes() {
            return biomes;
        },
        
        /**
         * Get a specific biome definition
         * @param {string} biomeName - Name of the biome to get
         * @returns {Object} Biome definition or plains biome if not found
         */
        getBiome(biomeName) {
            return biomes[biomeName] || biomes.plains;
        },
        
        /**
         * Determine the biome type based on world position
         * @param {number} worldX - World X coordinate
         * @param {number} worldZ - World Z coordinate
         * @returns {string} Biome type name
         */
        getBiomeTypeAtPosition(worldX, worldZ) {
            // Use noise to determine biome type
            // Scale down coordinates for larger biome regions
            const nx = worldX * 0.001;
            const nz = worldZ * 0.001;
            
            // Get biome noise value
            const biomeNoise = noiseGenerator.getNoise(nx, nz);
            const elevation = noiseGenerator.getFractalNoise(nx * 2, nz * 2);
            const moisture = noiseGenerator.getFractalNoise(nx + 100, nz + 100);
            
            // Determine biome based on elevation and moisture
            if (elevation > 0.65) {
                return 'mountains';
            } else if (moisture < 0.3) {
                return 'desert';
            } else if (moisture > 0.7 && elevation > 0.4) {
                return 'tundra';
            } else {
                return 'plains';
            }
        },
        
        /**
         * Generate biome data for a chunk
         * @param {number} chunkX - Chunk X coordinate
         * @param {number} chunkZ - Chunk Z coordinate
         * @param {number} chunkSize - Size of the chunk
         * @param {number} resolution - Resolution of the chunk
         * @returns {Object} Biome data for the chunk
         */
        generateBiomeData(chunkX, chunkZ, chunkSize, resolution) {
            // Calculate world position of chunk center
            const centerX = (chunkX + 0.5) * chunkSize;
            const centerZ = (chunkZ + 0.5) * chunkSize;
            
            // Determine primary biome at chunk center
            const primaryBiomeType = this.getBiomeTypeAtPosition(centerX, centerZ);
            const primaryBiome = this.getBiome(primaryBiomeType);
            
            // Generate biome blend map for the chunk
            const blendMap = new Float32Array(resolution * resolution);
            
            // Calculate world corners of the chunk
            const worldX = chunkX * chunkSize;
            const worldZ = chunkZ * chunkSize;
            const worldEndX = worldX + chunkSize;
            const worldEndZ = worldZ + chunkSize;
            
            // Generate a 2D array of biome types across the chunk
            // This lets us determine boundaries for blending
            const biomeTypes = [];
            for (let z = 0; z < 4; z++) {
                biomeTypes[z] = [];
                for (let x = 0; x < 4; x++) {
                    const sampleX = worldX + (chunkSize * x / 3);
                    const sampleZ = worldZ + (chunkSize * z / 3);
                    biomeTypes[z][x] = this.getBiomeTypeAtPosition(sampleX, sampleZ);
                }
            }
            
            // Determine secondary biome based on neighboring biome types
            let secondaryBiomeType = primaryBiomeType;
            let hasDifferentBiome = false;
            
            // Look for a different biome in the samples
            for (let z = 0; z < 4; z++) {
                for (let x = 0; x < 4; x++) {
                    if (biomeTypes[z][x] !== primaryBiomeType) {
                        secondaryBiomeType = biomeTypes[z][x];
                        hasDifferentBiome = true;
                        break;
                    }
                }
                if (hasDifferentBiome) break;
            }
            
            // If no different biome was found, choose a logical neighbor
            if (!hasDifferentBiome) {
                if (primaryBiomeType === 'plains') {
                    secondaryBiomeType = Math.random() > 0.5 ? 'mountains' : 'desert';
                } else if (primaryBiomeType === 'mountains') {
                    secondaryBiomeType = Math.random() > 0.5 ? 'plains' : 'tundra';
                } else if (primaryBiomeType === 'desert') {
                    secondaryBiomeType = 'plains';
                } else if (primaryBiomeType === 'tundra') {
                    secondaryBiomeType = 'mountains';
                }
            }
            
            const secondaryBiome = this.getBiome(secondaryBiomeType);
            
            // Generate a blend map between primary and secondary biomes
            // This is a simplified version - a more sophisticated approach would
            // use the actual biome boundaries
            for (let z = 0; z < resolution; z++) {
                for (let x = 0; x < resolution; x++) {
                    // Calculate world position for this vertex
                    const wx = worldX + (chunkSize * x / (resolution - 1));
                    const wz = worldZ + (chunkSize * z / (resolution - 1));
                    
                    // Use noise to create natural biome boundaries
                    const blendNoise = noiseGenerator.getNoise(wx * 0.01, wz * 0.01);
                    
                    // Calculate distance from chunk center as a factor (0-1)
                    const dx = (wx - centerX) / chunkSize;
                    const dz = (wz - centerZ) / chunkSize;
                    const distFactor = Math.sqrt(dx * dx + dz * dz) * 2; // 0 at center, ~1 at corners
                    
                    // Increase blend factor near edges
                    let blendFactor = (blendNoise * 0.5 + 0.5) * 0.7 + (distFactor * 0.3);
                    
                    // Emphasize primary biome in the center
                    blendFactor = Math.max(0, Math.min(1, blendFactor));
                    
                    // Store in blend map
                    blendMap[z * resolution + x] = blendFactor;
                }
            }
            
            return {
                primaryBiomeType,
                secondaryBiomeType,
                primaryBiome,
                secondaryBiome,
                blendMap
            };
        },
        
        /**
         * Apply biome settings to a shader material
         * @param {BABYLON.ShaderMaterial} material - Shader material
         * @param {string} biomeName - Name of the biome to apply
         */
        applyBiomeToMaterial(material, biomeName) {
            const biome = this.getBiome(biomeName);
            
            // Apply biome colors
            material.setColor3("grassColor", 
                new BABYLON.Color3(biome.grassColor[0], biome.grassColor[1], biome.grassColor[2]));
            
            material.setColor3("rockColor", 
                new BABYLON.Color3(biome.rockColor[0], biome.rockColor[1], biome.rockColor[2]));
            
            material.setColor3("snowColor", 
                new BABYLON.Color3(biome.snowColor[0], biome.snowColor[1], biome.snowColor[2]));
            
            material.setColor3("sandColor", 
                new BABYLON.Color3(biome.sandColor[0], biome.sandColor[1], biome.sandColor[2]));
            
            // Apply height transitions
            material.setFloat("snowHeight", biome.snowHeight);
            material.setFloat("rockHeight", biome.rockHeight);
            material.setFloat("sandHeight", biome.sandHeight);
            
            // Apply scaling factors
            material.setFloat("heightScale", biome.heightScale);
            material.setFloat("noiseScale", biome.noiseScale);
        },
        
        /**
         * Blend between two biomes based on a blend factor
         * @param {string} biome1Name - First biome name
         * @param {string} biome2Name - Second biome name
         * @param {number} blendFactor - Blend factor (0-1, 0 = fully biome1, 1 = fully biome2)
         * @returns {Object} Blended biome parameters
         */
        blendBiomes(biome1Name, biome2Name, blendFactor) {
            const biome1 = this.getBiome(biome1Name);
            const biome2 = this.getBiome(biome2Name);
            
            // Ensure blend factor is within range
            const blend = Math.max(0, Math.min(1, blendFactor));
            
            // Create a new blended biome
            const blendedBiome = {
                name: `Blend(${biome1.name}-${biome2.name})`,
                
                // Blend colors
                grassColor: lerpColors(biome1.grassColor, biome2.grassColor, blend),
                rockColor: lerpColors(biome1.rockColor, biome2.rockColor, blend),
                snowColor: lerpColors(biome1.snowColor, biome2.snowColor, blend),
                sandColor: lerpColors(biome1.sandColor, biome2.sandColor, blend),
                
                // Blend height transitions
                snowHeight: lerp(biome1.snowHeight, biome2.snowHeight, blend),
                rockHeight: lerp(biome1.rockHeight, biome2.rockHeight, blend),
                sandHeight: lerp(biome1.sandHeight, biome2.sandHeight, blend),
                
                // Blend scaling factors
                heightScale: lerp(biome1.heightScale, biome2.heightScale, blend),
                noiseScale: lerp(biome1.noiseScale, biome2.noiseScale, blend)
            };
            
            return blendedBiome;
        }
    };
}

/**
 * Linear interpolation between two values
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
    return a + t * (b - a);
}

/**
 * Linear interpolation between two colors
 * @param {Array} color1 - First color [r, g, b]
 * @param {Array} color2 - Second color [r, g, b]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Array} Interpolated color [r, g, b]
 */
function lerpColors(color1, color2, t) {
    return [
        lerp(color1[0], color2[0], t),
        lerp(color1[1], color2[1], t),
        lerp(color1[2], color2[2], t)
    ];
}
