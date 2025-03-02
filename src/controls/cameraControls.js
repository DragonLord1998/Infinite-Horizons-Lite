/**
 * Camera controls for Infinite Horizons
 */
import config from '../config.js';

/**
 * Sets up camera controls
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.Camera} camera - The camera to control
 * @returns {Object} Camera controls object
 */
export function setupCameraControls(scene, camera) {
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
    
    // Get settings from config
    const moveSpeed = config.camera.moveSpeed;
    const rotationSpeed = config.camera.rotationSpeed;
    
    // Get the canvas
    const canvas = scene.getEngine().getRenderingCanvas();
    
    // Set up keyboard input
    setupKeyboardInput(keyState, canvas);
    
    // Set up mouse input
    setupMouseInput(mouseState, canvas);
    
    // Update camera on each frame
    scene.onBeforeRenderObservable.add(() => {
        updateCamera(camera, keyState, mouseState);
    });
    
    // Return camera controls object
    return {
        keyState,
        mouseState,
        
        /**
         * Enable or disable mouse controls
         * @param {boolean} enabled - Whether mouse controls should be enabled
         */
        setMouseControlsEnabled(enabled) {
            mouseState.enabled = enabled;
            
            if (enabled) {
                // FIXED: Added error handling for pointer lock request
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
 * @param {HTMLCanvasElement} canvas - Canvas element for events
 */
function setupKeyboardInput(keyState, canvas) {
    // Key codes
    const keyCodes = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        SPACE: 32,
        SHIFT: 16,
        ALT: 18,
        CTRL: 17
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
            // FIXED: Added error handling for pointer lock request
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
 * Update camera position and rotation based on input
 * @param {BABYLON.Camera} camera - The camera to update
 * @param {Object} keyState - Current key states
 * @param {Object} mouseState - Current mouse state
 */
function updateCamera(camera, keyState, mouseState) {
    // Get settings from config
    const moveSpeed = config.camera.moveSpeed;
    const rotationSpeed = config.camera.rotationSpeed;
    
    // Apply speed modifiers
    let currentSpeed = moveSpeed;
    if (keyState.sprint) currentSpeed *= 2.0;
    if (keyState.slow) currentSpeed *= 0.5;
    
    // Movement vectors
    let forwardVector = camera.getDirection(BABYLON.Vector3.Forward());
    let rightVector = camera.getDirection(BABYLON.Vector3.Right());
    let upVector = BABYLON.Vector3.Up();
    
    // Zero out Y component for forward and right vectors to keep movement horizontal
    forwardVector.y = 0;
    forwardVector.normalize();
    
    rightVector.y = 0;
    rightVector.normalize();
    
    // Calculate movement direction
    let movementDirection = BABYLON.Vector3.Zero();
    
    if (keyState.forward) movementDirection.addInPlace(forwardVector);
    if (keyState.backward) movementDirection.subtractInPlace(forwardVector);
    if (keyState.right) movementDirection.addInPlace(rightVector);
    if (keyState.left) movementDirection.subtractInPlace(rightVector);
    if (keyState.up) movementDirection.addInPlace(upVector);
    if (keyState.down) movementDirection.subtractInPlace(upVector);
    
    // Normalize and scale movement
    if (movementDirection.length() > 0) {
        movementDirection.normalize();
        movementDirection.scaleInPlace(currentSpeed);
        
        // Apply movement
        camera.position.addInPlace(movementDirection);
    }
    
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
}