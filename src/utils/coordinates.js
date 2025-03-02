/**
 * Coordinate system utilities
 */

/**
 * Convert world coordinates to chunk coordinates
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldZ - Z coordinate in world space
 * @param {number} chunkSize - Size of chunks in world units
 * @returns {Object} Chunk coordinates {x, z}
 */
export function worldToChunkCoordinates(worldX, worldZ, chunkSize) {
    return {
        x: Math.floor(worldX / chunkSize),
        z: Math.floor(worldZ / chunkSize)
    };
}

/**
 * Convert chunk coordinates to world coordinates (chunk origin)
 * @param {number} chunkX - X coordinate in chunk space
 * @param {number} chunkZ - Z coordinate in chunk space
 * @param {number} chunkSize - Size of chunks in world units
 * @returns {Object} World coordinates {x, z}
 */
export function chunkToWorldCoordinates(chunkX, chunkZ, chunkSize) {
    return {
        x: chunkX * chunkSize,
        z: chunkZ * chunkSize
    };
}

/**
 * Convert world coordinates to local chunk coordinates
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldZ - Z coordinate in world space
 * @param {number} chunkSize - Size of chunks in world units
 * @returns {Object} Local coordinates within chunk {x, z}
 */
export function worldToLocalChunkCoordinates(worldX, worldZ, chunkSize) {
    return {
        x: ((worldX % chunkSize) + chunkSize) % chunkSize,
        z: ((worldZ % chunkSize) + chunkSize) % chunkSize
    };
}

/**
 * Convert local chunk coordinates to world coordinates
 * @param {number} localX - X coordinate within chunk
 * @param {number} localZ - Z coordinate within chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} chunkSize - Size of chunks in world units
 * @returns {Object} World coordinates {x, z}
 */
export function localChunkToWorldCoordinates(localX, localZ, chunkX, chunkZ, chunkSize) {
    return {
        x: chunkX * chunkSize + localX,
        z: chunkZ * chunkSize + localZ
    };
}

/**
 * Convert world coordinates to heightmap grid coordinates
 * @param {number} worldX - X coordinate in world space
 * @param {number} worldZ - Z coordinate in world space
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} chunkSize - Size of chunks in world units
 * @param {number} resolution - Resolution of heightmap (vertices per side)
 * @returns {Object} Grid coordinates {x, z} in heightmap
 */
export function worldToGridCoordinates(worldX, worldZ, chunkX, chunkZ, chunkSize, resolution) {
    // Get local coordinates within chunk
    const local = worldToLocalChunkCoordinates(worldX, worldZ, chunkSize);
    
    // Scale to grid coordinates
    const scale = (resolution - 1) / chunkSize;
    return {
        x: Math.floor(local.x * scale),
        z: Math.floor(local.z * scale)
    };
}

/**
 * Convert grid coordinates to world coordinates
 * @param {number} gridX - X coordinate in heightmap grid
 * @param {number} gridZ - Z coordinate in heightmap grid
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @param {number} chunkSize - Size of chunks in world units
 * @param {number} resolution - Resolution of heightmap (vertices per side)
 * @returns {Object} World coordinates {x, z}
 */
export function gridToWorldCoordinates(gridX, gridZ, chunkX, chunkZ, chunkSize, resolution) {
    // Scale from grid to local chunk coordinates
    const scale = chunkSize / (resolution - 1);
    const localX = gridX * scale;
    const localZ = gridZ * scale;
    
    // Convert to world coordinates
    return localChunkToWorldCoordinates(localX, localZ, chunkX, chunkZ, chunkSize);
}

/**
 * Calculate Manhattan distance between two chunk coordinates
 * @param {number} chunkX1 - First chunk X coordinate
 * @param {number} chunkZ1 - First chunk Z coordinate
 * @param {number} chunkX2 - Second chunk X coordinate
 * @param {number} chunkZ2 - Second chunk Z coordinate
 * @returns {number} Manhattan distance in chunks
 */
export function chunkManhattanDistance(chunkX1, chunkZ1, chunkX2, chunkZ2) {
    return Math.abs(chunkX2 - chunkX1) + Math.abs(chunkZ2 - chunkZ1);
}

/**
 * Calculate Chebyshev distance between two chunk coordinates
 * @param {number} chunkX1 - First chunk X coordinate
 * @param {number} chunkZ1 - First chunk Z coordinate
 * @param {number} chunkX2 - Second chunk X coordinate
 * @param {number} chunkZ2 - Second chunk Z coordinate
 * @returns {number} Chebyshev distance in chunks
 */
export function chunkChebyshevDistance(chunkX1, chunkZ1, chunkX2, chunkZ2) {
    return Math.max(Math.abs(chunkX2 - chunkX1), Math.abs(chunkZ2 - chunkZ1));
}

/**
 * Generate a unique key for a chunk
 * @param {number} chunkX - Chunk X coordinate
 * @param {number} chunkZ - Chunk Z coordinate
 * @returns {string} Unique key for the chunk
 */
export function getChunkKey(chunkX, chunkZ) {
    return `${chunkX}_${chunkZ}`;
}

/**
 * Parse chunk coordinates from a chunk key
 * @param {string} chunkKey - Chunk key
 * @returns {Object} Chunk coordinates {x, z}
 */
export function parseChunkKey(chunkKey) {
    const [x, z] = chunkKey.split('_').map(Number);
    return { x, z };
}

/**
 * Get neighboring chunk coordinates
 * @param {number} chunkX - Center chunk X coordinate
 * @param {number} chunkZ - Center chunk Z coordinate
 * @param {boolean} includeDiagonals - Whether to include diagonal neighbors
 * @returns {Array} Array of neighboring chunk coordinates
 */
export function getNeighboringChunks(chunkX, chunkZ, includeDiagonals = false) {
    const neighbors = [
        { x: chunkX + 1, z: chunkZ },
        { x: chunkX - 1, z: chunkZ },
        { x: chunkX, z: chunkZ + 1 },
        { x: chunkX, z: chunkZ - 1 }
    ];
    
    if (includeDiagonals) {
        neighbors.push(
            { x: chunkX + 1, z: chunkZ + 1 },
            { x: chunkX + 1, z: chunkZ - 1 },
            { x: chunkX - 1, z: chunkZ + 1 },
            { x: chunkX - 1, z: chunkZ - 1 }
        );
    }
    
    return neighbors;
}
