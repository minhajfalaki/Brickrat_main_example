// modelInteraction.js
import * as THREE from './lib/three/three.module.js';
import { TransformControls } from './lib/three/controls/TransformControls.js';
import { createPointLight } from './js/loaders/pointLight.js';
import { createCollisionBox } from './js/loaders/collisionBox.js';

export function setupModelInteraction(scene, camera, renderer, orbitControls, menuManager) {
  // Array to store all lights and their helpers
  const lights = [];
  
  // History management
  const history = {
    past: [],
    present: [],
    future: [],
    maxHistoryPoints: 20,
    
    // Save current state
    saveState() {
      // Save lights state
      const lightsState = menuManager.lights.map(light => ({
        type: 'light',
        position: light.light.position.clone(),
        rotation: light.light.rotation.clone(),
        scale: light.light.scale.clone(),
        light: light.light,
        helper: light.helper
      }));
      
      // Save furniture state
      const furnitureState = menuManager.furniture.map(furniture => ({
        type: 'furniture',
        position: furniture.helper.position.clone(),
        rotation: furniture.helper.rotation.clone(),
        scale: furniture.helper.scale.clone(),
        helper: furniture.helper
      }));

      // Save collision boxes state
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
      
      return [...lightsState, ...furnitureState, ...collisionState];
    },
    
    // Push current state to history
    push() {
      // Add current state to past
      this.past.push(this.present);
      
      // Limit past array to maxHistoryPoints - 1 (leaving room for present)
      if (this.past.length > this.maxHistoryPoints - 1) {
        this.past.shift(); // Remove oldest state
      }
      
      // Update present state
      this.present = this.saveState();
      
      // Clear future states
      this.future = [];
    },
    
    // Undo last action
    undo() {
      if (this.past.length === 0) return;
      
      // Add current state to future
      this.future.push(this.present);
      
      // Get last past state
      this.present = this.past.pop();
      
      // Apply the state
      this.applyState(this.present);
    },
    
    // Redo last undone action
    redo() {
      if (this.future.length === 0) return;
      
      // Add current state to past
      this.past.push(this.present);
      
      // Get next future state
      this.present = this.future.pop();
      
      // Apply the state
      this.applyState(this.present);
    },
    
    // Apply a state to the scene
    applyState(state) {
      // Clear current scene
      menuManager.lights.forEach(light => {
        scene.remove(light.light);
        scene.remove(light.helper);
      });
      menuManager.furniture.forEach(furniture => {
        scene.remove(furniture.helper);
      });
      menuManager.collisionBoxes.forEach(box => {
        scene.remove(box.collisionBox);
      });
      
      // Clear arrays
      menuManager.lights = [];
      menuManager.furniture = [];
      menuManager.collisionBoxes = [];
      
      // Apply new state
      state.forEach(item => {
        if (item.type === 'light') {
          item.light.position.copy(item.position);
          item.light.rotation.copy(item.rotation);
          item.light.scale.copy(item.scale);
          scene.add(item.light);
          scene.add(item.helper);
          menuManager.lights.push({ light: item.light, helper: item.helper });
        } else if (item.type === 'furniture') {
          item.helper.position.copy(item.position);
          item.helper.rotation.copy(item.rotation);
          item.helper.scale.copy(item.scale);
          scene.add(item.helper);
          menuManager.furniture.push({ helper: item.helper });
        } else if (item.type === 'collision') {
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
        // Find and remove the object from the scene
        if (selectedObject.isLight) {
          const lightIndex = menuManager.lights.findIndex(l => l.light === selectedObject);
          if (lightIndex !== -1) {
            scene.remove(menuManager.lights[lightIndex].light);
            scene.remove(menuManager.lights[lightIndex].helper);
            menuManager.lights.splice(lightIndex, 1);
          }
        } else if (selectedObject.userData.isSelectable) {
          // Check for collision box
          const collisionIndex = menuManager.collisionBoxes.findIndex(box => 
            box.collisionBox === selectedObject
          );
          if (collisionIndex !== -1) {
            scene.remove(menuManager.collisionBoxes[collisionIndex].collisionBox);
            menuManager.collisionBoxes.splice(collisionIndex, 1);
          } else {
            // Check for furniture
            const furnitureIndex = menuManager.furniture.findIndex(f => f.helper === selectedObject);
            if (furnitureIndex !== -1) {
              scene.remove(menuManager.furniture[furnitureIndex].helper);
              menuManager.furniture.splice(furnitureIndex, 1);
            }
          }
        }
        
        // Detach transform controls and hide buttons
        transformControls.detach();
        hideTransformButtons();
        
        // Save state after deletion
        history.push();
      }
    }
  }

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown);

  // Function to find the best position for a new light
  function calculateLightPosition() {
    // Get camera's direction vector
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Calculate desired position (20 units in front of camera)
    const cameraPosition = camera.position.clone();
    const desiredPosition = cameraPosition.clone().add(direction.multiplyScalar(20));
    
    // Set up raycaster to check for objects between camera and desired position
    const raycaster = new THREE.Raycaster();
    raycaster.set(cameraPosition, direction);
    
    // Get all objects in the scene that could block the light
    const objects = [];
    scene.traverse((object) => {
      if (object.isMesh && object !== helper) {
        objects.push(object);
      }
    });
    
    // Check for intersections
    const intersects = raycaster.intersectObjects(objects);
    
    if (intersects.length > 0) {
      // If there's an object closer than 20 units, place light just before it
      const firstIntersection = intersects[0];
      if (firstIntersection.distance < 20) {
        // Place light 1 unit before the intersection point
        return cameraPosition.clone().add(
          direction.normalize().multiplyScalar(firstIntersection.distance - 1)
        );
      }
    }
    
    // If no obstacles, use the desired position
    return desiredPosition;
  }
  
  // 1. Create the initial red point light and helper from lightcreator.js
  const initialLightPos = calculateLightPosition();
  const { light, helper } = createPointLight(
    initialLightPos.x,
    initialLightPos.y,
    initialLightPos.z
  );
  scene.add(light);
  scene.add(helper);
  lights.push({ light, helper });

  // Save initial state after creating the first light
  history.push();

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
      // Update button styles
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

  // Give the MenuManager access to the transform controls and history
  menuManager.setTransformControls(transformControls);
  menuManager.setHistory(history);

  // Raycaster and mouse vector for selection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function updateMouse(event) {
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  }

  // Function to handle object selection
  function handleObjectSelection(event) {
    // Skip selection if in preview mode
    if (menuManager.isPreviewMode) {
      return;
    }

    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Create an array of all selectable objects (lights, furniture, and collision boxes)
    const selectableObjects = [];
    
    // Add all light helpers
    menuManager.lights.forEach(lightSetup => {
      selectableObjects.push(lightSetup.helper);
    });
    
    // Add all furniture helpers
    menuManager.furniture.forEach(furnitureSetup => {
      selectableObjects.push(furnitureSetup.helper);
    });

    // Add all collision boxes
    menuManager.collisionBoxes.forEach(box => {
      selectableObjects.push(box.collisionBox);
    });
    
    // Check intersections with all selectable objects
    const intersects = raycaster.intersectObjects(selectableObjects, true);
    
    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      
      // Find the topmost parent that is either a light helper, furniture helper, or collision box
      let selectedHelper = selectedObject;
      while (selectedHelper && 
             !menuManager.lights.some(l => l.helper === selectedHelper) && 
             !menuManager.furniture.some(f => f.helper === selectedHelper) &&
             !menuManager.collisionBoxes.some(box => box.collisionBox === selectedHelper)) {
        selectedHelper = selectedHelper.parent;
      }
      
      if (selectedHelper) {
        // If it's a light helper
        const selectedLight = menuManager.lights.find(l => l.helper === selectedHelper);
        if (selectedLight) {
          transformControls.attach(selectedLight.light);
        }
        // If it's a furniture helper
        const selectedFurniture = menuManager.furniture.find(f => f.helper === selectedHelper);
        if (selectedFurniture) {
          transformControls.attach(selectedFurniture.helper);
        }
        // If it's a collision box
        const selectedCollision = menuManager.collisionBoxes.find(box => box.collisionBox === selectedHelper);
        if (selectedCollision) {
          transformControls.attach(selectedCollision.collisionBox);
        }
        
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

  // Add event listener for the "Add Light" button
  const addLightBtn = document.getElementById('addLightBtn');
  if (addLightBtn) {
    addLightBtn.addEventListener('click', () => {
      const newPosition = calculateLightPosition();
      const { light: newLight, helper: newHelper } = createPointLight(
        newPosition.x,
        newPosition.y,
        newPosition.z
      );
      scene.add(newLight);
      scene.add(newHelper);
      lights.push({ light: newLight, helper: newHelper });
      
      // Save state after adding new light
      history.push();
    });
  }

  return { lights, transformControls };
}
