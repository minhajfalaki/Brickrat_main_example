import * as THREE from '../../lib/three/three.module.js';

/**
 * findStartPosition
 *
 * Shoots a grid of downward raycasts across the model's XZ footprint and
 * returns a camera position (eye level) on the lowest WALKABLE floor —
 * i.e. the ground floor, not the foundation slab buried below it.
 *
 * Key rules for a surface to be considered "walkable":
 *   1. Its world-space face normal points upward  (normalY >= 0.7)
 *   2. Its Y is above the "sub-floor threshold"   (bottom 5 % of model height
 *      or 0.5 m above the absolute min, whichever is larger) — this discards
 *      floor slabs, foundation faces, and below-grade geometry.
 *
 * Among all walkable hits the algorithm picks the sample that is:
 *   • closest to the horizontal centre of the bounding box  (primary)
 *   • at the lowest Y (ground floor over mezzanine)          (secondary)
 */
export function findStartPosition(gltfScene, eyeHeight = 1.65, gridSize = 5) {

  // ── 1. Bounding box ──────────────────────────────────────────────────────
  const box    = new THREE.Box3().setFromObject(gltfScene);
  const center = box.getCenter(new THREE.Vector3());
  const size   = box.getSize(new THREE.Vector3());

  if (size.lengthSq() === 0) {
    console.warn('[findStartPosition] Empty bounding box — using origin.');
    return new THREE.Vector3(0, eyeHeight, 0);
  }

  // ── 2. Collect meshes ────────────────────────────────────────────────────
  const meshes = [];
  gltfScene.traverse(obj => { if (obj.isMesh) meshes.push(obj); });

  if (meshes.length === 0) {
    console.warn('[findStartPosition] No meshes found — using AABB centre.');
    return new THREE.Vector3(center.x, center.y, center.z);
  }

  // ── 3. Sub-floor threshold ───────────────────────────────────────────────
  // Ignore surfaces that are very close to the absolute bottom of the model.
  // These are typically foundation faces, sub-slab geometry, or inverted
  // floor faces — NOT the surface a person would stand on.
  const subFloorThreshold = box.min.y + Math.max(0.5, size.y * 0.05);
  console.info(
    `[findStartPosition] AABB min.y=${box.min.y.toFixed(3)} ` +
    `size.y=${size.y.toFixed(3)}  ` +
    `sub-floor threshold=${subFloorThreshold.toFixed(3)}`
  );

  // ── 4. Grid raycast ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  raycaster.ray.direction.set(0, -1, 0);
  raycaster.far = size.y + 10; // long enough to pierce the whole model

  const inset  = 0.15;
  const startX = box.min.x + size.x * inset;
  const startZ = box.min.z + size.z * inset;
  const spanX  = size.x * (1 - 2 * inset);
  const spanZ  = size.z * (1 - 2 * inset);
  const stepX  = gridSize > 1 ? spanX / (gridSize - 1) : 0;
  const stepZ  = gridSize > 1 ? spanZ / (gridSize - 1) : 0;

  const rayOriginY = box.max.y + 2; // start above the entire model

  const _worldNormal = new THREE.Vector3(); // reused per hit

  let bestPos   = null;
  let bestScore = Infinity;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + i * stepX;
      const z = startZ + j * stepZ;

      raycaster.ray.origin.set(x, rayOriginY, z);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) continue;

      // ── Find the lowest WALKABLE surface at this XZ sample ──────────────
      let floorY = null;

      for (const h of hits) {
        // Check face normal in world space — must point upward
        _worldNormal.copy(h.face.normal)
          .transformDirection(h.object.matrixWorld);

        if (_worldNormal.y < 0.7) continue; // wall, ceiling, or sloped — skip

        const y = h.point.y;
        if (y < subFloorThreshold) continue; // foundation / sub-slab — skip

        // Accept: keep the lowest qualifying surface (ground floor, not roof)
        if (floorY === null || y < floorY) floorY = y;
      }

      // ── Fallback: if threshold filtered everything, accept any upward surface ─
      if (floorY === null) {
        for (const h of hits) {
          _worldNormal.copy(h.face.normal)
            .transformDirection(h.object.matrixWorld);
          if (_worldNormal.y < 0.7) continue;
          const y = h.point.y;
          if (y >= box.min.y && (floorY === null || y < floorY)) floorY = y;
        }
      }

      if (floorY === null) continue; // no walkable surface at this sample

      // ── Score: prefer centre XZ, prefer lower floors ─────────────────────
      const dx = x - center.x;
      const dz = z - center.z;
      const distSq      = dx * dx + dz * dz;
      const normDistSq  = distSq / Math.max(size.x * size.z, 1);
      const normHeight  = (floorY - subFloorThreshold) / Math.max(size.y, 1);
      const score       = normDistSq + normHeight * 0.5; // centre > low floor

      if (score < bestScore) {
        bestScore = score;
        bestPos   = new THREE.Vector3(x, floorY + eyeHeight, z);
      }
    }
  }

  // ── 5. Result ────────────────────────────────────────────────────────────
  if (bestPos) {
    console.info(
      `[findStartPosition] Spawn → ` +
      `x:${bestPos.x.toFixed(3)}  ` +
      `floor Y:${(bestPos.y - eyeHeight).toFixed(3)}  ` +
      `eye Y:${bestPos.y.toFixed(3)}`
    );
    return bestPos;
  }

  console.warn('[findStartPosition] No walkable floor found — falling back to AABB centre.');
  return new THREE.Vector3(center.x, center.y + eyeHeight, center.z);
}
