// collisionInteraction.js
import * as THREE from '../../lib/three/three.module.js';
import { TransformControls } from '../../lib/three/controls/TransformControls.js';
import { createCollisionBox } from '../loaders/collisionBox.js';
import { calculateSpawnPosition } from '../utils/spawner.js';

export function setupCollisionInteraction(scene, camera, renderer, orbitControls, menuManager) {
    // History management
    const history = {
        past: [],
        present: [],
        future: [],
        maxHistoryPoints: 20,
        
        // Save current state
        saveState() {
            const collisionState = menuManager.collisionBoxes.map(box => ({
                type: 'collision',
                position: box.collisionBox.position.clone(),
                rotation: box.collisionBox.rotation.clone(),
                scale: box.collisionBox.scale.clone(),
                collisionBox: box.collisionBox,
                width: box.width,
                height: box.height,
                depth: box.depth
            }));
            
            return collisionState;
        },
        
        // Push current state to history
        push() {
            this.past.push(this.present);
            
            if (this.past.length > this.maxHistoryPoints - 1) {
                this.past.shift();
            }
            
            this.present = this.saveState();
            this.future = [];
        },
        
        // Undo last action
        undo() {
            if (this.past.length === 0) return;
            
            this.future.push(this.present);
            this.present = this.past.pop();
            this.applyState(this.present);
        },
        
        // Redo last undone action
        redo() {
            if (this.future.length === 0) return;
            
            this.past.push(this.present);
            this.present = this.future.pop();
            this.applyState(this.present);
        },
        
        // Apply a state to the scene
        applyState(state) {
            // Clear current scene
            menuManager.collisionBoxes.forEach(box => {
                scene.remove(box.collisionBox);
            });
            
            // Clear array
            menuManager.collisionBoxes = [];
            
            // Apply new state
            state.forEach(item => {
                if (item.type === 'collision') {
                    item.collisionBox.position.copy(item.position);
                    item.collisionBox.rotation.copy(item.rotation);
                    item.collisionBox.scale.copy(item.scale);
                    scene.add(item.collisionBox);
                    menuManager.collisionBoxes.push({
                        collisionBox: item.collisionBox,
                        width: item.width,
                        height: item.height,
                        depth: item.depth
                    });
                }
            });
        }
    };

    // Function to handle keyboard shortcuts
    function handleKeyDown(event) {
        // Undo (Ctrl+Z)
        if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            history.undo();
        }
        // Redo (Ctrl+Y or Ctrl+Shift+Z)
        if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'z')) {
            event.preventDefault();
            history.redo();
        }
        // Delete
        if (event.key === 'Delete' || event.key === 'Backspace') {
            event.preventDefault();
            const selectedObject = transformControls.object;
            if (selectedObject) {
                const collisionIndex = menuManager.collisionBoxes.findIndex(box => 
                    box.collisionBox === selectedObject
                );
                
                if (collisionIndex !== -1) {
                    scene.remove(menuManager.collisionBoxes[collisionIndex].collisionBox);
                    menuManager.collisionBoxes.splice(collisionIndex, 1);
                }
                
                transformControls.detach();
                hideTransformButtons();
                history.push();
            }
        }
    }

    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);

    // Create TransformControls instance
    const transformControls = new TransformControls(camera, renderer.domElement);
    scene.add(transformControls);

    // Create transform mode buttons
    const transformButtons = document.createElement('div');
    transformButtons.className = 'transform-buttons';
    transformButtons.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
    `;
    document.body.appendChild(transformButtons);

    // Create buttons for each transform mode
    const modes = [
        { name: 'translate', icon: '↕️' },
        { name: 'rotate', icon: '🔄' },
        { name: 'scale', icon: '⤡' }
    ];

    modes.forEach(mode => {
        const button = document.createElement('button');
        button.className = 'transform-mode-button';
        button.textContent = mode.icon;
        button.style.cssText = `
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.8);
            cursor: pointer;
            font-size: 20px;
            transition: background-color 0.2s;
        `;
        
        button.onclick = () => {
            transformControls.setMode(mode.name);
            transformButtons.querySelectorAll('.transform-mode-button').forEach(btn => {
                btn.style.background = 'rgba(255, 255, 255, 0.8)';
            });
            button.style.background = 'rgba(0, 150, 255, 0.8)';
        };
        
        transformButtons.appendChild(button);
    });

    // Set initial mode to translate
    transformControls.setMode('translate');
    transformButtons.querySelector('.transform-mode-button').style.background = 'rgba(0, 150, 255, 0.8)';

    // Function to show transform buttons
    function showTransformButtons() {
        transformButtons.style.opacity = '1';
        transformButtons.style.visibility = 'visible';
    }

    // Function to hide transform buttons
    function hideTransformButtons() {
        transformButtons.style.opacity = '0';
        transformButtons.style.visibility = 'hidden';
    }

    // Raycaster and mouse vector for selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function updateMouse(event) {
        mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    }

    // Function to handle object selection
    function handleObjectSelection(event) {
        updateMouse(event);
        raycaster.setFromCamera(mouse, camera);
        
        // Create an array of all selectable collision boxes
        const selectableObjects = menuManager.collisionBoxes.map(box => box.collisionBox);
        
        // Check intersections with all selectable objects
        const intersects = raycaster.intersectObjects(selectableObjects, true);
        
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object;
            
            // Find the topmost parent that is a collision box
            let selectedBox = selectedObject;
            while (selectedBox && !menuManager.collisionBoxes.some(box => box.collisionBox === selectedBox)) {
                selectedBox = selectedBox.parent;
            }
            
            if (selectedBox) {
                transformControls.attach(selectedBox);
                
                // Add the transform gizmo to the scene
                const gizmo = transformControls.getHelper();
                gizmo.name = "transformGizmo";
                scene.add(gizmo);

                // Show transform buttons
                showTransformButtons();
            }
        } else {
            // If clicking elsewhere, detach TransformControls
            transformControls.detach();
            const gizmo = scene.getObjectByName("transformGizmo");
            if (gizmo) {
                scene.remove(gizmo);
            }

            // Hide transform buttons
            hideTransformButtons();
        }
    }

    // On pointerdown, check if the user clicked on any interactive object
    renderer.domElement.addEventListener('pointerdown', (event) => {
        handleObjectSelection(event);
    });

    // Disable OrbitControls while dragging TransformControls
    transformControls.addEventListener('dragging-changed', (event) => {
        if (orbitControls) orbitControls.enabled = !event.value;
    });

    // Listen to transform changes
    transformControls.addEventListener('change', () => {
        renderer.render(scene, camera);
    });

    // Save state after transform is complete
    transformControls.addEventListener('mouseUp', () => {
        history.push();
    });

    // Give the MenuManager access to the transform controls and history
    menuManager.setCollisionTransformControls(transformControls);
    menuManager.setCollisionHistory(history);

    // Add collision detection to OrbitControls
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

    return { transformControls };
} 