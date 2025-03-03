/**
 * Enhanced UI Helper functions for Infinite Horizons (Phase 2)
 */
import config from '../config.js';
import { initMaterialUI } from '../ui/materialUI.js';

/**
 * Initialize UI elements
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} chunkManager - The terrain chunk manager
 * @param {Object} cameraControls - The camera controls
 * @param {BABYLON.ShaderMaterial|BABYLON.PBRMaterial} terrainMaterial - The terrain shader material
 * @returns {Object} UI helper object
 */
export function initUI(scene, chunkManager, cameraControls, terrainMaterial) {
    // Debug logging
    console.log("[UI] Initializing UI with material:", terrainMaterial ? terrainMaterial.getClassName() : "None");
    
    // Create help overlay
    const helpOverlay = createHelpOverlay();
    
    // Create minimap
    const minimap = createMinimap(scene, chunkManager);
    
    // Initialize material UI (works with both shader and standard materials)
    const materialUI = terrainMaterial ? initMaterialUI(scene, terrainMaterial) : null;
    console.log("[UI] Material UI initialized:", materialUI ? "Success" : "Failed");
    
    // Create FPS display (enhanced in Phase 2)
    const fpsDisplay = createFPSDisplay(scene.getEngine());
    
    // Track UI state
    const uiState = {
        helpVisible: false,
        minimapVisible: true,
        fpsVisible: true,
        materialUIVisible: false
    };
    
    // IMPORTANT: Set up dedicated keyboard handler for Alt+M
    window.addEventListener('keydown', (e) => {
        // Check for Alt+M specifically for material editor
        if (e.key.toLowerCase() === 'm' && e.altKey && !e.ctrlKey && !e.shiftKey) {
            console.log("[UI] Alt+M detected, toggling material editor");
            if (materialUI) {
                materialUI.toggleUI();
                uiState.materialUIVisible = !uiState.materialUIVisible;
                console.log("[UI] Material UI visibility:", uiState.materialUIVisible);
            } else {
                console.warn("[UI] Material UI not available");
            }
            e.preventDefault(); // Prevent default browser behavior
        }
    });
    
    // Set up keyboard shortcuts for other UI elements
    setupKeyboardShortcuts(scene, uiState, helpOverlay, minimap, fpsDisplay, materialUI, cameraControls);
    
    return {
        // Show/hide help overlay
        toggleHelp() {
            uiState.helpVisible = !uiState.helpVisible;
            helpOverlay.style.display = uiState.helpVisible ? 'block' : 'none';
            console.log("[UI] Help overlay visibility:", uiState.helpVisible);
            
            // Disable camera controls when help is visible
            if (cameraControls && cameraControls.setMouseControlsEnabled) {
                cameraControls.setMouseControlsEnabled(!uiState.helpVisible);
            }
        },
        
        // Show/hide minimap
        toggleMinimap() {
            uiState.minimapVisible = !uiState.minimapVisible;
            minimap.container.style.display = uiState.minimapVisible ? 'block' : 'none';
        },
        
        // Show/hide FPS display
        toggleFPS() {
            uiState.fpsVisible = !uiState.fpsVisible;
            fpsDisplay.style.display = uiState.fpsVisible ? 'block' : 'none';
        },
        
        // Show/hide material UI
        toggleMaterialUI() {
            if (materialUI) {
                materialUI.toggleUI();
                uiState.materialUIVisible = !uiState.materialUIVisible;
                console.log("[UI] Material UI visibility toggled:", uiState.materialUIVisible);
            } else {
                console.warn("[UI] Material UI not available");
            }
        },
        
        // Update minimap
        updateMinimap(cameraX, cameraZ) {
            if (uiState.minimapVisible) {
                updateMinimapPosition(minimap, cameraX, cameraZ, chunkManager);
            }
        },
        
        // Update all UI elements
        update() {
            if (uiState.fpsVisible) {
                updateFPSDisplay(fpsDisplay, scene.getEngine());
            }
        },
        
        // Get UI state (for debugging)
        getState() {
            return uiState;
        }
    };
}

/**
 * Create help overlay with updated controls (Phase 2)
 * @returns {HTMLElement} The created help overlay element
 */
function createHelpOverlay() {
    // Create help overlay container
    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'helpOverlay';
    helpOverlay.style.position = 'absolute';
    helpOverlay.style.top = '50%';
    helpOverlay.style.left = '50%';
    helpOverlay.style.transform = 'translate(-50%, -50%)';
    helpOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    helpOverlay.style.color = 'white';
    helpOverlay.style.padding = '20px';
    helpOverlay.style.borderRadius = '10px';
    helpOverlay.style.fontFamily = 'Arial, sans-serif';
    helpOverlay.style.zIndex = '100';
    helpOverlay.style.maxWidth = '500px';
    helpOverlay.style.display = 'none';
    
    // Add help content
    helpOverlay.innerHTML = `
        <h2 style="text-align: center; margin-top: 0;">Infinite Horizons Controls</h2>
        <h3 style="margin-top: 15px;">Movement Controls</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>W, A, S, D:</strong> Move camera forward, left, backward, right</li>
            <li><strong>Space / Shift:</strong> Move up / down (flight mode) or jump (walking mode)</li>
            <li><strong>Mouse:</strong> Look around</li>
            <li><strong>Alt:</strong> Sprint (2x speed)</li>
            <li><strong>Ctrl:</strong> Slow movement (0.5x speed)</li>
            <li><strong>F:</strong> Toggle between flight and walking modes</li>
        </ul>
        
        <h3 style="margin-top: 15px;">UI Controls</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>H:</strong> Toggle this help overlay</li>
            <li><strong>M:</strong> Toggle minimap</li>
            <li><strong>P:</strong> Toggle FPS display</li>
            <li><strong>Alt+M:</strong> Toggle material editor</li>
            <li><strong>R:</strong> Reset camera position</li>
            <li><strong>Ctrl+Shift+I:</strong> Toggle Babylon.js Inspector</li>
        </ul>
        
        <h3 style="margin-top: 15px;">View Options</h3>
        <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>G:</strong> Toggle wireframe view</li>
        </ul>
        
        <div style="text-align: center; margin-top: 20px;">
            <small>Press H to close this overlay</small>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(helpOverlay);
    
    return helpOverlay;
}

/**
 * Create minimap
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} chunkManager - The terrain chunk manager
 * @returns {Object} Minimap object
 */
function createMinimap(scene, chunkManager) {
    // Create minimap container
    const minimapContainer = document.createElement('div');
    minimapContainer.id = 'minimap';
    minimapContainer.style.position = 'absolute';
    minimapContainer.style.bottom = '20px';
    minimapContainer.style.right = '20px';
    minimapContainer.style.width = '200px';
    minimapContainer.style.height = '200px';
    minimapContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    minimapContainer.style.borderRadius = '5px';
    minimapContainer.style.zIndex = '100';
    minimapContainer.style.overflow = 'hidden';
    
    // Create minimap canvas
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.id = 'minimapCanvas';
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
    minimapCanvas.style.width = '100%';
    minimapCanvas.style.height = '100%';
    
    // Add canvas to container
    minimapContainer.appendChild(minimapCanvas);
    
    // Create player marker
    const playerMarker = document.createElement('div');
    playerMarker.id = 'playerMarker';
    playerMarker.style.position = 'absolute';
    playerMarker.style.width = '8px';
    playerMarker.style.height = '8px';
    playerMarker.style.backgroundColor = 'red';
    playerMarker.style.borderRadius = '50%';
    playerMarker.style.transform = 'translate(-50%, -50%)';
    playerMarker.style.zIndex = '101';
    
    // Add player marker to container
    minimapContainer.appendChild(playerMarker);
    
    // Add to document
    document.body.appendChild(minimapContainer);
    
    // Get canvas context
    const ctx = minimapCanvas.getContext('2d');
    
    // Initialize minimap rendering
    renderMinimap(ctx, chunkManager);
    
    return {
        container: minimapContainer,
        canvas: minimapCanvas,
        context: ctx,
        playerMarker: playerMarker
    };
}

/**
 * Create FPS display
 * @param {BABYLON.Engine} engine - The Babylon.js engine
 * @returns {HTMLElement} FPS display element
 */
function createFPSDisplay(engine) {
    const fpsDisplay = document.createElement('div');
    fpsDisplay.id = 'fpsDisplay';
    fpsDisplay.style.position = 'absolute';
    fpsDisplay.style.top = '10px';
    fpsDisplay.style.left = '10px';
    fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDisplay.style.color = 'white';
    fpsDisplay.style.padding = '5px 10px';
    fpsDisplay.style.borderRadius = '3px';
    fpsDisplay.style.fontFamily = 'monospace';
    fpsDisplay.style.fontSize = '14px';
    fpsDisplay.style.zIndex = '100';
    
    document.body.appendChild(fpsDisplay);
    
    return fpsDisplay;
}

/**
 * Update FPS display
 * @param {HTMLElement} fpsDisplay - FPS display element
 * @param {BABYLON.Engine} engine - The Babylon.js engine
 */
function updateFPSDisplay(fpsDisplay, engine) {
    const fps = Math.round(engine.getFps());
    
    // Color code based on performance
    let color;
    if (fps >= 50) {
        color = '#00FF00'; // Green for good
    } else if (fps >= 30) {
        color = '#FFFF00'; // Yellow for moderate
    } else {
        color = '#FF0000'; // Red for bad
    }
    
    fpsDisplay.innerHTML = `FPS: <span style="color: ${color}">${fps}</span>`;
}

/**
 * Render the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} chunkManager - The terrain chunk manager
 */
function renderMinimap(ctx, chunkManager) {
    // Get canvas dimensions
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(100, 150, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(50, 100, 150, 0.7)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Get all loaded chunks
    const loadedChunks = chunkManager.getLoadedChunks();
    
    // Calculate scale (each chunk will be a small square)
    const chunkSize = 20; // Size of chunk square in pixels
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw chunks
    for (const [key, mesh] of loadedChunks.entries()) {
        // Parse chunk coordinates from key
        const [chunkX, chunkZ] = key.split('_').map(Number);
        
        // Calculate position on minimap
        const posX = centerX + chunkX * chunkSize;
        const posY = centerY + chunkZ * chunkSize;
        
        // Get LOD level if available
        const lodLevel = mesh.lodLevel !== undefined ? mesh.lodLevel : 0;
        
        // Color based on LOD level (darker green for higher detail)
        const lodAlpha = 0.8 - (lodLevel * 0.15);
        ctx.fillStyle = `rgba(50, 100, 50, ${lodAlpha})`;
        
        // Draw chunk square
        ctx.fillRect(
            posX - chunkSize / 2, 
            posY - chunkSize / 2, 
            chunkSize, 
            chunkSize
        );
        
        // Draw chunk outline
        ctx.strokeStyle = 'rgba(30, 60, 30, 0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            posX - chunkSize / 2, 
            posY - chunkSize / 2, 
            chunkSize, 
            chunkSize
        );
    }
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    
    for (let x = chunkSize / 2; x < width; x += chunkSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    
    for (let y = chunkSize / 2; y < height; y += chunkSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw center reference
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Draw compass
    drawCompass(ctx, width - 35, 35, 25);
}

/**
 * Draw a compass on the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} radius - Compass radius
 */
function drawCompass(ctx, x, y, radius) {
    // Draw compass circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw N, S, E, W markers
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // North
    ctx.fillText('N', x, y - radius + 10);
    // South
    ctx.fillText('S', x, y + radius - 10);
    // East
    ctx.fillText('E', x + radius - 10, y);
    // West
    ctx.fillText('W', x - radius + 10, y);
    
    // Draw compass needle
    ctx.beginPath();
    ctx.moveTo(x, y - radius + 5);
    ctx.lineTo(x - 5, y);
    ctx.lineTo(x, y + radius - 5);
    ctx.lineTo(x + 5, y);
    ctx.closePath();
    
    // Red for North
    const needleGradient = ctx.createLinearGradient(x, y - radius, x, y + radius);
    needleGradient.addColorStop(0, 'red');
    needleGradient.addColorStop(1, 'white');
    
    ctx.fillStyle = needleGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * Update player position on minimap
 * @param {Object} minimap - Minimap object
 * @param {number} cameraX - Camera X position
 * @param {number} cameraZ - Camera Z position
 * @param {Object} chunkManager - The terrain chunk manager
 */
function updateMinimapPosition(minimap, cameraX, cameraZ, chunkManager) {
    // Get canvas dimensions
    const width = minimap.canvas.width;
    const height = minimap.canvas.height;
    
    // Calculate chunk size in pixels
    const chunkSize = 20;
    
    // Calculate player position on minimap
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Convert world coordinates to chunk coordinates
    const chunkXFloat = cameraX / config.terrain.chunkSize;
    const chunkZFloat = cameraZ / config.terrain.chunkSize;
    
    // Calculate pixel position
    const posX = centerX + chunkXFloat * chunkSize;
    const posY = centerY + chunkZFloat * chunkSize;
    
    // Update player marker position
    minimap.playerMarker.style.left = posX + 'px';
    minimap.playerMarker.style.top = posY + 'px';
    
    // Re-render the minimap if chunks have changed
    const currentChunkCount = chunkManager.getLoadedChunkCount();
    if (minimap.lastChunkCount !== currentChunkCount) {
        renderMinimap(minimap.context, chunkManager);
        minimap.lastChunkCount = currentChunkCount;
    }
}

/**
 * Set up keyboard shortcuts
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} uiState - UI state object
 * @param {HTMLElement} helpOverlay - Help overlay element
 * @param {Object} minimap - Minimap object
 * @param {HTMLElement} fpsDisplay - FPS display element
 * @param {Object} materialUI - Material UI object
 * @param {Object} cameraControls - Camera controls object
 */
function setupKeyboardShortcuts(scene, uiState, helpOverlay, minimap, fpsDisplay, materialUI, cameraControls) {
    // Set up keyboard shortcut handler
    window.addEventListener('keydown', (event) => {
        // Toggle help overlay on H key
        if (event.code === 'KeyH' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
            uiState.helpVisible = !uiState.helpVisible;
            helpOverlay.style.display = uiState.helpVisible ? 'block' : 'none';
            
            // Disable camera controls when help is visible
            if (cameraControls && cameraControls.setMouseControlsEnabled) {
                cameraControls.setMouseControlsEnabled(!uiState.helpVisible);
            }
        }
        
        // Toggle minimap on M key
        if (event.code === 'KeyM' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
            uiState.minimapVisible = !uiState.minimapVisible;
            minimap.container.style.display = uiState.minimapVisible ? 'block' : 'none';
        }
        
        // Toggle FPS display on P key
        if (event.code === 'KeyP' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
            uiState.fpsVisible = !uiState.fpsVisible;
            fpsDisplay.style.display = uiState.fpsVisible ? 'block' : 'none';
        }
        
        // Reset camera position on R key
        if (event.code === 'KeyR' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
            const camera = scene.activeCamera;
            if (camera) {
                camera.position = new BABYLON.Vector3(
                    config.camera.initialPosition[0],
                    config.camera.initialPosition[1],
                    config.camera.initialPosition[2]
                );
                camera.rotation = new BABYLON.Vector3(0, 0, 0);
            }
        }
        
        // Toggle wireframe on G key
        if (event.code === 'KeyG' && !event.altKey && !event.ctrlKey && !event.shiftKey) {
            scene.meshes.forEach(mesh => {
                if (mesh.name.startsWith('terrain_')) {
                    mesh.material.wireframe = !mesh.material.wireframe;
                }
            });
        }
    });
}
