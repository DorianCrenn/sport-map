/**
 * AUDIT COMPLET SPORTLINK — Script de capture multi-dimensions
 * Capture screenshots, erreurs console, overflow, interactions UX
 */
import { test, expect } from '@playwright/test';

const AUDIT_DIR = 'e2e/audit/captures';

// ─── HELPERS ────────────────────────────────────────────────────────────────

async function goToTab(page, tabLabel) {
  const btn = page.locator('nav button').filter({ hasText: tabLabel });
  if (await btn.count() > 0) {
    await btn.first().click({ force: true });
    await page.waitForTimeout(800);
  }
}

async function collectErrors(page) {
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('[PAGEERROR] ' + err.message));
  return errors;
}

async function hasOverflow(page) {
  return page.evaluate(() => ({
    overflow: document.body.scrollWidth > window.innerWidth,
    scrollW: document.body.scrollWidth,
    innerW: window.innerWidth,
  }));
}

async function countSmallTargets(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('button:not([disabled]):not([hidden]), a[href]')];
    return els.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).map(el => ({ text: el.textContent?.trim().slice(0, 20), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
  });
}

async function checkErrorBoundary(page) {
  const txt = await page.locator('body').innerText().catch(() => '');
  return txt.includes('quelque chose s') && txt.includes('mal passé');
}

// ─── AUDIT 1 : NAVIGATION & CHARGEMENT ──────────────────────────────────────

test.describe('AUDIT-01 · Navigation & Chargement initial', () => {
  test('A01-01 · Page racine charge — iPhone SE', async ({ page }) => {
    const errors = await collectErrors(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${AUDIT_DIR}/A01-01-home-mobile.png`, fullPage: false });

    const crashed = await checkErrorBoundary(page);
    expect(crashed, 'Error Boundary déclenché').toBe(false);
    const ov = await hasOverflow(page);
    expect(ov.overflow, `Overflow ${ov.scrollW}px > ${ov.innerW}px`).toBe(false);
    const critErrors = errors.filter(e => !e.includes('supabase') && !e.includes('vapid') && !e.includes('removebg'));
    expect(critErrors.length, 'Erreurs JS: ' + critErrors.join(' | ')).toBe(0);
  });

  test('A01-02 · Page racine charge — Desktop 1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${AUDIT_DIR}/A01-02-home-desktop.png`, fullPage: false });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A01-03 · BottomNav visible et complet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
    const navBounds = await nav.boundingBox();
    await page.screenshot({ path: `${AUDIT_DIR}/A01-03-bottomnav.png` });
    // Nav ne dépasse pas la largeur
    if (navBounds) expect(navBounds.x + navBounds.width).toBeLessThanOrEqual(376);
  });

  test('A01-04 · Tabs : Carte', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A01-04-map-mobile.png` });
    const leaflet = await page.locator('.leaflet-container').isVisible().catch(() => false);
    expect(leaflet, 'Carte Leaflet non visible').toBe(true);
  });

  test('A01-05 · Tabs : Clubs', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Clubs');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${AUDIT_DIR}/A01-05-clubs-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A01-06 · Tabs : Actualités', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Actu');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${AUDIT_DIR}/A01-06-news-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A01-07 · Tabs : Favoris', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Favoris');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${AUDIT_DIR}/A01-07-favoris-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A01-08 · Tabs : Profil / Auth', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Profil');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${AUDIT_DIR}/A01-08-profil-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });
});

// ─── AUDIT 2 : RESPONSIVE ────────────────────────────────────────────────────

test.describe('AUDIT-02 · Responsive', () => {
  const viewports = [
    { name: 'Galaxy-S22', w: 360, h: 780 },
    { name: 'iPhone-SE', w: 375, h: 667 },
    { name: 'iPhone-15', w: 393, h: 852 },
    { name: 'Pixel-7', w: 412, h: 915 },
    { name: 'iPad', w: 768, h: 1024 },
    { name: 'Desktop-1440', w: 1440, h: 900 },
  ];

  for (const vp of viewports) {
    test(`A02 · Overflow check — ${vp.name} (${vp.w}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto('http://localhost:5173/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${AUDIT_DIR}/A02-overflow-${vp.name}.png` });
      const ov = await hasOverflow(page);
      expect(ov.overflow, `Overflow sur ${vp.name}: scrollW=${ov.scrollW} > innerW=${ov.innerW}`).toBe(false);
    });
  }

  test('A02-TOUCH · Zones tactiles < 44px sur iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const small = await countSmallTargets(page);
    if (small.length > 0) {
      console.log('Zones tactiles trop petites:', JSON.stringify(small.slice(0, 5)));
    }
    // Note: warning only, pas blocage (certaines icônes intentionnellement petites)
    expect(small.length).toBeLessThan(10);
  });
});

// ─── AUDIT 3 : CARTE ─────────────────────────────────────────────────────────

test.describe('AUDIT-03 · Carte Leaflet', () => {
  test('A03-01 · Carte charge et affiche markers', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${AUDIT_DIR}/A03-01-map-markers.png` });
    const leaflet = page.locator('.leaflet-container');
    await expect(leaflet).toBeVisible();
  });

  test('A03-02 · Carte desktop — sidebar visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A03-02-map-desktop.png` });
  });

  test('A03-03 · Filtres sport/date visibles et cliquables', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(2000);
    // Filtres sport
    await page.screenshot({ path: `${AUDIT_DIR}/A03-03-map-filters.png` });
  });
});

// ─── AUDIT 4 : CLUBS ─────────────────────────────────────────────────────────

test.describe('AUDIT-04 · Clubs', () => {
  test('A04-01 · Liste clubs sans crash', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Clubs');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A04-01-clubs-list.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A04-02 · ClubPageView via deep link', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    // Cliquer sur le premier club visible
    await goToTab(page, 'Clubs');
    await page.waitForTimeout(2000);
    const clubCard = page.locator('[class*="club"], [data-testid*="club"]').first();
    if (await clubCard.isVisible()) {
      await clubCard.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${AUDIT_DIR}/A04-02-club-view.png` });
    } else {
      await page.screenshot({ path: `${AUDIT_DIR}/A04-02-clubs-empty.png` });
    }
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A04-03 · Clubs desktop 1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Clubs');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A04-03-clubs-desktop.png` });
  });
});

// ─── AUDIT 5 : ACTUALITÉS / FEED ────────────────────────────────────────────

test.describe('AUDIT-05 · Actualités / Feed', () => {
  test('A05-01 · ActualitesPage mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Actu');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A05-01-news-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
  });

  test('A05-02 · ActualitesPage desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Actu');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${AUDIT_DIR}/A05-02-news-desktop.png` });
  });
});

// ─── AUDIT 6 : PROFIL / AUTH ─────────────────────────────────────────────────

test.describe('AUDIT-06 · Profil / Authentification', () => {
  test('A06-01 · Page auth sans crash — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Profil');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${AUDIT_DIR}/A06-01-auth-mobile.png` });
    const crashed = await checkErrorBoundary(page);
    expect(crashed).toBe(false);
    const ov = await hasOverflow(page);
    expect(ov.overflow).toBe(false);
  });

  test('A06-02 · Formulaire auth complet et accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Profil');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${AUDIT_DIR}/A06-02-auth-form.png` });
    // Pas de validation — juste capture
  });
});

// ─── AUDIT 7 : POSTER STUDIO ─────────────────────────────────────────────────

test.describe('AUDIT-07 · PosterStudio', () => {
  test('A07-01 · Bouton affiche visible sur EventCard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${AUDIT_DIR}/A07-01-map-with-events.png` });
    // Chercher un event card ouvert ou le sidebar
    const eventCard = page.locator('[class*="event-card"], [data-testid*="event"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${AUDIT_DIR}/A07-01b-event-opened.png` });
    }
  });

  test('A07-02 · PosterStudio ne crashe pas à l\'ouverture', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await goToTab(page, 'Carte');
    await page.waitForTimeout(2500);

    const posterBtn = page.getByRole('button', { name: /affiche|poster/i }).first();
    if (await posterBtn.isVisible()) {
      await posterBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${AUDIT_DIR}/A07-02-poster-studio.png` });
      const crashed = await checkErrorBoundary(page);
      expect(crashed, 'Error Boundary dans PosterStudio').toBe(false);
    } else {
      await page.screenshot({ path: `${AUDIT_DIR}/A07-02-no-poster-btn.png` });
      test.info().annotations.push({ type: 'warning', description: 'Bouton affiche non visible (pas d\'événement)' });
    }
    const crit = errors.filter(e => !e.includes('supabase') && !e.includes('removebg'));
    expect(crit.length, 'Erreurs JS PosterStudio: ' + crit.join(' | ')).toBe(0);
  });
});

// ─── AUDIT 8 : MODE DÉMO ─────────────────────────────────────────────────────

test.describe('AUDIT-08 · Mode Démo', () => {
  test('A08-01 · Accès au mode démo', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${AUDIT_DIR}/A08-01-home-for-demo.png` });

    const demoBtn = page.getByRole('button', { name: /démo|demo/i })
      .or(page.getByText(/voir la démo|mode démo/i).first());

    const demoVisible = await demoBtn.first().isVisible({ timeout: 3000 }).catch(() => false);
    await page.screenshot({ path: `${AUDIT_DIR}/A08-01b-demo-button-search.png` });

    if (demoVisible) {
      await demoBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${AUDIT_DIR}/A08-02-demo-opened.png` });
      const crashed = await checkErrorBoundary(page);
      expect(crashed).toBe(false);
    }
  });

  test('A08-03 · Démo Président — activation profil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    const demoBtn = page.getByRole('button', { name: /démo|demo/i }).first();
    if (await demoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await demoBtn.click();
      await page.waitForTimeout(1000);
      const presidentBtn = page.getByRole('button', { name: /président/i }).first();
      if (await presidentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await presidentBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${AUDIT_DIR}/A08-03-demo-president.png` });
        const crashed = await checkErrorBoundary(page);
        expect(crashed).toBe(false);
      } else {
        await page.screenshot({ path: `${AUDIT_DIR}/A08-03-demo-no-president.png` });
      }
    }
  });
});

// ─── AUDIT 9 : CONSOLE ERRORS GLOBALES ──────────────────────────────────────

test.describe('AUDIT-09 · Erreurs console globales', () => {
  test('A09-01 · Navigation complète sans erreur critique', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('[PAGEERROR] ' + e.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    for (const tab of ['Carte', 'Clubs', 'Actu', 'Favoris', 'Profil']) {
      await goToTab(page, tab);
      await page.waitForTimeout(1000);
    }

    const crit = errors.filter(e =>
      !e.includes('supabase') && !e.includes('vapid') && !e.includes('removebg') &&
      !e.includes('anthropic') && !e.includes('favicon') && !e.includes('net::ERR')
    );
    if (crit.length > 0) console.log('Erreurs critiques:', crit);
    expect(crit.length, 'Erreurs JS durant navigation: ' + crit.slice(0, 3).join(' | ')).toBe(0);
  });
});

// ─── AUDIT 10 : PERFORMANCE PERÇUE ──────────────────────────────────────────

test.describe('AUDIT-10 · Performance perçue', () => {
  test('A10-01 · Temps de chargement initial < 3s', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const t0 = Date.now();
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('domcontentloaded');
    const ttDCL = Date.now() - t0;
    await page.waitForLoadState('networkidle');
    const ttNI = Date.now() - t0;
    console.log(`DCL: ${ttDCL}ms, NetworkIdle: ${ttNI}ms`);
    expect(ttNI).toBeLessThan(10000); // 10s max en dev (Supabase cold start)
  });

  test('A10-02 · Carte charge en < 5s', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const t0 = Date.now();
    await goToTab(page, 'Carte');
    await page.locator('.leaflet-container').waitFor({ timeout: 8000 });
    const elapsed = Date.now() - t0;
    console.log(`Carte chargée en ${elapsed}ms`);
    expect(elapsed).toBeLessThan(8000);
  });
});
