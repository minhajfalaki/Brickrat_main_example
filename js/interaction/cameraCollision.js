// cameraCollision.js
import * as THREE from '../../lib/three/three.module.js';

export function setupCameraCollision(camera, orbitControls, menuManager) {
    const originalUpdate = orbitControls.update;
    orbitControls.update = function() {
        // Get camera's current position and target
        const cameraPosition = camera.position.clone();
        const targetPosition = orbitControls.target.clone();
        
        // Calculate movement direction (from previous position to current)
        const movementDirection = targetPosition.clone().sub(cameraPosition).normalize();
        
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        
        // Check for collisions in multiple directions
        const directions = [
            movementDirection,  // Forward/backward
            new THREE.Vector3(1, 0, 0),  // Right
            new THREE.Vector3(-1, 0, 0), // Left
            new THREE.Vector3(0, 1, 0),  // Up
            new THREE.Vector3(0, -1, 0), // Down
            new THREE.Vector3(1, 1, 0).normalize(),  // Diagonal
            new THREE.Vector3(-1, 1, 0).normalize(),
            new THREE.Vector3(1, -1, 0).normalize(),
            new THREE.Vector3(-1, -1, 0).normalize()
        ];
        
        // Check for intersections with collision boxes
        const collisionBoxes = menuManager.collisionBoxes.map(box => box.collisionBox);
        let collisionDetected = false;
        
        for (const direction of directions) {
            raycaster.set(cameraPosition, direction);
            const intersects = raycaster.intersectObjects(collisionBoxes);
            
            if (intersects.length > 0) {
                const firstIntersection = intersects[0];
                const distance = firstIntersection.distance;
                
                // If we're too close to a collision box, prevent movement in that direction
                if (distance < 0.5) { // 0.5 units minimum distance
                    // Calculate the point where we should stop
                    const stopPoint = cameraPosition.clone().add(
                        direction.multiplyScalar(distance - 0.5)
                    );
                    
                    // Update camera position to stop point
                    camera.position.copy(stopPoint);
                    
                    // Update orbit controls target to maintain relative position
                    const offset = targetPosition.clone().sub(cameraPosition);
                    orbitControls.target.copy(stopPoint.clone().add(offset));
                    
                    collisionDetected = true;
                    break; // Stop checking other directions once we hit something
                }
            }
        }
        
        // Call the original update function
        originalUpdate.call(this);
    };
} 