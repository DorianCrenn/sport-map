/**
 * Génère les screenshots PWA réels à partir de l'app en cours de dev.
 * Usage : npm run dev (dans un autre terminal) puis node scripts/generate-pwa-screenshots.js
 *
 * Produit :
 *   public/screenshots/map-mobile.png    390×844
 *   public/screenshots/feed-mobile.png   390×844
 *   public/screenshots/poster-mobile.png 390×844
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = resolve(__dirname, '../public/screenshots');
const BASE_URL  = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

const W = 390;
const H = 844;

const SHOTS = [
  {
    file:     'map-mobile.png',
    url:      `${BASE_URL}/`,
    label:    'Carte des événements sportifs',
    // Cliquer sur l'onglet Carte dans la bottom nav
    clickTab: '[data-demo="tab-map"]',
    waitFor:  '.leaflet-container, [data-demo="tab-map"]',
    waitMs:   2500,
  },
  {
    file:     'feed-mobile.png',
    url:      `${BASE_URL}/`,
    label:    'Fil d\'actualités des clubs',
    clickTab: '[data-demo="tab-actu"]',
    waitFor:  '[data-demo="tab-actu"]',
    waitMs:   2000,
  },
  {
    file:     'poster-mobile.png',
    url:      `${BASE_URL}/`,
    label:    'Clubs sportifs',
    clickTab: '[data-demo="tab-clubs"]',
    waitFor:  '[data-demo="tab-clubs"]',
    waitMs:   2000,
  },
];

async function run() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (const shot of SHOTS) {
      console.log(`[screenshot] ${shot.label} → ${shot.file}`);
      const ctx = await browser.newContext({
        viewport:         { width: W, height: H },
        deviceScaleFactor: 2,
        locale:           'fr-FR',
        colorScheme:      'dark',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      });
      const page = await ctx.newPage();

      try {
        await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 30_000 });
        // Attendre la bottom nav puis cliquer sur l'onglet cible
        if (shot.clickTab) {
          await page.waitForSelector(shot.clickTab, { timeout: 8_000 }).catch(() => null);
          await page.click(shot.clickTab).catch(() => null);
        }
        // Attendre le contenu de l'onglet
        await page.waitForSelector(shot.waitFor, { timeout: 10_000 }).catch(() => null);
        // Laisser les animations se terminer
        await page.waitForTimeout(shot.waitMs);
        // Masquer les éventuels overlays/toasts qui pourraient couvrir le contenu
        await page.evaluate(() => {
          const selectors = ['[role="status"][aria-live]', '.sl-toast', '#nprogress', '.sl-sw-update-banner'];
          selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => (el.style.display = 'none'));
          });
        });
        await page.screenshot({
          path: resolve(OUT_DIR, shot.file),
          clip: { x: 0, y: 0, width: W, height: H },
        });
        console.log(`  ✓ ${resolve(OUT_DIR, shot.file)}`);
      } catch (err) {
        console.error(`  ✗ Échec : ${err.message}`);
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\nScreenshots générés dans public/screenshots/');
  console.log('Vérifiez-les dans un navigateur avant de déployer.');
}

run().catch(err => { console.error(err); process.exit(1); });
