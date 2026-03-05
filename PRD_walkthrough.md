# PRD — Interactive Building Walkthrough

**Project:** BrickRat Linkdev – First-Person Walkthrough
**Date:** 2026-03-03
**Status:** Planning

---

## 1. Overview

Convert the existing Three.js GLB viewer into a self-contained, first-person walkthrough of a building. A visitor opens a link, the building loads, and they can walk through it using WASD + mouse — exactly like exploring a building from the perspective of a person standing on the floor.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Remove all editor tooling (lights, furniture, transform controls, collision boxes, menu manager) |
| G2 | Replace OrbitControls with a first-person (FPS-style) controller |
| G3 | Camera is always locked at eye height above the nearest floor surface |
| G4 | Player can step up/down surfaces ≤ 0.25 m (stairs, kerbs) |
| G5 | Camera always starts at a sensible inside-the-model ground position regardless of model origin |
| G6 | Host model and code so anyone can open a single URL |

---

## 3. Out of Scope

- Player body / avatar rendering
- Jumping
- Multiplayer
- Mobile touch controls (future)
- Editing, lighting, or furniture placement
- VR / AR

---

## 4. Functional Requirements

### 4.1 Navigation Controls

| Action | Input |
|--------|-------|
| Walk forward | W or ↑ |
| Walk backward | S or ↓ |
| Strafe left | A or ← |
| Strafe right | D or → |
| Look (pan/tilt) | Mouse move (pointer lock) |

- Movement direction is always horizontal (XZ plane) — no flying.
- Mouse look uses Pointer Lock API so the cursor disappears and raw delta is used.
- Clicking on the canvas captures the pointer; pressing Escape releases it.

### 4.2 Eye Height & Ground Following

- Default eye height: **1.65 m** (configurable constant `EYE_HEIGHT`).
- Every frame, cast a ray straight down from the player position.
- The ray tests against all mesh geometry in the loaded GLTF scene.
- The camera Y is set to: `groundHitY + EYE_HEIGHT`.
- If no ground is found directly below (open air, outside the building), maintain the last known valid Y.

### 4.3 Step / Ramp Handling

- Before moving horizontally, cast a short forward probe ray to detect geometry.
- If a surface is hit within horizontal movement distance:
  - Measure the surface Y relative to current foot Y.
  - If surface is **≤ +0.25 m higher** → allow movement, snap camera up.
  - If surface is **> +0.25 m higher** → block movement (wall/step too tall).
  - If surface is **any amount lower** → allow movement, camera follows down (descent is not limited; the ground ray handles it naturally).

### 4.4 Smart Start Position

On model load:

1. Compute the axis-aligned bounding box (AABB) of the entire scene.
2. Cast a downward ray from the AABB center (XZ), starting just above the AABB top.
3. Walk down until a mesh surface is hit → that is the floor Y.
4. If no hit from center, try a grid of sample points (3×3 within the AABB XZ footprint) until a floor hit is found.
5. Place the camera at the first valid hit: `(hitX, hitY + EYE_HEIGHT, hitZ)`.
6. Initial look direction: horizontal, facing the longest AABB axis inward.

### 4.5 Loading Screen

- Retain existing animated progress ring + logo overlay from `index.html`.
- Show a "Click to explore" overlay after load completes.
- Clicking starts pointer lock and begins the walkthrough.

### 4.6 GLB Model Hosting

See Section 7 for hosting options and file structure.

---

## 5. Non-Functional Requirements

| # | Requirement |
|---|-------------|
| NF1 | Works in any modern browser (Chrome, Firefox, Edge, Safari) with no install |
| NF2 | Single URL — no backend, purely static files |
| NF3 | Model load time < 20 s on 20 Mbps connection (depends on model size) |
| NF4 | Frame rate target: 60 fps on mid-range GPU |
| NF5 | No build step required for viewers — just a static HTML+JS page |

---

## 6. Implementation Plan

### Phase 1 — Cleanup (Day 1)

**Files to delete / gut:**
- `modelInteraction.js` → delete entirely
- `js/interaction/cameraCollision.js` → delete
- `js/interaction/collisionInteraction.js` → delete
- `js/menus/menuManager.js` → delete
- `js/loaders/pointLight.js` → delete (or keep only if ambient lights are needed)
- `js/loaders/collisionBox.js` → delete
- `styles/menu.css` → delete

**Changes to `main.js`:**
- Remove `OrbitControls` import and instantiation
- Remove `MenuManager` import and instantiation
- Remove `setupModelInteraction` and `setupCameraCollision` calls
- Remove old WASD handler (the one that moves camera+orbitTarget together)
- Remove pointer-down/up click-to-set-orbit-target logic
- Remove `menuManager.helpersNeedingUpdate` loop in animate

### Phase 2 — First-Person Controller (Day 1-2)

Create `js/controls/FirstPersonControls.js`:

```
class FirstPersonController {
  constructor(camera, domElement, scene)

  // State
  keyState: {}
  yaw: number        // horizontal look angle
  pitch: number      // vertical look angle (clamped ±85°)
  eyeHeight: 1.65
  maxStepHeight: 0.25
  moveSpeed: 3.0     // m/s (scaled by delta time)
  lastGroundY: number

  // Methods
  lock()             // request pointer lock
  unlock()           // exit pointer lock
  onMouseMove(e)     // update yaw/pitch from e.movementX/Y
  getFloorY(x, z)    // downward raycast → returns Y or null
  update(dt)         // called each frame
    - compute move direction from keyState
    - probe for forward collision / step
    - apply horizontal movement
    - update camera Y via getFloorY
    - apply camera rotation from yaw/pitch
}
```

### Phase 3 — Smart Start Position (Day 2)

Create `js/utils/findStartPosition.js`:

```
function findStartPosition(scene, eyeHeight)
  → returns THREE.Vector3 (camera world position)
```

Algorithm:
1. `Box3.setFromObject(scene)` → get AABB
2. Cast ray downward from 9 sample points in XZ grid
3. Return first valid hit + eyeHeight
4. Fallback: center of AABB + half height

### Phase 4 — Model Loading Integration (Day 2)

Update `main.js` loader callback:
```js
loader.load(modelPath, (gltf) => {
  scene.add(gltf.scene);
  const startPos = findStartPosition(gltf.scene, EYE_HEIGHT);
  camera.position.copy(startPos);
  fpController.lastGroundY = startPos.y - EYE_HEIGHT;
  // face longest axis
});
```

### Phase 5 — Hosting (Day 3)

See Section 7.

---

## 7. Hosting Strategy

### Option A — GitHub Pages (Recommended for code + small models)

- Push the project to a GitHub repo.
- Enable GitHub Pages on the `main` branch (`/root` or `/docs`).
- Model file: commit the GLB to the repo **only if < 50 MB** (GitHub file limit).
  - For files 50–100 MB: use **Git LFS** (`git lfs track "*.glb"`).
  - For files > 100 MB: use Option B for the model, GitHub Pages for the code.

### Option B — GitHub Pages (code) + Cloud Storage (model)

If the GLB is large (> 100 MB):

| Step | Action |
|------|--------|
| B1 | Upload GLB to a CORS-enabled host |
| B2 | Options: Cloudflare R2 (free), Google Drive (public), AWS S3 public bucket, Dropbox direct link |
| B3 | Set `MODEL_URL` constant in `main.js` to the direct download URL |
| B4 | Ensure the host serves `Access-Control-Allow-Origin: *` |

### Option C — Netlify Drop (code + model, no Git needed)

- Drag the entire project folder to [netlify.com/drop](https://app.netlify.com/drop)
- Instant deploy, free, HTTPS, custom domain possible
- Works for any model size up to 100 MB per deploy

**Recommended path for this project:**
1. GitHub repo for version control and code review
2. GitHub Pages for the viewer URL
3. If model > 50 MB → Cloudflare R2 or Netlify for the model binary

---

## 8. File Structure After Refactor

```
linkdev/
├── index.html               ← loading overlay, "Click to explore" prompt
├── main.js                  ← scene setup, model load, animation loop
├── js/
│   ├── controls/
│   │   └── FirstPersonControls.js   ← NEW — FPS controller
│   └── utils/
│       └── findStartPosition.js     ← NEW — smart spawn
├── lib/
│   └── three/               ← existing Three.js modules (unchanged)
├── assets/
│   └── model.glb            ← your GLB (or served from cloud)
├── images/
│   └── logo_round.png       ← existing logo
└── styles/
    └── (minimal or none)    ← menu.css removed
```

---

## 9. Key Constants (Configurable in main.js)

```js
const EYE_HEIGHT     = 1.65;  // metres above ground surface
const MAX_STEP       = 0.25;  // max step-up height in metres
const MOVE_SPEED     = 3.0;   // horizontal speed m/s
const LOOK_SENSITIVITY = 0.002; // mouse sensitivity (rad/pixel)
const MIN_PITCH      = -Math.PI * 0.45;  // look down limit
const MAX_PITCH      =  Math.PI * 0.45;  // look up limit
```

---

## 10. Open Questions / Decisions Needed

| # | Question | Default assumption |
|---|----------|-------------------|
| Q1 | What is the approximate file size of your GLB? | Unknown → affects hosting choice |
| Q2 | Do you want a crosshair or any HUD in the center? | No HUD for now |
| Q3 | Should the camera bob slightly while walking (realism)? | No — flat movement |
| Q4 | Do you want a skybox/background color or keep white? | Keep white for now |
| Q5 | Should ambient/directional lights be kept in the scene? | Yes — keep existing lights |
| Q6 | Do you want a minimap? | No |
| Q7 | Should walls block movement (wall collision)? | Yes — horizontal raycast blocker |
| Q8 | Do you have a specific GitHub org/repo name in mind? | Up to you |

---

## 11. Risks

| Risk | Mitigation |
|------|-----------|
| Model origin far from 0,0,0 | Smart start algorithm handles this |
| Complex geometry causes raycasts to miss the floor | Grid-sample fallback + tolerance margin |
| CORS blocks model from external host | Verify host headers before launch |
| Large model (>100MB) slow to load | Compress with `gltf-transform optimize`; add streaming progress bar (already exists) |
| Pointer Lock not supported on iOS Safari | Show fallback message; future: touch joystick |
