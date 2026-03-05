// pointLight.js
import * as THREE from '../../lib/three/three.module.js';

export function createPointLight(x, y, z) {
  // Create the point light
  const pointLight = new THREE.PointLight(0xff0000, 50, 20, 2);
  pointLight.position.set(x, y, z);

  // Create a helper (a small wireframe sphere)
  const lightHelper = new THREE.PointLightHelper(pointLight, 0.5, 0xff0000);

  return { light: pointLight, helper: lightHelper };
} 