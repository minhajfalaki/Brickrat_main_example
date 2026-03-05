/**
 * Baking Utility for Three.js Scene
 * This utility handles the process of baking lighting information into textures
 * to improve performance in the final presentation mode.
 */

import * as THREE from '../../lib/three/three.module.js';

// Progress tracking object
const progress = {
    totalObjects: 0,
    processedObjects: 0,
    currentObject: '',
    currentPhase: '',
    startTime: null,
    elapsedTime: 0,
    progressBar: null,
    progressContainer: null,
    isMinimized: false,
    isCancelled: false,
    
    createProgressUI() {
        // Create container
        this.progressContainer = document.createElement('div');
        this.progressContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            min-width: 300px;
            transition: all 0.3s ease;
        `;

        // Create header with minimize button
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-weight: bold;
            font-size: 16px;
        `;
        title.textContent = 'Baking Progress';

        const minimizeButton = document.createElement('button');
        minimizeButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            font-size: 20px;
            line-height: 1;
        `;
        minimizeButton.innerHTML = '−';
        minimizeButton.onclick = () => this.toggleMinimize();

        header.appendChild(title);
        header.appendChild(minimizeButton);

        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            transition: all 0.3s ease;
            overflow: hidden;
        `;
        content.id = 'baking-content';

        // Create progress bar container
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = `
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            margin: 10px 0;
            overflow: hidden;
        `;

        // Create progress bar
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: #4CAF50;
            transition: width 0.3s ease;
        `;

        // Create status text
        const statusText = document.createElement('div');
        statusText.style.cssText = `
            font-size: 14px;
            margin-bottom: 5px;
            text-align: center;
        `;
        statusText.id = 'baking-status';

        // Create details text
        const detailsText = document.createElement('div');
        detailsText.style.cssText = `
            font-size: 12px;
            color: #aaa;
            text-align: center;
            margin-bottom: 10px;
        `;
        detailsText.id = 'baking-details';

        // Create cancel button
        const cancelButton = document.createElement('button');
        cancelButton.style.cssText = `
            background: #ff4444;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            width: 100%;
            transition: background 0.3s ease;
        `;
        cancelButton.textContent = 'Cancel Baking';
        cancelButton.onmouseover = () => cancelButton.style.background = '#ff6666';
        cancelButton.onmouseout = () => cancelButton.style.background = '#ff4444';
        cancelButton.onclick = () => this.cancelBaking();

        // Assemble UI
        progressBarContainer.appendChild(this.progressBar);
        content.appendChild(statusText);
        content.appendChild(progressBarContainer);
        content.appendChild(detailsText);
        content.appendChild(cancelButton);

        this.progressContainer.appendChild(header);
        this.progressContainer.appendChild(content);

        // Add to document
        document.body.appendChild(this.progressContainer);
    },

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        const content = document.getElementById('baking-content');
        const minimizeButton = this.progressContainer.querySelector('button');
        
        if (this.isMinimized) {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            minimizeButton.innerHTML = '+';
            this.progressContainer.style.minWidth = '200px';
        } else {
            content.style.maxHeight = '500px';
            content.style.opacity = '1';
            minimizeButton.innerHTML = '−';
            this.progressContainer.style.minWidth = '300px';
        }
    },

    cancelBaking() {
        this.isCancelled = true;
        const statusText = document.getElementById('baking-status');
        const detailsText = document.getElementById('baking-details');
        const cancelButton = this.progressContainer.querySelector('button:last-child');
        
        statusText.textContent = 'Cancelling...';
        detailsText.textContent = 'Please wait while we clean up...';
        cancelButton.disabled = true;
        cancelButton.style.background = '#666';
        cancelButton.textContent = 'Cancelling...';
    },

    removeProgressUI() {
        if (this.progressContainer) {
            this.progressContainer.remove();
            this.progressContainer = null;
            this.progressBar = null;
        }
    },
    
    update(phase, objectName = '') {
        if (this.isCancelled) return;
        
        this.currentPhase = phase;
        this.currentObject = objectName;
        this.processedObjects++;
        this.elapsedTime = (Date.now() - this.startTime) / 1000;
        
        const percentage = (this.processedObjects / this.totalObjects) * 100;
        const remainingObjects = this.totalObjects - this.processedObjects;
        const estimatedTimeRemaining = (this.elapsedTime / this.processedObjects) * remainingObjects;
        
        // Update progress bar
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }

        // Update status text
        const statusText = document.getElementById('baking-status');
        if (statusText) {
            statusText.textContent = `${this.currentPhase}: ${this.currentObject}`;
        }

        // Update details text
        const detailsText = document.getElementById('baking-details');
        if (detailsText) {
            detailsText.textContent = `Progress: ${percentage.toFixed(1)}% | Time: ${this.elapsedTime.toFixed(1)}s | Remaining: ${estimatedTimeRemaining.toFixed(1)}s`;
        }
        
        console.log(`
=== Baking Progress ===
Phase: ${this.currentPhase}
Current Object: ${this.currentObject}
Progress: ${percentage.toFixed(1)}%
Processed: ${this.processedObjects}/${this.totalObjects}
Elapsed Time: ${this.elapsedTime.toFixed(1)}s
Estimated Time Remaining: ${estimatedTimeRemaining.toFixed(1)}s
=====================
        `);
    }
};

/**
 * Creates a baking renderer with specific settings for lightmap generation
 * @returns {THREE.WebGLRenderer} A configured renderer for baking
 */
function createBakerRenderer() {
    progress.update('Creating baking renderer');
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    
    renderer.setSize(1024, 1024);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    return renderer;
}

/**
 * Creates a camera for baking from a specific angle
 * @param {THREE.Object3D} object - The object to bake
 * @returns {THREE.PerspectiveCamera} A camera positioned to capture the object
 */
function createBakingCamera(object) {
    progress.update('Setting up camera', object.name);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    camera.position.set(distance, distance, distance);
    camera.lookAt(box.getCenter(new THREE.Vector3()));
    
    return camera;
}

/**
 * Creates appropriate baking material based on the original material type
 * @param {THREE.Material} originalMaterial - The original material to analyze
 * @returns {THREE.Material} A suitable material for baking
 */
function createBakingMaterial(originalMaterial) {
    let bakingMaterial;
    
    // Create appropriate material type based on original
    if (originalMaterial.isMeshPhysicalMaterial) {
        bakingMaterial = new THREE.MeshPhysicalMaterial({
            color: originalMaterial.color || 0xffffff,
            side: originalMaterial.side || THREE.DoubleSide,
            transparent: originalMaterial.transparent || false,
            opacity: originalMaterial.opacity || 1.0,
            clearcoat: originalMaterial.clearcoat || 0,
            clearcoatRoughness: originalMaterial.clearcoatRoughness || 1,
            reflectivity: originalMaterial.reflectivity || 0.5,
            transmission: originalMaterial.transmission || 0,
            thickness: originalMaterial.thickness || 0.5
        });
    } else if (originalMaterial.isMeshToonMaterial) {
        bakingMaterial = new THREE.MeshToonMaterial({
            color: originalMaterial.color || 0xffffff,
            side: originalMaterial.side || THREE.DoubleSide,
            transparent: originalMaterial.transparent || false,
            opacity: originalMaterial.opacity || 1.0,
            gradientMap: originalMaterial.gradientMap || null
        });
    } else if (originalMaterial.isMeshStandardMaterial) {
        bakingMaterial = new THREE.MeshStandardMaterial({
            color: originalMaterial.color || 0xffffff,
            side: originalMaterial.side || THREE.DoubleSide,
            transparent: originalMaterial.transparent || false,
            opacity: originalMaterial.opacity || 1.0,
            metalness: originalMaterial.metalness || 0,
            roughness: originalMaterial.roughness || 0.5
        });
    } else {
        // Default to MeshBasicMaterial for other types
        bakingMaterial = new THREE.MeshBasicMaterial({
            color: originalMaterial.color || 0xffffff,
            side: originalMaterial.side || THREE.DoubleSide,
            transparent: originalMaterial.transparent || false,
            opacity: originalMaterial.opacity || 1.0
        });
    }

    // Copy all relevant maps from the original material
    const mapsToCopy = [
        'map', 'normalMap', 'roughnessMap', 'metalnessMap',
        'aoMap', 'emissiveMap', 'bumpMap', 'displacementMap',
        'alphaMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
        'transmissionMap', 'thicknessMap', 'gradientMap'
    ];

    mapsToCopy.forEach(mapName => {
        if (originalMaterial[mapName]) {
            bakingMaterial[mapName] = originalMaterial[mapName];
        }
    });

    // Copy environment map if it exists
    if (originalMaterial.envMap) {
        bakingMaterial.envMap = originalMaterial.envMap;
    }

    return bakingMaterial;
}

/**
 * Calculates the lightmap for a given object
 * @param {THREE.Object3D} object - The object to bake lighting for
 * @param {THREE.Scene} scene - The scene containing all lights
 * @param {THREE.WebGLRenderer} baker - The baking renderer
 * @returns {THREE.Texture} The generated lightmap
 */
function calculateLightmap(object, scene, baker) {
    progress.update('Calculating lightmap', object.name);
    
    const bakingScene = new THREE.Scene();
    const bakingObject = object.clone();
    
    // Create appropriate baking material based on original material
    const bakingMaterial = createBakingMaterial(object.material);
    bakingObject.material = bakingMaterial;
    bakingScene.add(bakingObject);
    
    // Add all lights from the original scene
    scene.traverse(node => {
        if (node.isLight) {
            bakingScene.add(node.clone());
        }
    });
    
    // Add environment map if it exists in the original scene
    if (scene.environment) {
        bakingScene.environment = scene.environment;
    }
    
    const camera = createBakingCamera(bakingObject);
    baker.render(bakingScene, camera);
    
    const lightmap = baker.getContext().canvas;
    
    // Clean up
    bakingScene.remove(bakingObject);
    bakingObject.geometry.dispose();
    bakingMaterial.dispose();
    
    return lightmap;
}

/**
 * Applies the baked lightmap to the original material
 * @param {THREE.Material} material - The original material
 * @param {THREE.Texture} lightmap - The baked lightmap
 * @returns {THREE.Material} The baked material
 */
function applyLightmapToMaterial(material, lightmap) {
    // Create a new material that combines the original with the lightmap
    const bakedMaterial = material.clone();
    
    // Apply the lightmap
    bakedMaterial.lightMap = new THREE.CanvasTexture(lightmap);
    bakedMaterial.lightMapIntensity = 1.0;
    
    // Disable real-time lighting features
    bakedMaterial.needsUpdate = true;
    
    // Handle different material types
    if (bakedMaterial.isMeshPhysicalMaterial) {
        bakedMaterial.envMapIntensity = 0;
        bakedMaterial.metalness = 0;
        bakedMaterial.roughness = 0.5;
        bakedMaterial.clearcoat = 0;
        bakedMaterial.transmission = 0;
    } else if (bakedMaterial.isMeshStandardMaterial) {
        bakedMaterial.envMapIntensity = 0;
        bakedMaterial.metalness = 0;
        bakedMaterial.roughness = 0.5;
    } else if (bakedMaterial.isMeshToonMaterial) {
        bakedMaterial.gradientMap = null;
    }
    
    // Disable environment map reflection
    bakedMaterial.envMap = null;
    
    return bakedMaterial;
}

/**
 * Main function to bake lighting for all objects in a scene
 * @param {THREE.Scene} scene - The scene to bake
 * @returns {Promise<void>} A promise that resolves when baking is complete
 */
export async function bakeScene(scene) {
    console.log('Starting scene baking process...');
    progress.startTime = Date.now();
    progress.isCancelled = false;
    
    // Create progress UI
    progress.createProgressUI();
    
    // Create baking renderer
    const baker = createBakerRenderer();
    
    // Count total objects to process
    scene.traverse(object => {
        if (object.isMesh) {
            progress.totalObjects++;
        }
    });
    
    console.log(`Found ${progress.totalObjects} objects to bake`);
    
    // Process each mesh in the scene
    for (const object of scene.children) {
        if (progress.isCancelled) break;
        
        if (object.isMesh) {
            try {
                progress.update('Processing', object.name);
                
                // Calculate lightmap for this object
                const lightmap = calculateLightmap(object, scene, baker);
                
                // Apply lightmap to the object's material
                if (object.material) {
                    object.material = applyLightmapToMaterial(object.material, lightmap);
                }
                
            } catch (error) {
                console.error(`Error baking object ${object.name || 'Unnamed'}:`, error);
            }
        }
    }
    
    // Clean up
    baker.dispose();
    progress.removeProgressUI();
    
    if (progress.isCancelled) {
        console.log('Baking process cancelled by user');
    } else {
        console.log(`
=== Baking Complete ===
Total Objects: ${progress.totalObjects}
Total Time: ${progress.elapsedTime.toFixed(1)}s
=====================
        `);
    }
} 