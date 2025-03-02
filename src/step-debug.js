/**
 * Step-by-step debugging version for Infinite Horizons
 * Execution will pause after each step to identify where it's getting stuck
 */

// Debug helper to log more verbosely
const debugLog = (step, message) => {
    const fullMessage = `[STEP ${step}] ${message}`;
    console.log(fullMessage);
    
    // Also update UI
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
        const entry = document.createElement('div');
        entry.textContent = fullMessage;
        entry.style.color = '#00FF00';
        entry.style.marginBottom = '5px';
        debugPanel.appendChild(entry);
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
    
    // Update loading text
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = `Step ${step}: ${message}`;
    }
};

// Execute steps with a delay between them to see where it hangs
const executeStep = (stepNumber, description, action) => {
    return new Promise((resolve, reject) => {
        debugLog(stepNumber, `Starting: ${description}`);
        
        // Update progress bar (assuming 10 total steps)
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${stepNumber * 10}%`;
        }
        
        // Add a delay before executing the step
        setTimeout(() => {
            try {
                // Execute the action and resolve with its result
                const result = action();
                debugLog(stepNumber, `Completed: ${description}`);
                resolve(result);
            } catch (error) {
                debugLog(stepNumber, `ERROR: ${description} - ${error.message}`);
                console.error(`Step ${stepNumber} error:`, error);
                reject(error);
            }
        }, 500); // 500ms delay between steps
    });
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('INIT', 'DOM loaded, beginning step-by-step debugging');
    
    // Start the step sequence
    sequentialSteps()
        .then(() => debugLog('DONE', 'All steps completed successfully'))
        .catch(error => {
            debugLog('ERROR', `Process failed: ${error.message}`);
            console.error('Sequential steps failed:', error);
        });
});

// Execute each step in sequence
async function sequentialSteps() {
    // Import libraries first
    await executeStep(1, 'Importing modules', () => {
        // This step doesn't actually import anything, just checks if BABYLON exists
        if (typeof BABYLON === 'undefined') {
            throw new Error('BABYLON library not found');
        }
        return 'Modules imported';
    });
    
    // Create canvas
    const canvas = await executeStep(2, 'Getting render canvas', () => {
        const canvas = document.getElementById('renderCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        return canvas;
    });
    
    // Create engine
    const engine = await executeStep(3, 'Creating Babylon.js engine', () => {
        try {
            return new BABYLON.Engine(canvas, true);
        } catch (e) {
            console.error('Engine creation error:', e);
            throw e;
        }
    });
    
    // Create scene
    const scene = await executeStep(4, 'Creating scene', () => {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.4, 0.6, 0.9, 1); // Sky blue
        return scene;
    });
    
    // Create camera
    const camera = await executeStep(5, 'Setting up camera', () => {
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -10), scene);
        camera.setTarget(new BABYLON.Vector3(0, 0, 0));
        camera.attachControl(canvas, true);
        return camera;
    });
    
    // Create lighting
    await executeStep(6, 'Creating lights', () => {
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        return light;
    });
    
    // Create material 
    const material = await executeStep(7, 'Creating material', () => {
        try {
            const material = new BABYLON.StandardMaterial("material", scene);
            material.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            return material;
        } catch (e) {
            console.error('Material creation error:', e);
            throw e;
        }
    });
    
    // Create terrain mesh
    const ground = await executeStep(8, 'Creating terrain mesh', () => {
        try {
            const ground = BABYLON.MeshBuilder.CreateGround("ground", {
                width: 100, 
                height: 100,
                subdivisions: 32,
                updatable: true
            }, scene);
            ground.material = material;
            return ground;
        } catch (e) {
            console.error('Mesh creation error:', e);
            throw e;
        }
    });
    
    // Apply height variation
    await executeStep(9, 'Applying height variation', () => {
        try {
            const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            const vertexCount = positions.length / 3;
            
            // Apply simple height to vertices
            for (let i = 0; i < vertexCount; i++) {
                const x = positions[i * 3];
                const z = positions[i * 3 + 2];
                positions[i * 3 + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5;
            }
            
            ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
            
            // Recompute normals
            BABYLON.VertexData.ComputeNormals(
                positions,
                ground.getIndices(),
                ground.getVerticesData(BABYLON.VertexBuffer.NormalKind)
            );
            ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind, 
                ground.getVerticesData(BABYLON.VertexBuffer.NormalKind));
                
            return 'Height applied';
        } catch (e) {
            console.error('Height application error:', e);
            throw e;
        }
    });
    
    // Start render loop
    await executeStep(10, 'Starting render loop', () => {
        try {
            engine.runRenderLoop(() => {
                scene.render();
            });
            
            window.addEventListener('resize', () => {
                engine.resize();
            });
            
            return 'Render loop started';
        } catch (e) {
            console.error('Render loop error:', e);
            throw e;
        }
    });
    
    // Final step - hide loading screen
    await executeStep(11, 'Finishing initialization', () => {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1000);
        return 'Initialization complete';
    });
}