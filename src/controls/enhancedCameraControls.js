/**
 * Enhanced camera controls with terrain adaptation and optional flight mode
 */
import config from '../config.js';

/**
 * Sets up enhanced camera controls
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Camera} camera - The camera to control
 * @param {Object} chunkManager - Terrain chunk manager for height queries
 * @returns {Object} Camera controls object
 */
export function setupEnhancedCameraControls(scene, camera, chunkManager) {
    // Track key states
    const keyState = {
        forward: false,   // W
        backward: false,  // S
        left: false,      // A
        right: false,     // D
        up: false,        // Space
        down: false,      // Shift
        sprint: false,    // Alt
        slow: false       // Ctrl
    };
    
    // Track mouse state
    const mouseState = {
        locked: false,
        enabled: true,
        lastX: 0,
        lastY: 0
    };
    
    // Control modes
    const controlModes = {
        FLIGHT: 'flight',
        WALKING: 'walking'
    };
    
    // Current control state
    const controlState = {
        mode: controlModes.FLIGHT,          // Default mode
        height: 10,                         // Default height above terrain in walking mode
        velocity: new BABYLON.Vector3(),    // Current velocity vector for smooth movement
        maxVelocity: config.camera.moveSpeed, // Maximum velocity
        acceleration: 0.08,                 // Acceleration factor (0-1)
        deceleration: 0.05,                 // Deceleration factor (0-1)
        lastGroundHeight: 0,                // Last known ground height
        jumpVelocity: 0,                    // Vertical velocity for jumping
        isJumping: false,                   // Whether currently jumping
        gravity: 0.01,                      // Gravity strength
        collisionPadding: 2.0,              // Padding for collision detection
        adaptToTerrainSpeed: 0.1            // Speed at which camera adapts to terrain (0-1)
    };
    
    // Get the canvas
    const canvas = scene.getEngine().getRenderingCanvas();
    
    // Set up keyboard input
    setupKeyboardInput(keyState, controlState, controlModes, canvas);
    
    // Set up mouse input
    setupMouseInput(mouseState, canvas);
    
    // Create mode indicator UI
    const modeIndicator = createModeIndicator(controlState);
    
    // Update camera on each frame
    scene.onBeforeRenderObservable.add(() => {
        updateCamera(camera, keyState, mouseState, controlState, chunkManager);
    });
    
    // Return camera controls object
    return {
        keyState,
        mouseState,
        controlState,
        modes: controlModes,
        
        /**
         * Set camera control mode
         * @param {string} mode - Control mode (flight or walking)
         */
        setMode(mode) {
            if (mode === controlModes.FLIGHT || mode === controlModes.WALKING) {
                controlState.mode = mode;
                updateModeIndicator(modeIndicator, controlState);
            }
        },
        
        /**
         * Toggle between flight and walking modes
         */
        toggleMode() {
            if (controlState.mode === controlModes.FLIGHT) {
                controlState.mode = controlModes.WALKING;
            } else {
                controlState.mode = controlModes.FLIGHT;
            }
            updateModeIndicator(modeIndicator, controlState);
        },
        
        /**
         * Enable or disable mouse controls
         * @param {boolean} enabled - Whether mouse controls should be enabled
         */
        setMouseControlsEnabled(enabled) {
            mouseState.enabled = enabled;
            
            if (enabled) {
                // Request pointer lock
                try {
                    canvas.requestPointerLock = canvas.requestPointerLock || 
                                              canvas.mozRequestPointerLock ||
                                              canvas.webkitRequestPointerLock;
                    
                    if (canvas.requestPointerLock) {
                        canvas.requestPointerLock().catch(error => {
                            console.warn('Pointer lock request failed:', error);
                        });
                    }
                } catch (error) {
                    console.warn('Error requesting pointer lock:', error);
                }
            } else {
                try {
                    document.exitPointerLock = document.exitPointerLock ||
                                              document.mozExitPointerLock ||
                                              document.webkitExitPointerLock;
                    
                    if (document.exitPointerLock) {
                        document.exitPointerLock();
                    }
                } catch (error) {
                    console.warn('Error exiting pointer lock:', error);
                }
            }
        }
    };
}

/**
 * Set up keyboard input
 * @param {Object} keyState - Object to track key states
 * @param {Object} controlState - Control state object
 * @param {Object} controlModes - Available control modes
 * @param {HTMLCanvasElement} canvas - Canvas element for events
 */
function setupKeyboardInput(keyState, controlState, controlModes, canvas) {
    // Key codes
    const keyCodes = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        SPACE: 32,
        SHIFT: 16,
        ALT: 18,
        CTRL: 17,
        F: 70
    };
    
    // Handle key down
    window.addEventListener('keydown', (event) => {
        switch(event.keyCode) {
            case keyCodes.W:
                keyState.forward = true;
                break;
            case keyCodes.S:
                keyState.backward = true;
                break;
            case keyCodes.A:
                keyState.left = true;
                break;
            case keyCodes.D:
                keyState.right = true;
                break;
            case keyCodes.SPACE:
                keyState.up = true;
                
                // Handle jumping in walking mode
                if (controlState.mode === controlModes.WALKING && !controlState.isJumping) {
                    controlState.jumpVelocity = 0.5; // Initial jump velocity
                    controlState.isJumping = true;
                }
                break;
            case keyCodes.SHIFT:
                keyState.down = true;
                break;
            case keyCodes.ALT:
                keyState.sprint = true;
                break;
            case keyCodes.CTRL:
                keyState.slow = true;
                break;
            case keyCodes.F:
                // Toggle between flight and walking modes
                if (controlState.mode === controlModes.FLIGHT) {
                    controlState.mode = controlModes.WALKING;
                } else {
                    controlState.mode = controlModes.FLIGHT;
                }
                break;
        }
    });
    
    // Handle key up
    window.addEventListener('keyup', (event) => {
        switch(event.keyCode) {
            case keyCodes.W:
                keyState.forward = false;
                break;
            case keyCodes.S:
                keyState.backward = false;
                break;
            case keyCodes.A:
                keyState.left = false;
                break;
            case keyCodes.D:
                keyState.right = false;
                break;
            case keyCodes.SPACE:
                keyState.up = false;
                break;
            case keyCodes.SHIFT:
                keyState.down = false;
                break;
            case keyCodes.ALT:
                keyState.sprint = false;
                break;
            case keyCodes.CTRL:
                keyState.slow = false;
                break;
        }
    });
}

/**
 * Set up mouse input
 * @param {Object} mouseState - Object to track mouse state
 * @param {HTMLCanvasElement} canvas - Canvas element for events
 */
function setupMouseInput(mouseState, canvas) {
    // Handle pointer lock change
    document.addEventListener('pointerlockchange', () => {
        mouseState.locked = document.pointerLockElement === canvas;
    });
    
    document.addEventListener('mozpointerlockchange', () => {
        mouseState.locked = document.mozPointerLockElement === canvas;
    });
    
    document.addEventListener('webkitpointerlockchange', () => {
        mouseState.locked = document.webkitPointerLockElement === canvas;
    });
    
    // Handle mouse movement
    canvas.addEventListener('mousemove', (event) => {
        if (mouseState.locked && mouseState.enabled) {
            // Get movement deltas
            const movementX = event.movementX || 
                              event.mozMovementX || 
                              event.webkitMovementX || 0;
            
            const movementY = event.movementY || 
                             event.mozMovementY || 
                             event.webkitMovementY || 0;
            
            // Update last position
            mouseState.lastX = movementX;
            mouseState.lastY = movementY;
        }
    });
    
    // Request pointer lock on click
    canvas.addEventListener('click', () => {
        if (mouseState.enabled && !mouseState.locked) {
            try {
                canvas.requestPointerLock = canvas.requestPointerLock || 
                                          canvas.mozRequestPointerLock ||
                                          canvas.webkitRequestPointerLock;
                
                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock().catch(error => {
                        console.warn('Pointer lock request failed:', error);
                    });
                }
            } catch (error) {
                console.warn('Error requesting pointer lock:', error);
            }
        }
    });
}

/**
 * Create a UI indicator for the current control mode
 * @param {Object} controlState - Control state object
 * @returns {HTMLElement} Created indicator element
 */
function createModeIndicator(controlState) {
    const indicator = document.createElement('div');
    indicator.id = 'modeIndicator';
    indicator.style.position = 'absolute';
    indicator.style.bottom = '10px';
    indicator.style.left = '10px';
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '3px';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '14px';
    indicator.style.zIndex = '100';
    
    updateModeIndicator(indicator, controlState);
    document.body.appendChild(indicator);
    
    return indicator;
}

/**
 * Update the mode indicator display
 * @param {HTMLElement} indicator - Mode indicator element
 * @param {Object} controlState - Control state object
 */
function updateModeIndicator(indicator, controlState) {
    if (controlState.mode === 'flight') {
        indicator.textContent = '✈️ Flight Mode (F to toggle)';
        indicator.style.backgroundColor = 'rgba(0, 50, 100, 0.7)';
    } else {
        indicator.textContent = '👣 Walking Mode (F to toggle)';
        indicator.style.backgroundColor = 'rgba(0, 80, 0, 0.7)';
    }
}

/**
 * Update camera position and rotation based on input
 * @param {BABYLON.Camera} camera - The camera to update
 * @param {Object} keyState - Current key states
 * @param {Object} mouseState - Current mouse state
 * @param {Object} controlState - Control state object
 * @param {Object} chunkManager - Terrain chunk manager for height queries
 */
function updateCamera(camera, keyState, mouseState, controlState, chunkManager) {
    // Get settings from config
    const moveSpeed = config.camera.moveSpeed;
    const rotationSpeed = config.camera.rotationSpeed;
    
    // Apply rotation from mouse if locked
    if (mouseState.locked && mouseState.enabled) {
        // Apply rotation from mouse movement
        camera.rotation.y += mouseState.lastX * rotationSpeed;
        camera.rotation.x += mouseState.lastY * rotationSpeed;
        
        // Limit vertical rotation to prevent camera flipping
        const pitchLimit = Math.PI / 2 * 0.95; // Slightly less than 90 degrees
        camera.rotation.x = Math.max(-pitchLimit, Math.min(pitchLimit, camera.rotation.x));
        
        // Reset mouse deltas
        mouseState.lastX = 0;
        mouseState.lastY = 0;
    }
    
    // Apply speed modifiers
    let speedFactor = 1.0;
    if (keyState.sprint) speedFactor *= 2.0;
    if (keyState.slow) speedFactor *= 0.5;
    
    // Get camera direction vectors
    let forwardVector = camera.getDirection(BABYLON.Vector3.Forward());
    let rightVector = camera.getDirection(BABYLON.Vector3.Right());
    let upVector = BABYLON.Vector3.Up();
    
    // Determine desired movement direction
    let movementDirection = BABYLON.Vector3.Zero();
    
    if (keyState.forward) movementDirection.addInPlace(forwardVector);
    if (keyState.backward) movementDirection.subtractInPlace(forwardVector);
    if (keyState.right) movementDirection.addInPlace(rightVector);
    if (keyState.left) movementDirection.subtractInPlace(rightVector);
    
    // Handle up/down movement differently based on mode
    if (controlState.mode === 'flight') {
        // In flight mode, space/shift directly control height
        if (keyState.up) movementDirection.addInPlace(upVector);
        if (keyState.down) movementDirection.subtractInPlace(upVector);
        
        // In flight mode, zero out Y component of forward/backward movement to keep movement aligned with view
        // This line is removed to allow full 3D flight
    } else {
        // In walking mode, zero out Y component of forward/right movement for pure horizontal movement
        forwardVector.y = 0;
        forwardVector.normalize();
        rightVector.y = 0;
        rightVector.normalize();
        
        // Recalculate movement direction with zeroed Y components
        movementDirection = BABYLON.Vector3.Zero();
        if (keyState.forward) movementDirection.addInPlace(forwardVector);
        if (keyState.backward) movementDirection.subtractInPlace(forwardVector);
        if (keyState.right) movementDirection.addInPlace(rightVector);
        if (keyState.left) movementDirection.subtractInPlace(rightVector);
    }
    
    // Normalize movement direction if non-zero
    if (movementDirection.length() > 0) {
        movementDirection.normalize();
    }
    
    // Apply smooth acceleration/deceleration
    if (movementDirection.length() > 0) {
        // Accelerate towards movement direction
        controlState.velocity.x += (movementDirection.x * controlState.maxVelocity * speedFactor - controlState.velocity.x) * controlState.acceleration;
        controlState.velocity.z += (movementDirection.z * controlState.maxVelocity * speedFactor - controlState.velocity.z) * controlState.acceleration;
        
        if (controlState.mode === 'flight') {
            controlState.velocity.y += (movementDirection.y * controlState.maxVelocity * speedFactor - controlState.velocity.y) * controlState.acceleration;
        }
    } else {
        // Decelerate when no input
        controlState.velocity.x *= (1 - controlState.deceleration);
        controlState.velocity.z *= (1 - controlState.deceleration);
        
        if (controlState.mode === 'flight') {
            controlState.velocity.y *= (1 - controlState.deceleration);
        }
    }
    
    // Apply very small threshold to stop completely when nearly stopped
    if (Math.abs(controlState.velocity.x) < 0.001) controlState.velocity.x = 0;
    if (Math.abs(controlState.velocity.y) < 0.001) controlState.velocity.y = 0;
    if (Math.abs(controlState.velocity.z) < 0.001) controlState.velocity.z = 0;
    
    // Handle walking mode height adaptation and collision
    if (controlState.mode === 'walking') {
        // Get ground height at camera position
        const groundHeight = chunkManager.getHeightAtPosition(
            camera.position.x, 
            camera.position.z
        );
        
        // Update last known ground height if valid
        if (!isNaN(groundHeight)) {
            controlState.lastGroundHeight = groundHeight;
        }
        
        // Handle jumping and gravity
        if (controlState.isJumping) {
            // Apply gravity to jump velocity
            controlState.jumpVelocity -= controlState.gravity;
            
            // Calculate target height including jump
            const targetHeight = controlState.lastGroundHeight + controlState.height + controlState.jumpVelocity;
            
            // If we hit the ground, stop jumping
            if (camera.position.y <= controlState.lastGroundHeight + controlState.height) {
                camera.position.y = controlState.lastGroundHeight + controlState.height;
                controlState.isJumping = false;
                controlState.jumpVelocity = 0;
            }
            
            // Apply jump velocity
            controlState.velocity.y = controlState.jumpVelocity;
        } else {
            // Smooth terrain height adaptation when not jumping
            const targetHeight = controlState.lastGroundHeight + controlState.height;
            
            // Only adapt height if not jumping
            if (!controlState.isJumping) {
                controlState.velocity.y = (targetHeight - camera.position.y) * controlState.adaptToTerrainSpeed;
            }
        }
        
        // Additional collision checks (walls, etc) can be added here
    }
    
    // Apply velocity to position
    camera.position.addInPlace(controlState.velocity);
    
    // Additional safety check to prevent going below ground
    if (controlState.mode === 'walking' && camera.position.y < controlState.lastGroundHeight + 1.0) {
        camera.position.y = controlState.lastGroundHeight + 1.0;
    }
}
