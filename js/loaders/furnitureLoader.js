import * as THREE from '../../lib/three/three.module.js';
import { FBXLoader } from '../../lib/three/loaders/FBXLoader.js';

export function createFurniture(modelPath, x, y, z, scale = 0.001) {
  // Create a helper group
  const helper = new THREE.Group();
  const helperSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
  );
  helper.add(helperSphere);
  helper.position.set(x, y, z);

  // Create the FBX loader
  const fbxLoader = new FBXLoader();

  // Create a promise to handle the async loading
  const loadPromise = new Promise((resolve, reject) => {
    fbxLoader.load(
      modelPath,
      (object) => {
        // Process the loaded model
        object.traverse((child) => {
          if (child.isMesh) {
            // Apply default material if none exists
            if (!child.material) {
              child.material = new THREE.MeshPhongMaterial({
                color: 0x808080,
                side: THREE.DoubleSide
              });
            }
            // Enable shadows
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Set the model's position and scale
        object.position.set(0, 0, 0); // Position relative to helper
        object.scale.set(0.003, 0.003, 0.003);
        console.log("Current scale:", object.scale);

        // Store references both ways for easier access
        helper.userData.model = object;
        object.userData.helper = helper;
        helperSphere.userData.model = object;

        // Add the model to the helper
        helper.add(object);

        resolve({ model: object, helper });
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loadedss');
      },
      (error) => {
        console.error('Error loading model:', error);
        reject(error);
      }
    );
  });

  // Return the helper immediately and the promise for the loaded model
  return {
    model: null, // Will be set when loaded
    helper,
    loadPromise
  };
} 