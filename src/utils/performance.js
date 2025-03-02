/**
 * Performance monitoring utilities
 */
import config from '../config.js';

/**
 * Initialize performance monitoring
 * @param {BABYLON.Engine} engine - The Babylon.js engine
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} chunkManager - The terrain chunk manager
 * @returns {Object} Performance monitoring object
 */
export function initPerformanceMonitor(engine, scene, chunkManager) {
    // Get DOM elements for displaying stats
    const fpsElement = document.getElementById('fps');
    const chunkCountElement = document.getElementById('chunkCount');
    const vertexCountElement = document.getElementById('vertexCount');
    
    // Create performance monitoring object
    const performanceMonitor = {
        // Stats
        fps: 0,
        frameTime: 0,
        chunkCount: 0,
        vertexCount: 0,
        triangleCount: 0,
        drawCalls: 0,
        
        // Timing data
        lastUpdate: performance.now(),
        
        /**
         * Update stats
         */
        update() {
            // Update stats only at the configured interval
            const now = performance.now();
            if (now - this.lastUpdate < config.performance.statsUpdateInterval) {
                return;
            }
            
            // Update timing
            this.lastUpdate = now;
            
            // Update FPS and frame time
            this.fps = Math.round(engine.getFps());
            this.frameTime = Math.round(1000 / this.fps);
            
            // Update terrain stats
            this.chunkCount = chunkManager.getLoadedChunkCount();
            this.vertexCount = chunkManager.getTotalVertexCount();
            
            // Update rendering stats - FIXED: using proper method to calculate triangles
            this.triangleCount = scene.getActiveIndices() ? scene.getActiveIndices().length / 3 : 0;
            this.drawCalls = engine.drawCalls;
            
            // Update DOM elements if they exist
            this.updateDOM();
        },
        
        /**
         * Update DOM elements with current stats
         */
        updateDOM() {
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
            
            if (chunkCountElement) {
                chunkCountElement.textContent = this.chunkCount;
            }
            
            if (vertexCountElement) {
                vertexCountElement.textContent = this.formatNumber(this.vertexCount);
            }
        },
        
        /**
         * Format a number with commas for readability
         * @param {number} num - Number to format
         * @returns {string} Formatted number
         */
        formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        
        /**
         * Start a named performance measurement
         * @param {string} name - Name of the measurement
         */
        startMeasure(name) {
            performance.mark(`${name}-start`);
        },
        
        /**
         * End a named performance measurement and log results
         * @param {string} name - Name of the measurement
         * @param {boolean} log - Whether to log the result to console
         * @returns {number} Duration in milliseconds
         */
        endMeasure(name, log = true) {
            performance.mark(`${name}-end`);
            
            try {
                performance.measure(name, `${name}-start`, `${name}-end`);
                const duration = performance.getEntriesByName(name)[0].duration;
                
                if (log) {
                    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
                }
                
                // Clean up performance entries
                performance.clearMarks(`${name}-start`);
                performance.clearMarks(`${name}-end`);
                performance.clearMeasures(name);
                
                return duration;
            } catch (e) {
                console.error(`Failed to measure ${name}:`, e);
                return 0;
            }
        }
    };
    
    // Set up the update callback
    scene.onBeforeRenderObservable.add(() => {
        performanceMonitor.update();
    });
    
    // Return the performance monitor
    return performanceMonitor;
}