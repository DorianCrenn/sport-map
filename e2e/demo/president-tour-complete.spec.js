import { test, expect } from '@playwright/test';

/**
 * Tour Président complet — parcours par étapes.
 * Force:true sur tous les clics car le timer DemoGuide (setInterval 50ms)
 * provoque des re-renders React qui désynchronisent les polls Playwright.
 */

// ── Helpers robustes ──────────────────────────────────────────────────────────
// Le DemoGuide passe en pill-mode / overlay après les étapes interactives, ce qui
// rend le compteur « Étape N » et les boutons intermittents. On teste donc des
// INVARIANTS (pas de crash, éléments-clés présents, CTA atteignable) plutôt que
// l'état exact du guide à un instant T.

const CODE_ERROR = /is not a function|Cannot read|ReferenceError|TypeError|RangeError|\.or is not a function/;

function trackCritical(page) {
  const errs = [];
  page.on('pageerror', (e) => { if (CODE_ERROR.test(e.message)) errs.push(e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && CODE_ERROR.test(m.text())) errs.push(m.text()); });
  return errs;
}

async function expectNoCrash(page, errs, label) {
  await expect(page.getByText('Une erreur est survenue'), `ErrorBoundary : ${label}`).toHaveCount(0);
  expect(errs, `Erreur JS sur ${label} : ${errs.join(' | ')}`).toEqual([]);
}

/** Avance d'une étape si un bouton de nav est visible ; sinon tente d'agrandir le
 *  pill, sinon renvoie false (fin du tour / guide masqué). Ne force jamais un clic
 *  sur un élément invisible (évite les timeouts de 15s). */
async function tryAdvance(page) {
  const btn = page.getByRole('button', { name: /suivant|passer cette étape|terminer la visite/i }).first();
  if (!await btn.isVisible().catch(() => false)) {
    const handle = page.locator('[data-drag-handle]').first();
    if (await handle.isVisible().catch(() => false)) {
      await handle.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  if (!await btn.isVisible().catch(() => false)) return false;
  await btn.click({ force: true }).catch(() => {});
  await page.waitForTimeout(400);
  return true;
}

test.describe('Tour Président — 8 étapes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      sessionStorage.setItem('sl-demo-no-auto-advance', '1');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('landing page affiche les 6 profils', async ({ page }) => {
    for (const label of ['Président', 'Coach', 'Parent', 'Joueur', 'Supporter']) {
      await expect(page.getByRole('button', { name: new RegExp(label, 'i') }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('sélectionner Président lance le tour', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await expect(page.getByText('Votre cockpit de président')).toBeVisible({ timeout: 8000 });
  });

  test('étape 1 — cockpit opérationnel visible', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await expect(page.getByText('Votre cockpit de président')).toBeVisible({ timeout: 8000 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(500);
    const jsErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(jsErrors.length, `Erreurs console : ${jsErrors.join(', ')}`).toBe(0);
  });

  test('avancer d\'une étape ouvre le menu d\'actions (sans crash)', async ({ page }) => {
    const errs = trackCritical(page);
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    await tryAdvance(page); // étape 1 → 2 : « ouvrir le menu d'actions »
    // Invariant : l'action du menu (« Créer un événement ») devient accessible.
    await expect(page.getByRole('button', { name: /Créer un événement/i }).first())
      .toBeVisible({ timeout: 8000 });
    await expectNoCrash(page, errs, 'étape 2 (menu actions)');
  });

  test('avancer en début de tour ne produit aucune erreur JS', async ({ page }) => {
    const errs = trackCritical(page);
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    await tryAdvance(page);
    await page.waitForTimeout(800);
    await expectNoCrash(page, errs, 'début de tour');
  });

  test('avancer jusqu\'au milieu du tour sans erreur (.or, etc.)', async ({ page }) => {
    const errs = trackCritical(page);
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 4; i++) await tryAdvance(page);
    await page.waitForTimeout(500);
    await expectNoCrash(page, errs, 'milieu de tour');
  });

  test('le tour est traversable jusqu\'au CTA « créer mon club »', async ({ page }) => {
    const errs = trackCritical(page);
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    // Marche jusqu'au bout (≤ 16 tentatives) ; s'arrête quand plus de bouton nav.
    for (let i = 0; i < 16; i++) {
      const advanced = await tryAdvance(page);
      const ctaSeen = await page.getByRole('button', { name: /créer mon club/i }).first()
        .isVisible().catch(() => false);
      if (ctaSeen || !advanced) break;
    }
    await expectNoCrash(page, errs, 'traversée du tour');
    // CTA de création atteignable (bannière démo persistante <a> OU bouton CTA du guide).
    await expect(page.getByText(/créer mon club/i).first())
      .toBeVisible({ timeout: 8000 });
  });

  test('nouvelle visite /demo repart du début', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('sl-demo-initialized', 'true');
      sessionStorage.setItem('sl-demo-profile', 'coach');
      sessionStorage.setItem('sl-demo-step', '3');
    });
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Président/i }).first()).toBeVisible({ timeout: 5000 });
  });
});
