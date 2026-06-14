# Brickrat Main Example

Static Three.js walkthrough app for exploring a hosted GLB model in the browser.

## Restore local setup

```bash
git clone https://github.com/minhajfalaki/Brickrat_main_example.git
cd Brickrat_main_example
npm install
npm run dev
```

Open `http://localhost:5173`.

## Project structure

- `index.html`: app shell, overlays, and PWA hooks
- `main.js`: scene setup, model loading, and runtime flow
- `js/controls/`: first-person desktop and mobile controls
- `lib/`: vendored Three.js runtime files
- `assets/`, `images/`, `models/`: project assets

## Change the walkthrough model

Update `MODEL_URL` in `main.js` to point to your hosted `.glb` or `.gltf`.

## Push changes

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

If Git reports "dubious ownership" on this machine, run:

```bash
git config --global --add safe.directory E:/BrickRat/Brickrat_App/Brickrat_main_example
```
