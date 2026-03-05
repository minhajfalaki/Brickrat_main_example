# Hosting Guide — Building Walkthrough

## What goes where

| What | Where | Why |
|------|-------|-----|
| Code (HTML, JS, images) | GitHub repo + GitHub Pages | Free, version-controlled, HTTPS |
| GLB model (~200 MB) | GitHub Release asset | Free, up to 2 GB, fast CDN, works with CORS |

---

## Step 1 — Create the GitHub repo

1. Go to github.com → **New repository**
2. Name it (e.g. `building-walkthrough`)
3. Keep it **Public** (required for free GitHub Pages)
4. **Don't** add README / .gitignore yet

---

## Step 2 — Push the code

Open a terminal in your `linkdev/` folder:

```bash
git init
git add index.html main.js js/ lib/ images/ styles/ assets/
# Do NOT add the 200 MB GLB here — it goes in a Release (Step 3)
git commit -m "Initial walkthrough"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> Replace `YOUR_USERNAME` and `YOUR_REPO` with your real values.

---

## Step 3 — Upload the GLB as a GitHub Release asset

1. On GitHub, open your repo → **Releases** → **Create a new release**
2. Tag: `v1.0`
3. Title: `Model v1.0`
4. Scroll to **Attach binaries** → drag and drop your `model.glb`
5. Click **Publish release**
6. After upload, click the `.glb` file link → copy the URL.
   It will look like:
   ```
   https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0/model.glb
   ```

---

## Step 4 — Update MODEL_URL in main.js

Open `main.js` and change line 13:

```js
// Before (local dev):
const MODEL_URL = 'assets/model.glb';

// After (production):
const MODEL_URL = 'https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0/model.glb';
```

Commit and push:
```bash
git add main.js
git commit -m "Point to hosted model"
git push
```

---

## Step 5 — Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Click **Save**
5. Wait ~1 minute → your site is live at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/
   ```

---

## Local development

```bash
# Install dependencies once
npm install

# Start local dev server (Vite)
npx vite

# Open http://localhost:5173
```

For local dev, keep `MODEL_URL = 'assets/model.glb'` and put your GLB at `assets/model.glb`.

---

## CORS note

GitHub Release assets are served from `objects.githubusercontent.com` which
includes `Access-Control-Allow-Origin: *` headers, so Three.js's GLTFLoader
will load them without any CORS errors — even from a different domain.

---

## Updating the model later

1. Create a new Release (`v1.1`, etc.)
2. Upload the new GLB
3. Update `MODEL_URL` in `main.js` to the new URL
4. Push
