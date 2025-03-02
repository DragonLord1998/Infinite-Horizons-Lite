/**
 * Main application entry point for Infinite Horizons
 */
import config from './config.js';
import { createEngine } from './core/engine.js';
import { createScene } from './core/scene.js';
import { setupCamera } from './core/camera.js';
import { initChunkManager } from './terrain/chunkManager.js';
import { setupCameraControls } from './controls/cameraControls.js';
import { initPerformanceMonitor } from './utils/performance.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Initialize the application
 */
async function initApp() {
    // Get the canvas element
    const canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    try {
        // Create the Babylon.js engine
        const engine = createEngine(canvas);
        
        // Create the scene
        const scene = createScene(engine);
        
        // Setup camera
        const camera = setupCamera(scene, config.camera);
        
        // Initialize terrain chunk manager
        const chunkManager = initChunkManager(scene, camera);
        
        // Setup camera controls
        setupCameraControls(scene, camera);
        
        // Initialize performance monitoring if enabled
        if (config.performance.enableStats) {
            initPerformanceMonitor(engine, scene, chunkManager);
        }
        
        // Enable inspector if in debug mode
        if (config.debug.enableInspector) {
            // FIXED: Updated debug layer initialization
            window.addEventListener('keydown', (event) => {
                // Ctrl+Shift+I to toggle inspector
                if (event.ctrlKey && event.shiftKey && event.code === 'KeyI') {
                    if (scene.debugLayer.isVisible()) {
                        scene.debugLayer.hide();
                    } else {
                        // Using the promise-based show method correctly
                        scene.debugLayer.show({
                            embedMode: true
                        }).catch(error => {
                            console.warn('Error showing debug layer:', error);
                        });
                    }
                }
            });
        }
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Start the render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            engine.resize();
        });
        
        console.log('Infinite Horizons initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = '<h1>Error</h1><p>Failed to initialize Infinite Horizons</p><pre>' + error + '</pre>';
        }
    }
}