/**
 * UI for material parameter adjustments
 */
import config from '../config.js';
import { updateShaderParameters, saveMaterialPreset, loadMaterialPreset, getPredefinedPresets } from '../materials/shaderTerrainMaterial.js';

/**
 * Initialize the material UI panel
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {BABYLON.ShaderMaterial} material - The shader material to control
 * @returns {Object} The UI control object
 */
export function initMaterialUI(scene, material) {
    // Create UI container
    const container = document.createElement('div');
    container.id = 'materialUI';
    container.className = 'ui-panel';
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.width = '300px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    container.style.color = 'white';
    container.style.borderRadius = '5px';
    container.style.padding = '10px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '14px';
    container.style.zIndex = '100';
    container.style.maxHeight = 'calc(100vh - 20px)';
    container.style.overflowY = 'auto';
    container.style.display = 'none'; // Hidden by default
    
    // Create panel header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '10px';
    header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.3)';
    header.style.paddingBottom = '5px';
    
    const title = document.createElement('h3');
    title.textContent = 'Material Editor';
    title.style.margin = '0';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.width = '24px';
    closeButton.style.height = '24px';
    closeButton.style.lineHeight = '1';
    closeButton.style.textAlign = 'center';
    
    header.appendChild(title);
    header.appendChild(closeButton);
    container.appendChild(header);
    
    // Create preset selector
    const presetContainer = document.createElement('div');
    presetContainer.style.marginBottom = '15px';
    
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Presets: ';
    presetLabel.style.display = 'block';
    presetLabel.style.marginBottom = '5px';
    
    const presetSelect = document.createElement('select');
    presetSelect.style.width = '100%';
    presetSelect.style.backgroundColor = 'rgba(30, 30, 30, 0.7)';
    presetSelect.style.color = 'white';
    presetSelect.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    presetSelect.style.borderRadius = '3px';
    presetSelect.style.padding = '5px';
    
    // Add predefined presets
    const presets = getPredefinedPresets();
    Object.keys(presets).forEach(presetName => {
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName.charAt(0).toUpperCase() + presetName.slice(1);
        presetSelect.appendChild(option);
    });
    
    // Add custom presets from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('infiniteHorizons_materialPreset_') && key !== 'infiniteHorizons_materialPreset_default') {
            const presetName = key.replace('infiniteHorizons_materialPreset_', '');
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName.charAt(0).toUpperCase() + presetName.slice(1) + ' (Custom)';
            presetSelect.appendChild(option);
        }
    }
    
    presetContainer.appendChild(presetLabel);
    presetContainer.appendChild(presetSelect);
    container.appendChild(presetContainer);
    
    // Preset buttons
    const presetButtonsContainer = document.createElement('div');
    presetButtonsContainer.style.display = 'flex';
    presetButtonsContainer.style.gap = '5px';
    presetButtonsContainer.style.marginBottom = '15px';
    
    const savePresetButton = document.createElement('button');
    savePresetButton.textContent = 'Save';
    styleButton(savePresetButton);
    savePresetButton.style.flex = '1';
    
    const loadPresetButton = document.createElement('button');
    loadPresetButton.textContent = 'Load';
    styleButton(loadPresetButton);
    loadPresetButton.style.flex = '1';
    
    const newPresetButton = document.createElement('button');
    newPresetButton.textContent = 'New';
    styleButton(newPresetButton);
    newPresetButton.style.flex = '1';
    
    presetButtonsContainer.appendChild(savePresetButton);
    presetButtonsContainer.appendChild(loadPresetButton);
    presetButtonsContainer.appendChild(newPresetButton);
    container.appendChild(presetButtonsContainer);
    
    // Create sections
    const colorSection = createSection('Colors', container);
    const heightSection = createSection('Height Transitions', container);
    const slopeSection = createSection('Slope Settings', container);
    const noiseSection = createSection('Noise Settings', container);
    
    // Color controls
    createColorPicker('Grass Color', 'grassColor', material, colorSection);
    createColorPicker('Rock Color', 'rockColor', material, colorSection);
    createColorPicker('Snow Color', 'snowColor', material, colorSection);
    createColorPicker('Sand Color', 'sandColor', material, colorSection);
    
    // Height transition controls
    createSlider('Snow Height', 'snowHeight', 0, 1, 0.01, material, heightSection);
    createSlider('Rock Height', 'rockHeight', 0, 1, 0.01, material, heightSection);
    createSlider('Sand Height', 'sandHeight', 0, 1, 0.01, material, heightSection);
    
    // Slope controls
    createSlider('Steep Slope Threshold', 'steepSlopeThreshold', 0, 1, 0.01, material, slopeSection);
    createSlider('Slope Smoothness', 'slopeSmoothness', 0, 0.5, 0.01, material, slopeSection);
    
    // Noise controls
    createSlider('Global Noise Scale', 'globalNoiseScale', 0.001, 0.05, 0.001, material, noiseSection);
    createSlider('Detail Noise Scale', 'detailNoiseScale', 1, 100, 1, material, noiseSection);
    createSlider('Noise Intensity', 'noiseIntensity', 0, 0.5, 0.01, material, noiseSection);
    createSlider('Material Blend Sharpness', 'materialBlendSharpness', 1, 20, 0.5, material, noiseSection);
    
    // Add to document
    document.body.appendChild(container);
    
    // Setup event handlers
    closeButton.addEventListener('click', () => {
        container.style.display = 'none';
    });
    
    presetSelect.addEventListener('change', () => {
        const selectedPreset = presetSelect.value;
        
        // Try to load from localStorage first (for custom presets)
        const success = loadMaterialPreset(material, selectedPreset);
        
        // If not found in localStorage, try predefined presets
        if (!success && presets[selectedPreset]) {
            updateShaderParameters(material, presets[selectedPreset]);
            
            // Update UI controls to reflect new values
            updateUIFromMaterial(material, container);
        }
    });
    
    loadPresetButton.addEventListener('click', () => {
        const selectedPreset = presetSelect.value;
        
        // Try to load from localStorage first
        const success = loadMaterialPreset(material, selectedPreset);
        
        // If not found in localStorage, try predefined presets
        if (!success && presets[selectedPreset]) {
            updateShaderParameters(material, presets[selectedPreset]);
        }
        
        // Update UI controls to reflect new values
        updateUIFromMaterial(material, container);
    });
    
    savePresetButton.addEventListener('click', () => {
        const selectedPreset = presetSelect.value;
        saveMaterialPreset(material, selectedPreset);
        
        // Show confirmation message
        showNotification(`Preset "${selectedPreset}" saved successfully!`);
    });
    
    newPresetButton.addEventListener('click', () => {
        // Prompt for new preset name
        const presetName = prompt('Enter name for new preset:');
        
        if (presetName) {
            // Save preset with new name
            saveMaterialPreset(material, presetName);
            
            // Add new option to select
            const option = document.createElement('option');
            option.value = presetName;
            option.textContent = presetName.charAt(0).toUpperCase() + presetName.slice(1) + ' (Custom)';
            presetSelect.appendChild(option);
            
            // Select the new option
            presetSelect.value = presetName;
            
            // Show confirmation
            showNotification(`New preset "${presetName}" created!`);
        }
    });
    
    // Set up keyboard shortcut
    window.addEventListener('keydown', (e) => {
        // Alt+M to toggle material UI
        if (e.key === 'm' && e.altKey) {
            toggleUI();
            e.preventDefault();
        }
    });
    
    // Toggle UI function
    function toggleUI() {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            updateUIFromMaterial(material, container);
        } else {
            container.style.display = 'none';
        }
    }
    
    // Return UI control object
    return {
        container,
        toggleUI,
        updateUI: () => updateUIFromMaterial(material, container)
    };
}

/**
 * Create a section in the UI panel
 * @param {string} title - Section title
 * @param {HTMLElement} container - Parent container
 * @returns {HTMLElement} Created section element
 */
function createSection(title, container) {
    const section = document.createElement('div');
    section.className = 'ui-section';
    section.style.marginBottom = '15px';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    sectionTitle.style.margin = '0 0 5px 0';
    sectionTitle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
    sectionTitle.style.paddingBottom = '3px';
    
    section.appendChild(sectionTitle);
    container.appendChild(section);
    
    return section;
}

/**
 * Create a color picker control
 * @param {string} label - Control label
 * @param {string} parameter - Shader parameter name
 * @param {BABYLON.ShaderMaterial} material - Shader material
 * @param {HTMLElement} container - Parent container
 */
function createColorPicker(label, parameter, material, container) {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'control';
    controlContainer.style.display = 'flex';
    controlContainer.style.justifyContent = 'space-between';
    controlContainer.style.alignItems = 'center';
    controlContainer.style.marginBottom = '5px';
    
    const controlLabel = document.createElement('label');
    controlLabel.textContent = label;
    controlLabel.style.flex = '1';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.dataset.parameter = parameter;
    
    // Get initial color from material
    const color3 = material[parameter];
    if (color3) {
        const hexColor = BABYLON.Color3.ToHexString(color3);
        colorInput.value = hexColor;
    }
    
    colorInput.addEventListener('input', () => {
        // Update material with new color
        const params = {};
        params[parameter] = colorInput.value;
        updateShaderParameters(material, params);
    });
    
    controlContainer.appendChild(controlLabel);
    controlContainer.appendChild(colorInput);
    container.appendChild(controlContainer);
    
    return controlContainer;
}

/**
 * Create a slider control
 * @param {string} label - Control label
 * @param {string} parameter - Shader parameter name
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} step - Step value
 * @param {BABYLON.ShaderMaterial} material - Shader material
 * @param {HTMLElement} container - Parent container
 */
function createSlider(label, parameter, min, max, step, material, container) {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'control';
    controlContainer.style.marginBottom = '10px';
    
    const controlHeader = document.createElement('div');
    controlHeader.style.display = 'flex';
    controlHeader.style.justifyContent = 'space-between';
    controlHeader.style.alignItems = 'center';
    controlHeader.style.marginBottom = '3px';
    
    const controlLabel = document.createElement('label');
    controlLabel.textContent = label;
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'value-display';
    valueDisplay.style.fontFamily = 'monospace';
    
    // Get initial value from material
    const initialValue = material[parameter] !== undefined ? material[parameter] : 0;
    valueDisplay.textContent = initialValue.toFixed(step < 0.1 ? 3 : 1);
    
    controlHeader.appendChild(controlLabel);
    controlHeader.appendChild(valueDisplay);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = initialValue;
    slider.dataset.parameter = parameter;
    slider.style.width = '100%';
    slider.style.height = '20px';
    slider.style.margin = '0';
    
    slider.addEventListener('input', () => {
        // Update value display
        valueDisplay.textContent = parseFloat(slider.value).toFixed(step < 0.1 ? 3 : 1);
        
        // Update material with new value
        const params = {};
        params[parameter] = parseFloat(slider.value);
        updateShaderParameters(material, params);
    });
    
    controlContainer.appendChild(controlHeader);
    controlContainer.appendChild(slider);
    container.appendChild(controlContainer);
    
    return controlContainer;
}

/**
 * Update UI controls from material values
 * @param {BABYLON.ShaderMaterial} material - Shader material
 * @param {HTMLElement} container - UI container
 */
function updateUIFromMaterial(material, container) {
    // Update color inputs
    const colorInputs = container.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        const parameter = input.dataset.parameter;
        const color3 = material[parameter];
        if (color3) {
            const hexColor = BABYLON.Color3.ToHexString(color3);
            input.value = hexColor;
        }
    });
    
    // Update sliders
    const sliders = container.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const parameter = slider.dataset.parameter;
        if (material[parameter] !== undefined) {
            slider.value = material[parameter];
            // Update value display
            const valueDisplay = slider.parentElement.querySelector('.value-display');
            if (valueDisplay) {
                valueDisplay.textContent = parseFloat(slider.value).toFixed(
                    parseFloat(slider.step) < 0.1 ? 3 : 1
                );
            }
        }
    });
}

/**
 * Apply common button styling
 * @param {HTMLButtonElement} button - Button to style
 */
function styleButton(button) {
    button.style.backgroundColor = 'rgba(60, 60, 60, 0.7)';
    button.style.color = 'white';
    button.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    button.style.borderRadius = '3px';
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = 'rgba(80, 80, 80, 0.7)';
    });
    
    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'rgba(60, 60, 60, 0.7)';
    });
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 */
function showNotification(message) {
    // Check if notification element already exists
    let notification = document.getElementById('ui-notification');
    
    if (!notification) {
        // Create notification element
        notification = document.createElement('div');
        notification.id = 'ui-notification';
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.zIndex = '200';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        
        document.body.appendChild(notification);
    }
    
    // Update message and show
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
    }, 3000);
}
