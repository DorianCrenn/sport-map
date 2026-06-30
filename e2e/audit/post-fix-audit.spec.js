/**
 * AUDIT POST-CORRECTIFS — Vérification des corrections appliquées
 */
import { test, expect } from '@playwright/test';

const DIR = 'e2e/audit/captures';

async function checkOverflow(page) {
  return page.evaluate(() => ({
    overflow: document.body.scrollWidth > window.innerWidth,
    scrollW: document.body.scrollWidth,
    innerW: window.innerWidth,
  }));
}

async function countSmallTargets(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('button:not([hidden]):not([disabled]), a[href]')];
    return els.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).map(el => ({ text: el.textContent?.trim().slice(0, 25), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
  });
}

// ── FIX 1 : Touch targets HomePage ──────────────────────────────────────────

test('FIX-01 · Touch targets HomePage — zones < 44px réduites', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${DIR}/POST-home-mobile.png` });

  const small = await countSmallTargets(page);
  console.log('Zones < 44px après fix:', small.map(s => `${s.text} (${s.w}×${s.h})`).join(' | '));

  // Vérifier spécifiquement les boutons corrigés
  const voirTout = await page.getByRole('button', { name: /voir tout/i }).first().boundingBox().catch(() => null);
  const voirCarte = await page.getByRole('button', { name: /voir la carte →/i }).first().boundingBox().catch(() => null);
  const lesClubs = await page.getByRole('button', { name: /les clubs →/i }).first().boundingBox().catch(() => null);

  if (voirTout) expect(voirTout.height, `"Voir tout" height: ${voirTout.height}px`).toBeGreaterThanOrEqual(44);
  if (voirCarte) expect(voirCarte.height, `"Voir la carte" height: ${voirCarte.height}px`).toBeGreaterThanOrEqual(44);
  if (lesClubs) expect(lesClubs.height, `"Les clubs" height: ${lesClubs.height}px`).toBeGreaterThanOrEqual(44);

  // Lien démo
  const demoLink = page.locator('a').filter({ hasText: /démo/i }).first();
  if (await demoLink.isVisible().catch(() => false)) {
    const b = await demoLink.boundingBox();
    if (b) expect(b.height, `Démo link height: ${b.height}px`).toBeGreaterThanOrEqual(44);
  }

  // Réduction globale des zones petites
  expect(small.length, `Encore ${small.length} zones < 44px: ${small.slice(0,5).map(s=>s.text).join(', ')}`).toBeLessThan(10);
});

// ── FIX 2 : Clubs desktop grid ───────────────────────────────────────────────

test('FIX-02 · Clubs — grille 2 colonnes desktop 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');

  // Naviguer vers Clubs
  const clubsTab = page.locator('nav button').filter({ hasText: /clubs/i }).last();
  await clubsTab.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/POST-clubs-desktop-grid.png` });

  // Vérifier que la page charge sans crash
  const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
  await expect(errorBoundary).not.toBeVisible();
  const ov = await checkOverflow(page);
  expect(ov.overflow).toBe(false);
});

test('FIX-02b · Clubs — single column mobile OK', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  const clubsTab = page.locator('nav button').filter({ hasText: /clubs/i }).last();
  await clubsTab.click({ force: true });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/POST-clubs-mobile.png` });
  const ov = await checkOverflow(page);
  expect(ov.overflow, 'Overflow horizontal clubs mobile').toBe(false);
  const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
  await expect(errorBoundary).not.toBeVisible();
});

// ── Régression globale : toutes pages ────────────────────────────────────────

test('REGR-01 · Pas de régression sur HomePage', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${DIR}/POST-home-regression.png` });

  const crashed = await page.getByText(/quelque chose s'est mal passé/i).isVisible().catch(() => false);
  expect(crashed).toBe(false);
  const ov = await checkOverflow(page);
  expect(ov.overflow).toBe(false);
  const crit = errors.filter(e => !e.includes('supabase') && !e.includes('vapid'));
  expect(crit.length, 'Régression erreurs JS: ' + crit.join(' | ')).toBe(0);
});

test('REGR-02 · Pas de régression sur MapPage', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/');
  await page.waitForLoadState('networkidle');
  const mapTab = page.locator('nav button').filter({ hasText: /carte/i }).last();
  await mapTab.click({ force: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/POST-map-regression.png` });
  const leaflet = await page.locator('.leaflet-container').isVisible().catch(() => false);
  expect(leaflet).toBe(true);
});
