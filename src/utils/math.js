/**
 * Math utility functions
 */

/**
 * Linearly interpolate between two values
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} t - Interpolation factor in range [0, 1]
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + t * (b - a);
}

/**
 * Smoothly interpolate between two values using a cubic function
 * @param {number} a - First value
 * @param {number} b - Second value
 * @param {number} t - Interpolation factor in range [0, 1]
 * @returns {number} Interpolated value
 */
export function smoothLerp(a, b, t) {
    // Apply smoothstep to t
    const s = t * t * (3 - 2 * t);
    return lerp(a, b, s);
}

/**
 * Clamp a value between a minimum and maximum
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Calculate the distance between two points in 2D
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @returns {number} Distance between points
 */
export function distance2D(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the distance between two points in 3D
 * @param {number} x1 - X coordinate of first point
 * @param {number} y1 - Y coordinate of first point
 * @param {number} z1 - Z coordinate of first point
 * @param {number} x2 - X coordinate of second point
 * @param {number} y2 - Y coordinate of second point
 * @param {number} z2 - Z coordinate of second point
 * @returns {number} Distance between points
 */
export function distance3D(x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Hash function for deterministic random values
 * @param {number} x - X input value
 * @param {number} y - Y input value
 * @param {number} seed - Random seed
 * @returns {number} Integer hash value
 */
export function hash(x, y, seed = 0) {
    // Convert to integers
    let ix = Math.floor(x);
    let iy = Math.floor(y);
    let iseed = Math.floor(seed);
    
    // Hash function based on bit manipulation
    let h = iseed & 0xFFFF;
    h = (h * 73 + ix) & 0xFFFF;
    h = (h * 73 + iy) & 0xFFFF;
    h = (h * 73 + h) & 0xFFFF;
    
    return h;
}

/**
 * Get a deterministic random value from a hash
 * @param {number} hash - Hash value
 * @returns {number} Random value in range [0, 1]
 */
export function hashToFloat(hash) {
    return hash / 65536; // Convert to [0, 1]
}
