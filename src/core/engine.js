/**
 * Sets up the Babylon.js engine
 */

/**
 * Creates and initializes the Babylon.js engine
 * @param {HTMLCanvasElement} canvas - The canvas element to render on
 * @returns {BABYLON.Engine} The initialized Babylon.js engine
 */
export function createEngine(canvas) {
    // Create the engine with antialiasing
    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
        doNotHandleContextLost: false,
    });
    
    // Log engine version
    console.log(`Babylon.js engine initialized, version: ${BABYLON.Engine.Version}`);
    
    // Check if WebGL2 is supported
    if (engine.webGLVersion === 2) {
        console.log('WebGL2 supported and enabled');
    } else {
        console.warn('WebGL2 not supported or enabled, some features may not work');
    }
    
    return engine;
}