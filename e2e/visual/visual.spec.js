/**
 * Tests de régression visuelle SportLink — Playwright toHaveScreenshot
 *
 * Stratégie :
 * - Première exécution : génère les baselines dans e2e/visual/visual.spec.js-snapshots/
 * - Exécutions suivantes : compare pixel à pixel (tolérance 0.2%)
 * - Toute différence > seuil bloque la PR
 *
 * Appareils testés : iPhone SE (375), iPhone 15 Pro (393), Desktop 1440
 */
import { test, expect } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function waitForApp(page) {
  await page.waitForLoadState('networkidle');
  // Laisser les animations Framer Motion se stabiliser
  await page.waitForTimeout(600);
}

async function goTab(page, label) {
  const btn = page.locator('nav button').filter({ hasText: new RegExp(label, 'i') }).last();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click({ force: true });
    await page.waitForTimeout(600);
  }
}

const SNAP_OPTS = {
  maxDiffPixelRatio: 0.004, // 0.4% de tolérance
  animations: 'disabled',   // figer les animations CSS
};

// ── MOBILE — iPhone SE (375×667) ─────────────────────────────────────────────

test.describe('Visual — iPhone SE (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
  });

  test('VIS-01 · Accueil mobile', async ({ page }) => {
    await expect(page).toHaveScreenshot('01-home-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-02 · Carte mobile', async ({ page }) => {
    await goTab(page, 'Carte');
    // Attendre le chargement Leaflet
    await page.locator('.leaflet-container').waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('02-map-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-03 · Clubs mobile', async ({ page }) => {
    await goTab(page, 'Clubs');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('03-clubs-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-04 · Favoris/Sauvegardés mobile', async ({ page }) => {
    await goTab(page, 'Sauvegardés');
    await page.waitForTimeout(600);
    await expect(page).toHaveScreenshot('04-favoris-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-05 · Profil / Auth mobile', async ({ page }) => {
    await goTab(page, 'Profil');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('05-profil-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-06 · BottomNav mobile', async ({ page }) => {
    const nav = page.locator('nav').last();
    await expect(nav).toHaveScreenshot('06-bottomnav-iphoneSE.png', SNAP_OPTS);
  });
});

// ── MOBILE — iPhone 15 Pro (393×852) ─────────────────────────────────────────

test.describe('Visual — iPhone 15 Pro (393px)', () => {
  test.use({ viewport: { width: 393, height: 852 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
  });

  test('VIS-10 · Accueil iPhone 15', async ({ page }) => {
    await expect(page).toHaveScreenshot('10-home-iphone15.png', SNAP_OPTS);
  });

  test('VIS-11 · Clubs iPhone 15', async ({ page }) => {
    await goTab(page, 'Clubs');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('11-clubs-iphone15.png', SNAP_OPTS);
  });

  test('VIS-12 · Carte iPhone 15', async ({ page }) => {
    await goTab(page, 'Carte');
    await page.locator('.leaflet-container').waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('12-map-iphone15.png', SNAP_OPTS);
  });
});

// ── DESKTOP — 1440×900 ────────────────────────────────────────────────────────

test.describe('Visual — Desktop 1440px', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
  });

  test('VIS-20 · Accueil desktop', async ({ page }) => {
    await expect(page).toHaveScreenshot('20-home-desktop1440.png', SNAP_OPTS);
  });

  test('VIS-21 · Clubs desktop — grille 4 colonnes', async ({ page }) => {
    await goTab(page, 'Clubs');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('21-clubs-desktop1440.png', SNAP_OPTS);
  });

  test('VIS-22 · Carte desktop — sidebar visible', async ({ page }) => {
    await goTab(page, 'Carte');
    await page.locator('.leaflet-container').waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot('22-map-desktop1440.png', SNAP_OPTS);
  });

  test('VIS-23 · Profil / Auth desktop', async ({ page }) => {
    await goTab(page, 'Profil');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('23-profil-desktop1440.png', SNAP_OPTS);
  });
});

// ── COMPOSANTS CRITIQUES ──────────────────────────────────────────────────────

test.describe('Visual — Composants clés', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('VIS-30 · Page auth — formulaire connexion', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    await goTab(page, 'Profil');
    await page.waitForTimeout(800);
    // Capturer uniquement le modal d'auth si visible
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(modal).toHaveScreenshot('30-auth-modal-mobile.png', SNAP_OPTS);
    } else {
      // Capturer la page entière si pas de modal séparé
      await expect(page).toHaveScreenshot('30-auth-page-mobile.png', SNAP_OPTS);
    }
  });

  test('VIS-31 · Accueil — hero section complète', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    // Capturer le hero (partie visible sans scroll)
    await expect(page).toHaveScreenshot('31-hero-mobile.png', {
      ...SNAP_OPTS,
      fullPage: false,
      clip: { x: 0, y: 0, width: 375, height: 500 },
    });
  });

  test('VIS-32 · BottomNav — tous les states', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);

    // State 1 : Accueil actif
    const nav = page.locator('nav').last();
    await expect(nav).toHaveScreenshot('32a-nav-accueil.png', SNAP_OPTS);

    // State 2 : Clubs actif
    await goTab(page, 'Clubs');
    await page.waitForTimeout(400);
    await expect(nav).toHaveScreenshot('32b-nav-clubs.png', SNAP_OPTS);

    // State 3 : Carte actif
    await goTab(page, 'Carte');
    await page.waitForTimeout(400);
    await expect(nav).toHaveScreenshot('32c-nav-carte.png', SNAP_OPTS);
  });
});

// ── RESPONSIVE — OVERFLOW CHECK VISUEL ────────────────────────────────────────

test.describe('Visual — Galaxy S22 (360px)', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('VIS-40 · Accueil Galaxy S22', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    await expect(page).toHaveScreenshot('40-home-galaxy-s22.png', SNAP_OPTS);
  });

  test('VIS-41 · Clubs Galaxy S22', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    await goTab(page, 'Clubs');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('41-clubs-galaxy-s22.png', SNAP_OPTS);
  });
});

// ── DESKTOP 1920 ──────────────────────────────────────────────────────────────

test.describe('Visual — Desktop 1920px', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('VIS-50 · Accueil desktop 1920', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    await expect(page).toHaveScreenshot('50-home-desktop1920.png', SNAP_OPTS);
  });

  test('VIS-51 · Clubs desktop 1920 — grille large', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await waitForApp(page);
    await goTab(page, 'Clubs');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('51-clubs-desktop1920.png', SNAP_OPTS);
  });
});

// ── MODE DÉMO — Landing page ──────────────────────────────────────────────────
// /demo est la route de vente principale — toute régression visuelle doit être détectée.

// Injecte le nettoyage sessionStorage avant que la page lise sl-demo-profile.
async function clearDemoSessionStorage(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
  });
}

test.describe('Visual — Mode Démo landing (iPhone SE 375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('VIS-60 · Landing démo — grille 2 colonnes mobile', async ({ page }) => {
    await clearDemoSessionStorage(page);
    await page.goto('http://localhost:5173/demo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });
    // Attendre que toutes les cards soient animées (dernier delay : 0.12 + 5*0.06 + 0.35 ≈ 0.85s)
    await page.waitForTimeout(900);
    await expect(page).toHaveScreenshot('60-demo-landing-iphoneSE.png', SNAP_OPTS);
  });

  test('VIS-62 · Guide démo — profil Président, étape 1 (mobile)', async ({ page }) => {
    await clearDemoSessionStorage(page);
    await page.goto('http://localhost:5173/demo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });

    // Sélectionner Président
    await page.getByRole('button', { name: /Président/i }).first().click();
    // Attendre l'apparition du DemoGuide
    await expect(page.getByText(/Étape 1[^0-9]/)).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(800);

    await expect(page).toHaveScreenshot('62-demo-guide-president-iphoneSE.png', {
      ...SNAP_OPTS,
      maxDiffPixelRatio: 0.01, // tolérance plus haute : app derrière le guide charge des données
    });
  });
});

test.describe('Visual — Mode Démo landing (Desktop 1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('VIS-61 · Landing démo — grille 3 colonnes desktop', async ({ page }) => {
    await clearDemoSessionStorage(page);
    await page.goto('http://localhost:5173/demo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(900);
    await expect(page).toHaveScreenshot('61-demo-landing-desktop1440.png', SNAP_OPTS);
  });

  test('VIS-63 · Guide démo — profil Président, étape 1 (desktop)', async ({ page }) => {
    await clearDemoSessionStorage(page);
    await page.goto('http://localhost:5173/demo');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /Président/i }).first().click();
    await expect(page.getByText(/Étape 1[^0-9]/)).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(800);

    await expect(page).toHaveScreenshot('63-demo-guide-president-desktop1440.png', {
      ...SNAP_OPTS,
      maxDiffPixelRatio: 0.01,
    });
  });
});
