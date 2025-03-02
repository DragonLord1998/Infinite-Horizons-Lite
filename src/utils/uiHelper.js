/**
 * UI Helper functions for Infinite Horizons
 */
import config from '../config.js';

/**
 * Initialize UI elements
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} chunkManager - The terrain chunk manager
 * @param {Object} cameraControls - The camera controls
 * @returns {Object} UI helper object
 */
export function initUI(scene, chunkManager, cameraControls) {
    // Create help overlay
    const helpOverlay = createHelpOverlay();
    
    // Create minimap
    const minimap = createMinimap(scene, chunkManager);
    
    // Track UI state
    const uiState = {
        helpVisible: false,
        minimapVisible: true
    };
    
    // Set up keyboard shortcuts
    setupKeyboardShortcuts(scene, uiState, helpOverlay, minimap, cameraControls);
    
    return {
        // Show/hide help overlay
        toggleHelp() {
            uiState.helpVisible = !uiState.helpVisible;
            helpOverlay.style.display = uiState.helpVisible ? 'block' : 'none';
        },
        
        // Show/hide minimap
        toggleMinimap() {
            uiState.minimapVisible = !uiState.minimapVisible;
            minimap.container.style.display = uiState.minimapVisible ? 'block' : 'none';
        },
        
        // Update minimap
        updateMinimap(cameraX, cameraZ) {
            if (uiState.minimapVisible) {
                updateMinimapPosition(minimap, cameraX, cameraZ, chunkManager);
            }
        }
    };
}

/**
 * Create help overlay
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
        <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>W, A, S, D:</strong> Move camera forward, left, backward, right</li>
            <li><strong>Space / Shift:</strong> Move camera up / down</li>
            <li><strong>Mouse:</strong> Look around</li>
            <li><strong>Alt:</strong> Sprint (2x speed)</li>
            <li><strong>Ctrl:</strong> Slow movement (0.5x speed)</li>
            <li><strong>H:</strong> Toggle this help overlay</li>
            <li><strong>M:</strong> Toggle minimap</li>
            <li><strong>R:</strong> Reset camera position</li>
            <li><strong>F:</strong> Toggle wireframe view</li>
            <li><strong>Ctrl+Shift+I:</strong> Toggle Babylon.js Inspector</li>
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
 * Render the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} chunkManager - The terrain chunk manager
 */
function renderMinimap(ctx, chunkManager) {
    // Get canvas dimensions
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = 'rgb(100, 150, 255)';
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
        
        // Draw chunk square
        ctx.fillStyle = 'rgb(50, 100, 50)';
        ctx.fillRect(
            posX - chunkSize / 2, 
            posY - chunkSize / 2, 
            chunkSize, 
            chunkSize
        );
        
        // Draw chunk outline
        ctx.strokeStyle = 'rgb(30, 60, 30)';
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
 * @param {Object} cameraControls - Camera controls object
 */
function setupKeyboardShortcuts(scene, uiState, helpOverlay, minimap, cameraControls) {
    // Set up keyboard shortcut handler
    window.addEventListener('keydown', (event) => {
        // Toggle help overlay on H key
        if (event.code === 'KeyH') {
            uiState.helpVisible = !uiState.helpVisible;
            helpOverlay.style.display = uiState.helpVisible ? 'block' : 'none';
            
            // Disable camera controls when help is visible
            cameraControls.setMouseControlsEnabled(!uiState.helpVisible);
        }
        
        // Toggle minimap on M key
        if (event.code === 'KeyM') {
            uiState.minimapVisible = !uiState.minimapVisible;
            minimap.container.style.display = uiState.minimapVisible ? 'block' : 'none';
        }
        
        // Reset camera position on R key
        if (event.code === 'KeyR') {
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
        
        // Toggle wireframe on F key
        if (event.code === 'KeyF') {
            scene.meshes.forEach(mesh => {
                if (mesh.name.startsWith('terrain_')) {
                    mesh.material.wireframe = !mesh.material.wireframe;
                }
            });
        }
    });
}
