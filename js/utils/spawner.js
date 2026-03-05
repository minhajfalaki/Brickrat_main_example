import * as THREE from '../../lib/three/three.module.js';

/**
 * Calculates the best position to spawn an object in front of the camera
 * @param {THREE.Camera} camera - The camera to spawn relative to
 * @param {THREE.Scene} scene - The scene containing potential obstacles
 * @param {number} distance - Desired distance from camera (default: 20)
 * @param {number} offset - Offset from obstacles (default: 1)
 * @returns {THREE.Vector3} The calculated spawn position
 */
export function calculateSpawnPosition(camera, scene, distance = 20, offset = 1) {
  // Get camera's direction vector
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  
  // Calculate desired position (distance units in front of camera)
  const cameraPosition = camera.position.clone();
  const desiredPosition = cameraPosition.clone().add(direction.multiplyScalar(distance));
  
  // Set up raycaster to check for objects between camera and desired position
  const raycaster = new THREE.Raycaster();
  raycaster.set(cameraPosition, direction);
  
  // Get all objects in the scene that could block the spawn
  const objects = [];
  scene.traverse((object) => {
    if (object.isMesh) {
      objects.push(object);
    }
  });
  
  // Check for intersections
  const intersects = raycaster.intersectObjects(objects);
  
  if (intersects.length > 0) {
    // If there's an object closer than the desired distance, place spawn just before it
    const firstIntersection = intersects[0];
    if (firstIntersection.distance < distance) {
      // Place spawn offset units before the intersection point
      return cameraPosition.clone().add(
        direction.normalize().multiplyScalar(firstIntersection.distance - offset)
      );
    }
  }
  
  // If no obstacles, use the desired position
  return desiredPosition;
} 