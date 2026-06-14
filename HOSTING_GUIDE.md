# Hosting Guide - Building Walkthrough

## Overview

| What | Where |
|------|-------|
| Code (HTML, JS, lib, styles) | GitHub repo + GitHub Pages |
| GLB model (large file) | Any public URL - GitHub Releases, Cloudflare R2, etc. |

The only thing that connects them is one line in `main.js`.

---

## Swapping the model

Open [main.js](main.js) and update `MODEL_URL`:

```js
const MODEL_URL = 'https://your-host.example.com/your-model.glb';
```

That is the only code change required.

---

## Where to host the GLB

### Option A - GitHub Releases

1. Go to your GitHub repo -> **Releases** -> **Create a new release**
2. Tag it, for example `v1.0`
3. Attach the `.glb` file under **Attach binaries**
4. Publish the release
5. Open the uploaded file and copy its URL
6. Paste that URL into `MODEL_URL` in `main.js`

Example:

```txt
https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0/model.glb
```

### Option B - Cloudflare R2

1. Create an R2 bucket
2. Upload your `.glb`
3. Make it public or map it to a public custom domain
4. Paste the public file URL into `MODEL_URL`

### Option C - Local development only

Put your `.glb` at `assets/model.glb` and set:

```js
const MODEL_URL = 'assets/model.glb';
```

Use this only for local development.

---

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Deploying code to GitHub Pages

```bash
git add index.html main.js js/ lib/ images/ styles/ assets/icons/ assets/thumbnails/ .nojekyll manifest.json sw.js README.md HOSTING_GUIDE.md
git commit -m "Update walkthrough"
git push origin main
```

Then enable Pages:

1. Repo -> **Settings** -> **Pages**
2. Source -> **Deploy from a branch**
3. Branch -> `main`, folder -> `/ (root)`

Your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

---

## Updating the model later

1. Upload the new GLB to your hosting target
2. Copy the new asset URL
3. Update `MODEL_URL` in `main.js`
4. Commit and push
