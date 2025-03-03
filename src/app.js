/**
 * Main application entry point for Infinite Horizons (Phase 2)
 * With robust debugging and explicit progress tracking
 * Optimized for performance and seamless terrain
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
        
        // Enable adaptive resolution for performance
        engine.setHardwareScalingLevel(1.5); // Render at 2/3 of canvas size for better performance
        
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
        
        // Setup adaptive performance monitoring
        const setupAdaptivePerformance = () => {
            if (config.performance.enableAdaptivePerformance) {
                let lastPerformanceCheck = 0;
                let lowPerformanceMode = false;
                
                // Monitor FPS and adjust settings if needed
                scene.onBeforeRenderObservable.add(() => {
                    const now = performance.now();
                    if (now - lastPerformanceCheck > config.performance.adaptiveCheckInterval) {
                        lastPerformanceCheck = now;
                        
                        const currentFPS = engine.getFps();
                        console.log(`Current FPS: ${currentFPS}`);
                        
                        // Enter low performance mode if FPS drops too low
                        if (currentFPS < config.performance.fpsThreshold && !lowPerformanceMode) {
                            console.log("Entering low performance mode due to low FPS");
                            lowPerformanceMode = true;
                            
                            // Reduce terrain resolution
                            config.terrain.chunkResolution = 17;
                            
                            // Reduce draw distance
                            config.terrain.loadDistance = 1;
                            
                            // Force LOD update
                            chunkManager.updateChunkLOD(camera.position);
                            
                            // Increase hardware scaling for better performance
                            engine.setHardwareScalingLevel(2.0);
                            
                            // Show performance message to user
                            const performanceMsg = document.createElement('div');
                            performanceMsg.style.position = 'absolute';
                            performanceMsg.style.bottom = '50px';
                            performanceMsg.style.left = '50%';
                            performanceMsg.style.transform = 'translateX(-50%)';
                            performanceMsg.style.backgroundColor = 'rgba(200, 0, 0, 0.7)';
                            performanceMsg.style.color = 'white';
                            performanceMsg.style.padding = '10px';
                            performanceMsg.style.borderRadius = '5px';
                            performanceMsg.style.fontFamily = 'Arial, sans-serif';
                            performanceMsg.style.fontSize = '14px';
                            performanceMsg.style.zIndex = '1000';
                            performanceMsg.textContent = 'Low performance detected. Reducing visual quality.';
                            document.body.appendChild(performanceMsg);
                            
                            setTimeout(() => {
                                performanceMsg.style.opacity = '0';
                                performanceMsg.style.transition = 'opacity 1s ease';
                                setTimeout(() => {
                                    document.body.removeChild(performanceMsg);
                                }, 1000);
                            }, 3000);
                        }
                        // Exit low performance mode if FPS improves
                        else if (currentFPS > config.performance.fpsThreshold + 10 && lowPerformanceMode) {
                            console.log("Exiting low performance mode due to improved FPS");
                            lowPerformanceMode = false;
                            
                            // Restore original settings
                            config.terrain.chunkResolution = 21;
                            config.terrain.loadDistance = 2;
                            
                            // Restore hardware scaling
                            engine.setHardwareScalingLevel(1.5);
                        }
                    }
                });
                
                console.log("Adaptive performance monitoring enabled");
            }
        };
        
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
        
        // Setup adaptive performance monitoring
        setupAdaptivePerformance();
        
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