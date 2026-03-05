import { createFurniture } from './furnitureLoader.js';

export function createChair(x, y, z) {
  return createFurniture('models/chair.fbx', x, y, z, 0.01); // Using 0.01 scale for FBX models
} 