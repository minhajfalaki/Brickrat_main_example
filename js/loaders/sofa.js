import { createFurniture } from './furnitureLoader.js';

export function createSofa(x, y, z) {
  return createFurniture('models/furniture/sofa.glb', x, y, z, 1);
} 