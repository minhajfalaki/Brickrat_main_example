import { Mesh } from '../../three.module.js';
import { CylinderGeometry } from '../../three.module.js';
import { MeshBasicMaterial } from '../../three.module.js';
import { Color } from '../../three.module.js';
import { Vector3 } from '../../three.module.js';
import { Matrix4 } from '../../three.module.js';
import { Group } from '../../three.module.js';

class SpotLightHelper extends Group {
  constructor(light, color, distance = 1, angle = 0.5, penumbra = 0.1) {
    super();

    // Create the main light visualization
    const geometry = new CylinderGeometry(0, 1, 1, 32);
    const material = new MeshBasicMaterial({
      fog: false,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
      color: color
    });
    const lightMesh = new Mesh(geometry, material);
    this.add(lightMesh);

    // Create a larger, invisible mesh for selection
    const selectionGeometry = new CylinderGeometry(0, 1.2, 1.2, 32);
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
    this.color = color;
    this.distance = distance;
    this.angle = angle;
    this.penumbra = penumbra;
    this.lightMesh = lightMesh;
    this.selectionMesh = selectionMesh;

    this.update();
  }

  update() {
    const coneLength = this.distance;
    const coneWidth = coneLength * Math.tan(this.angle);

    this.lightMesh.scale.set(coneWidth, coneWidth, coneLength);
    this.selectionMesh.scale.set(coneWidth * 1.2, coneWidth * 1.2, coneLength * 1.2);

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
  }

  dispose() {
    this.lightMesh.geometry.dispose();
    this.lightMesh.material.dispose();
    this.selectionMesh.geometry.dispose();
    this.selectionMesh.material.dispose();
  }
}

export { SpotLightHelper }; 