// rectLight.js
import * as THREE from '../../lib/three/three.module.js';
import { RectAreaLight } from '../../lib/three/three.module.js';
import { RectAreaLightHelper } from '../../lib/three/helpers/RectAreaLightHelper.js';

export function createRectLight(x, y, z) {
  // Create the rectangular light
  const width = 10;
  const height = 5;
  const intensity = 50;
  const rectLight = new RectAreaLight(0xff0000, intensity, width, height);
  rectLight.position.set(x, y, z);
  rectLight.lookAt(x, y - 1, z); // Point slightly downward

  // Create a helper sphere for selection (similar to point light)
  const helperSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    })
  );
  helperSphere.position.copy(rectLight.position);

  // Create a group to hold both the helper sphere and the rect light helper
  const helper = new THREE.Group();
  helper.add(helperSphere);

  // Create the rect area light helper
  const rectHelper = new RectAreaLightHelper(rectLight);
  helper.add(rectHelper);

  // Add the light to the helper group for easier management
  helper.add(rectLight);

  // Add update method to the helper group
  helper.update = function() {
    helperSphere.position.copy(rectLight.position);
    rectHelper.update();
  };

  return { light: rectLight, helper: helper };
}