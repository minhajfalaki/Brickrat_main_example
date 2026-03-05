import { createFurniture } from './furnitureLoader.js';

export function createDiningTable(x, y, z) {
  return createFurniture('models/furniture/dining-table.glb', x, y, z, 1);
} 