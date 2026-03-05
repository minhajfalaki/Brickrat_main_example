// collisionBox.js
import * as THREE from '../../lib/three/three.module.js';

export function createCollisionBox(x = 0, y = 0, z = 0, width = 1, height = 1, depth = 1) {
    // Create a single box geometry
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create a material that's visible but semi-transparent
    const material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    
    // Create the box mesh
    const collisionBox = new THREE.Mesh(geometry, material);
    collisionBox.position.set(x, y, z);
    
    // Make the box selectable
    collisionBox.userData.isSelectable = true;
    
    return {
        collisionBox,
        width,
        height,
        depth
    };
} 