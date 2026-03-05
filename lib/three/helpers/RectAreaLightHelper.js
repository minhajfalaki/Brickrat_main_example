import { Mesh } from '../three.module.js';
import { PlaneGeometry } from '../three.module.js';
import { MeshBasicMaterial } from '../three.module.js';
import { Color } from '../three.module.js';
import { Vector3 } from '../three.module.js';
import { Matrix4 } from '../three.module.js';
import { Group } from '../three.module.js';

class RectAreaLightHelper extends Group {
  constructor(light, width, height, color) {
    super();

    // Create the main light visualization
    const geometry = new PlaneGeometry(width, height);
    const material = new MeshBasicMaterial({
      color: color || light.color,
      side: 2
    });
    const lightMesh = new Mesh(geometry, material);
    this.add(lightMesh);

    // Create a larger, invisible mesh for selection
    const selectionGeometry = new PlaneGeometry(width * 1.2, height * 1.2);
    const selectionMaterial = new MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.2,
      side: 2
    });
    const selectionMesh = new Mesh(selectionGeometry, selectionMaterial);
    selectionMesh.name = 'lightHelper'; // This name will be used for selection
    this.add(selectionMesh);

    this.light = light;
    this.width = width;
    this.height = height;
    this.lightMesh = lightMesh;
    this.selectionMesh = selectionMesh;

    this.update();
  }

  update() {
    this.lightMesh.scale.set(0.5 * this.width, 0.5 * this.height, 1);
    this.selectionMesh.scale.set(0.5 * this.width * 1.2, 0.5 * this.height * 1.2, 1);

    if (this.color !== undefined) {
      this.lightMesh.material.color.set(this.color);
    } else {
      this.lightMesh.material.color.copy(this.light.color).multiplyScalar(this.light.intensity);
    }

    // Ignore field of view, aspect ratio and screen size
    const matrix = new Matrix4();
    matrix.copy(this.light.matrixWorld);
    this.matrix.copy(matrix);
    this.matrixWorld.copy(this.matrix);

    this.lightMesh.material.side = this.light.type === 'RectAreaLight' ? 2 : 1;
    this.selectionMesh.material.side = this.light.type === 'RectAreaLight' ? 2 : 1;
  }

  dispose() {
    this.lightMesh.geometry.dispose();
    this.lightMesh.material.dispose();
    this.selectionMesh.geometry.dispose();
    this.selectionMesh.material.dispose();
  }
}

export { RectAreaLightHelper }; 