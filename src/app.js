/**
 * Main application entry point for Infinite Horizons (Phase 2)
 * With robust debugging and explicit progress tracking
 */
import config from './config.js';
import { createEngine } from './core/engine.js';
import { createScene } from './core/scene.js';
import { setupCamera } from './core/camera.js';
import { initChunkManager } from './terrain/chunkManager.js';
import { setupEnhancedCameraControls } from './controls/enhancedCameraControls.js';
import { initPerformanceMonitor } from './utils/performance.js';
import { initUI } from './utils/uiHelper.js';

// Use the most basic material approach that we know works
const createSimpleMaterial = (scene) => {
    console.log("Creating simple PBR material");
    const material = new BABYLON.PBRMaterial("terrainMaterial", scene);
    material.metallic = 0;
    material.roughness = 0.8;
    material.albedoColor = new BABYLON.Color3(0.3, 0.5, 0.2); // Green grass base
    material.useVertexColors = true;
    return material;
};

// Update loading progress
function updateLoadingProgress(message, percent) {
    console.log(`Loading progress: ${percent}% - ${message}`);
    const loadingText = document.getElementById('loadingText');
    const progressBar = document.getElementById('progressBar');
    
    if (loadingText) {
        loadingText.textContent = message;
    }
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing app");
    updateLoadingProgress("Starting initialization...", 5);
    
    // Delay slightly to ensure UI updates
    setTimeout(initApp, 100);
});

/**
 * Initialize the application with explicit step tracking
 */
async function initApp() {
    console.log("initApp started");
    
    try {
        // Step 1: Get the canvas
        updateLoadingProgress("Finding render canvas...", 10);
        const canvas = document.getElementById('renderCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        console.log("Canvas found");

        // Step 2: Create the engine
        updateLoadingProgress("Creating Babylon.js engine...", 20);
        const engine = createEngine(canvas);
        console.log("Engine created:", engine);
        
        // Step 3: Create the scene
        updateLoadingProgress("Setting up 3D scene...", 30);
        const scene = createScene(engine);
        console.log("Scene created");
        
        // Step 4: Setup camera
        updateLoadingProgress("Configuring camera...", 40);
        const camera = setupCamera(scene, config.camera);
        console.log("Camera setup complete");
        
        // Step 5: Create material (using simplified approach)
        updateLoadingProgress("Creating terrain materials...", 50);
        const terrainMaterial = createSimpleMaterial(scene);
        console.log("Material created");
        
        // Step 6: Initialize terrain
        updateLoadingProgress("Generating terrain chunks...", 60);
        console.log("About to initialize chunk manager");
        const chunkManager = initChunkManager(scene, camera, terrainMaterial);
        console.log("Chunk manager initialized");
        
        // Step 7: Setup controls
        updateLoadingProgress("Setting up camera controls...", 70);
        const cameraControls = setupEnhancedCameraControls(scene, camera, chunkManager);
        console.log("Camera controls setup complete");
        
        // Step 8: Setup UI
        updateLoadingProgress("Preparing user interface...", 80);
        const uiHelper = initUI(scene, chunkManager, cameraControls, null);
        console.log("UI initialized");
        
        // Step 9: Setup performance monitor
        updateLoadingProgress("Configuring performance monitoring...", 90);
        if (config.performance.enableStats) {
            initPerformanceMonitor(engine, scene, chunkManager);
        }
        console.log("Performance monitoring setup");
        
        // Step 10: Configure render loop
        updateLoadingProgress("Starting render loop...", 95);
        engine.runRenderLoop(() => {
            uiHelper.update();
            uiHelper.updateMinimap(camera.position.x, camera.position.z);
            scene.render();
        });
        console.log("Render loop started");
        
        // Handle window resize
        window.addEventListener('resize', () => {
            engine.resize();
        });
        
        // Final step: Hide loading screen and show help
        updateLoadingProgress("Initialization complete!", 100);
        console.log("About to hide loading screen");
        
        // IMPORTANT: Delay hiding the loading screen slightly to ensure all rendering is ready
        setTimeout(() => {
            console.log("Hiding loading screen now");
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                console.log("Loading screen hidden");
            } else {
                console.error("Could not find loading screen element to hide it");
            }
            
            // Show help overlay initially, then hide after 5 seconds
            uiHelper.toggleHelp();
            setTimeout(() => {
                uiHelper.toggleHelp();
            }, 5000);
        }, 1000); // 1-second delay before hiding loading screen
        
        console.log('Infinite Horizons Phase 2 initialized successfully');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        updateLoadingProgress(`ERROR: ${error.message}`, 100);
        
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            // Show error on loading screen
            loadingScreen.innerHTML = `
                <h1>Error</h1>
                <p>Failed to initialize Infinite Horizons</p>
                <pre style="background: rgba(255,0,0,0.1); padding: 10px; max-width: 80%; overflow-x: auto;">${error.message}\n\n${error.stack}</pre>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">Reload Page</button>
            `;
        }
    }
}