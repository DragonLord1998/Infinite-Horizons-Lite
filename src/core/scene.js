/**
 * Scene management for Infinite Horizons
 */

/**
 * Creates and initializes the Babylon.js scene
 * @param {BABYLON.Engine} engine - The Babylon.js engine
 * @returns {BABYLON.Scene} The initialized scene
 */
export function createScene(engine) {
    // Create a new scene
    const scene = new BABYLON.Scene(engine);
    
    // Set a clear sky blue color for the background
    scene.clearColor = new BABYLON.Color3(0.4, 0.6, 0.9);
    
    // Configure basic scene settings
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    scene.collisionsEnabled = false; // Disable collisions for performance in MVP
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0); // Standard gravity
    
    // Configure fog (disabled by default, can be enabled later)
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogColor = scene.clearColor.clone();
    scene.fogDensity = 0.001;
    scene.fogEnabled = false;
    
    // Setup basic lighting
    setupLighting(scene);
    
    return scene;
}

/**
 * Sets up basic lighting for the scene
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function setupLighting(scene) {
    // Create a directional light for the sun
    const sunLight = new BABYLON.DirectionalLight(
        "sunLight",
        new BABYLON.Vector3(-0.5, -0.75, 0.5),
        scene
    );
    
    // Configure light properties
    sunLight.intensity = 0.8;
    sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8);  // Warm sunlight color
    sunLight.specular = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specularity for natural look
    
    // Add a hemispheric light for ambient lighting
    const hemisphericLight = new BABYLON.HemisphericLight(
        "hemisphericLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    
    // Configure hemispheric light properties
    hemisphericLight.intensity = 0.5;
    hemisphericLight.diffuse = new BABYLON.Color3(0.6, 0.7, 0.8);  // Sky color
    hemisphericLight.groundColor = new BABYLON.Color3(0.2, 0.15, 0.1); // Ground color
    
    // Create a subtle skybox for the horizon (can be enhanced later)
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
    
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.disableLighting = true;
    
    skybox.material = skyboxMaterial;
}