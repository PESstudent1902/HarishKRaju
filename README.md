# Harish K Raju — Interactive 3D Portfolio

A premium, dark-themed, 3D interactive portfolio website integrating the three professional verticals of Sri Harish K Raju:
1. **Sound Healing & Reiki** (Advanced Meditation, Reiki, Past Life Regression)
2. **MIDNA Genetic Brain Profile Consultant** (Neuro Psychology, Dermatoglyphics, NLP)
3. **Chinmaya Balavihar Sevak & Sanskrit Teacher** ( weekend classes, Bhagavad Gita chanting, Seva since 2001)

## Tech Stack & Architecture
* **Frontend:** Semantic HTML5, Vanilla CSS3, and JavaScript (ES6+).
* **Animations:** GSAP (GreenSock Animation Platform) + ScrollTrigger for high-performance scroll-scrubbed video timeline control.
* **3D Interactive Graphics:** Three.js (WebGL) for real-time procedural animations:
  * Hero section interactive floating particle constellation reacting to mouse movement.
  * Sticky verticals section morphing between a **3D translucent glassmorphic Lotus**, a **3D Neural Brain Network**, and **floating golden Sanskrit characters** as the user scrolls.
* **Hosting Friendly:** Zero-config static design, fully optimized for both desktop and mobile layouts.

## Getting Started Locally

### On Windows
Simply double-click **`start_server.bat`** (which launches the included PowerShell-based lightweight HTTP server `server.ps1`). It will:
1. Find a free port (e.g. `8080`).
2. Start serving the directory.
3. Automatically launch your default browser to `http://127.0.0.1:8080`.

### Other Platforms
Use any standard HTTP utility in the project root:
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

## Deploying to Vercel (Zero-Config)

This repository is optimized for instant static hosting on **Vercel**:
1. Go to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project** and import this GitHub repository.
3. Leave the **Build and Development Settings** at their default values (no build command or install command required).
4. Click **Deploy**. Vercel will serve `index.html` statically and distribute it via their Global Edge Network.
