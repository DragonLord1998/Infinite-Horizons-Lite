/**
 * Camera configuration for Infinite Horizons
 */

/**
 * Sets up the camera for the scene
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} cameraConfig - Camera configuration from config.js
 * @returns {BABYLON.FreeCamera} The configured camera
 */
export function setupCamera(scene, cameraConfig) {
    // Create a free camera for user control
    const camera = new BABYLON.FreeCamera(
        "mainCamera", 
        new BABYLON.Vector3(...cameraConfig.initialPosition), 
        scene
    );
    
    // Set the camera's target to look slightly downward
    camera.setTarget(new BABYLON.Vector3(
        cameraConfig.initialPosition[0] + 10, 
        cameraConfig.initialPosition[1] - 10, 
        cameraConfig.initialPosition[2] + 10
    ));
    
    // Configure camera settings
    camera.fov = cameraConfig.fov;
    camera.minZ = 0.1; // Near clip plane
    camera.maxZ = 2000; // Far clip plane
    camera.speed = cameraConfig.moveSpeed;
    camera.angularSensibility = 1000 / cameraConfig.rotationSpeed;
    
    // Set camera as active camera
    scene.activeCamera = camera;
    
    // Attach camera to canvas for input
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    
    // Customize camera behavior for terrain exploration
    customizeCameraBehavior(camera);
    
    return camera;
}

/**
 * Customizes camera behavior for terrain exploration
 * @param {BABYLON.FreeCamera} camera - The camera to customize
 */
function customizeCameraBehavior(camera) {
    // Store original position for height adaptation
    camera._previousPosition = camera.position.clone();
    
    // Add height adaptation behavior to camera to follow terrain
    // This will be enhanced later when we have actual terrain height data
    camera.onAfterCheckInputsObservable.add(() => {
        // This is a placeholder for potential terrain-following behavior
        // It will be implemented more fully once we have terrain generation
    });
    
    // Disable camera collision for MVP
    camera.checkCollisions = false;
    
    // Enable camera inertia for smoother movement
    camera.inertia = 0.7;
    
    // Set ellipsoid to represent character body size for future collision detection
    camera.ellipsoid = new BABYLON.Vector3(1, 2, 1);
    
    // Add the camera keys based on a US keyboard
    camera.keysUp = [87]; // W
    camera.keysDown = [83]; // S
    camera.keysLeft = [65]; // A
    camera.keysRight = [68]; // D
}