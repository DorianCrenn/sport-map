/**
 * Capture la carte SportLink (vue par défaut avec les events réels).
 * Écrase public/screenshots/map-mobile.png.
 * Prérequis : serveur dev lancé sur http://localhost:5173
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT      = resolve(__dirname, '../public/screenshots/map-mobile.png');
const BASE_URL = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';
const W = 390, H = 844;

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    locale: 'fr-FR',
    colorScheme: 'dark',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();

  try {
    console.log('[1/4] Chargement...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 40_000 });
    await page.waitForTimeout(1500);

    console.log('[2/4] Navigation Carte...');
    await page.locator('[data-demo="tab-map"]').click({ force: true }).catch(async () => {
      await page.locator('button').filter({ hasText: 'Carte' }).first().click().catch(() => null);
    });

    console.log('[3/4] Attente des tiles et markers...');
    await page.waitForSelector('.leaflet-container', { timeout: 20_000 }).catch(() => null);
    await page.waitForTimeout(4500);

    // Masquer uniquement les bannières/toasts
    await page.evaluate(() => {
      ['.sl-toast', '#nprogress', '.sl-sw-update-banner', '.sl-consent-banner']
        .forEach(sel => document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; }));
    });
    await page.waitForTimeout(300);

    const info = await page.evaluate(() => ({
      clusters: document.querySelectorAll('.marker-cluster').length,
      markers:  document.querySelectorAll('.leaflet-marker-icon').length,
    }));
    console.log(`    → ${info.clusters} clusters, ${info.markers} markers totaux`);

    console.log('[4/4] Capture...');
    await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`✓ ${OUT}`);

  } finally {
    await ctx.close();
    await browser.close();
  }
}

run().catch(err => { console.error('✗', err.message); process.exit(1); });
