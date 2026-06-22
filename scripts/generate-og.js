/**
 * Génère public/og-preview.png (1200×630) — image de partage social brandée SportLink.
 * Usage : node scripts/generate-og.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/og-preview.png');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px; height: 630px; overflow: hidden;
      background: #0a1628;
      font-family: 'Inter', sans-serif;
    }
    .root {
      width: 1200px; height: 630px;
      position: relative;
      display: flex; flex-direction: column;
      justify-content: center;
      padding: 0 100px;
      background: linear-gradient(135deg, #0a1628 0%, #0f1e38 50%, #0a1628 100%);
    }

    /* Motif terrain de fond */
    .bg-pattern {
      position: absolute; inset: 0;
      background-image: repeating-linear-gradient(
        135deg,
        rgba(34,217,106,0.04) 0px,
        rgba(34,217,106,0.04) 1px,
        transparent 1px,
        transparent 32px
      );
    }

    /* Halo vert-bleu en bas à droite */
    .bg-halo {
      position: absolute;
      bottom: -120px; right: -80px;
      width: 500px; height: 500px;
      background: radial-gradient(ellipse, rgba(34,217,106,0.18) 0%, rgba(61,165,255,0.08) 50%, transparent 75%);
      border-radius: 50%;
    }

    /* Halo bleu en haut à gauche */
    .bg-halo2 {
      position: absolute;
      top: -100px; left: 300px;
      width: 400px; height: 400px;
      background: radial-gradient(ellipse, rgba(61,165,255,0.10) 0%, transparent 70%);
      border-radius: 50%;
    }

    /* Barre verte verticale sur la gauche */
    .accent-bar {
      position: absolute;
      left: 0; top: 80px; bottom: 80px;
      width: 6px;
      border-radius: 0 4px 4px 0;
      background: linear-gradient(180deg, #22d96a 0%, #3da5ff 100%);
    }

    .content {
      position: relative; z-index: 10;
    }

    /* Logo */
    .logo-row {
      display: flex; align-items: center; gap: 18px;
      margin-bottom: 44px;
    }
    .logo-icon {
      width: 64px; height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, #102a52, #07142A);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(34,217,106,0.3);
      flex-shrink: 0;
    }
    .logo-name {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 900;
      font-size: 42px;
      color: #deeeff;
      letter-spacing: -0.01em;
      line-height: 1;
    }
    .logo-tag {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #22d96a;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin-top: 4px;
    }

    /* Headline */
    .headline {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 900;
      font-size: 96px;
      color: #ffffff;
      letter-spacing: -1px;
      line-height: 0.95;
      margin-bottom: 28px;
    }
    .headline em {
      font-style: normal;
      color: #22d96a;
    }

    /* Sous-titre */
    .subtitle {
      font-size: 24px;
      font-weight: 500;
      color: rgba(222,238,255,0.6);
      letter-spacing: 0.01em;
      margin-bottom: 48px;
    }

    /* Pills de stats */
    .stats-row {
      display: flex; gap: 16px; align-items: center;
    }
    .stat-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px;
      border-radius: 999px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.10);
    }
    .stat-dot {
      width: 8px; height: 8px; border-radius: 50%;
    }
    .stat-text {
      font-size: 15px; font-weight: 600;
      color: rgba(222,238,255,0.75);
    }

    /* Right — illustration téléphone */
    .phone-side {
      position: absolute;
      right: 80px; top: 50%;
      transform: translateY(-50%);
      width: 260px;
      z-index: 5;
    }
    .phone-frame {
      width: 260px; height: 440px;
      background: linear-gradient(160deg, #152848, #0f1e38);
      border-radius: 40px;
      border: 3px solid rgba(255,255,255,0.12);
      box-shadow: 0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,217,106,0.15), 0 0 80px rgba(34,217,106,0.08);
      overflow: hidden;
      position: relative;
    }
    /* Header simulé */
    .phone-header {
      height: 52px;
      background: rgba(0,0,0,0.25);
      display: flex; align-items: center;
      padding: 0 16px;
      gap: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .phone-dot { width: 8px; height: 8px; border-radius: 50%; background: #22d96a; }
    .phone-bar {
      height: 6px; border-radius: 3px;
      background: rgba(255,255,255,0.12);
      flex: 1;
    }
    /* Event cards simulées */
    .phone-content { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .phone-card {
      border-radius: 12px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      display: flex; gap: 10px; align-items: center;
    }
    .phone-card-dot { width: 4px; border-radius: 2px; background: #22d96a; align-self: stretch; }
    .phone-card-dot.blue { background: #3da5ff; }
    .phone-card-dot.orange { background: #FF6B2B; }
    .phone-card-line { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.15); margin-bottom: 5px; }
    .phone-card-line2 { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.07); width: 60%; }
  </style>
</head>
<body>
<div class="root">
  <div class="bg-pattern"></div>
  <div class="bg-halo"></div>
  <div class="bg-halo2"></div>
  <div class="accent-bar"></div>

  <div class="content">
    <!-- Logo -->
    <div class="logo-row">
      <div class="logo-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="url(#pinGrad)"/>
          <circle cx="12" cy="9" r="2.8" fill="white" fill-opacity="0.9"/>
          <defs>
            <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#5BEEA8"/>
              <stop offset="55%" stop-color="#1FD37E"/>
              <stop offset="100%" stop-color="#2B8CE0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div>
        <div class="logo-name">SportLink</div>
        <div class="logo-tag">Le sport près de toi</div>
      </div>
    </div>

    <!-- Headline -->
    <div class="headline">Le sport<br /><em>près de toi</em></div>

    <!-- Sous-titre -->
    <div class="subtitle">Clubs · Matchs · Résultats · Convocations</div>

    <!-- Stats pills -->
    <div class="stats-row">
      <div class="stat-pill">
        <div class="stat-dot" style="background:#22d96a"></div>
        <span class="stat-text">Clubs sportifs locaux</span>
      </div>
      <div class="stat-pill">
        <div class="stat-dot" style="background:#3da5ff"></div>
        <span class="stat-text">Événements en temps réel</span>
      </div>
      <div class="stat-pill">
        <div class="stat-dot" style="background:#FF6B2B"></div>
        <span class="stat-text">100% gratuit</span>
      </div>
    </div>
  </div>

  <!-- Phone mockup à droite -->
  <div class="phone-side">
    <div class="phone-frame">
      <div class="phone-header">
        <div class="phone-dot"></div>
        <div class="phone-bar"></div>
        <div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.08)"></div>
      </div>
      <div class="phone-content">
        <div class="phone-card">
          <div class="phone-card-dot"></div>
          <div style="flex:1">
            <div class="phone-card-line" style="width:75%"></div>
            <div class="phone-card-line2"></div>
          </div>
          <div style="font-size:10px;color:#22d96a;font-weight:700;font-family:Inter,sans-serif">J'y serai</div>
        </div>
        <div class="phone-card">
          <div class="phone-card-dot blue"></div>
          <div style="flex:1">
            <div class="phone-card-line" style="width:90%"></div>
            <div class="phone-card-line2"></div>
          </div>
        </div>
        <div class="phone-card">
          <div class="phone-card-dot orange"></div>
          <div style="flex:1">
            <div class="phone-card-line" style="width:60%"></div>
            <div class="phone-card-line2"></div>
          </div>
        </div>
        <div class="phone-card">
          <div class="phone-card-dot"></div>
          <div style="flex:1">
            <div class="phone-card-line" style="width:80%"></div>
            <div class="phone-card-line2"></div>
          </div>
        </div>
        <div class="phone-card" style="border-color:rgba(34,217,106,0.3)">
          <div class="phone-card-dot"></div>
          <div style="flex:1">
            <div class="phone-card-line" style="width:55%"></div>
            <div class="phone-card-line2"></div>
          </div>
          <div style="font-size:9px;color:#FF6B2B;font-weight:700;font-family:Inter,sans-serif;padding:3px 8px;border-radius:6px;background:rgba(255,107,43,0.15)">LIVE</div>
        </div>
      </div>
    </div>
    <!-- Glow sous le téléphone -->
    <div style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);width:160px;height:40px;background:radial-gradient(ellipse,rgba(34,217,106,0.35) 0%,transparent 70%);border-radius:50%"></div>
  </div>
</div>
</body>
</html>`;

console.log('🎨 Generating og-preview.png...');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'networkidle' });
// Attendre que les fonts Google soient chargées
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log(`✓ Saved to ${OUT}`);
