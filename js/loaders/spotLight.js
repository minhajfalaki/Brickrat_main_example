// spotLight.js
import * as THREE from '../../lib/three/three.module.js';

export function createSpotLight(x, y, z) {
  // Create the spotlight
  const intensity = 50;
  const spotLight = new THREE.SpotLight(0xff0000, intensity);
  spotLight.angle = Math.PI / 6; // 30 degrees
  spotLight.penumbra = 0.1;
  spotLight.decay = 2;
  spotLight.distance = 20;

  // Set position
  spotLight.position.set(x, y, z);

  // Point the light downward
  const targetObject = new THREE.Object3D();
  targetObject.position.set(x, y - 1, z);
  spotLight.target = targetObject;

  // Create a helper sphere for selection
  const helperSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
  );
  helperSphere.position.copy(spotLight.position);

  // Create a group to hold the light, helper sphere, and target
  const helper = new THREE.Group();
  helper.add(helperSphere);

  // Spotlight helper
  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  helper.add(spotLightHelper);

  // Add light and its target
  helper.add(spotLight);
  helper.add(targetObject);

  // Add update method
  helper.update = function () {
    helperSphere.position.copy(spotLight.position);
    spotLightHelper.update();
  };

  return {
    light: spotLight,
    helper: helper
  };
}
