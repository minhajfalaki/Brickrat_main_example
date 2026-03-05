import { createFurniture } from './furnitureLoader.js';

export function createDiningChair(x, y, z) {
  return createFurniture('models/furniture/dining-chair.glb', x, y, z, 1);
} 