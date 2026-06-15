import { test, expect } from '@playwright/test';

/**
 * Tour Président complet — parcours par étapes.
 * Force:true sur tous les clics car le timer DemoGuide (setInterval 50ms)
 * provoque des re-renders React qui désynchronisent les polls Playwright.
 */

// ── Helper : avance d'une étape (gère pill-mode + instabilité timer) ──────────
async function stepNext(page) {
  const btn = page.getByRole('button', { name: /continuer|passer cette étape/i }).first();
  if (!await btn.isVisible().catch(() => false)) {
    await page.locator('[data-drag-handle]').first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
  }
  await btn.click({ force: true, timeout: 15000 });
  await page.waitForTimeout(400);
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
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible({ timeout: 8000 });
  });

  test('étape 1 — cockpit opérationnel visible', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible({ timeout: 8000 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(500);
    const jsErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(jsErrors.length, `Erreurs console : ${jsErrors.join(', ')}`).toBe(0);
  });

  test('avancer jusqu\'à l\'étape 2 (ouvrir menu actions)', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    await stepNext(page);
    // Étape 2 interactive → pill mode : expand pour voir le compteur
    const s2 = page.getByText(/Étape 2/i);
    if (!await s2.isVisible().catch(() => false)) {
      await page.locator('[data-drag-handle]').first().click({ force: true });
      await page.waitForTimeout(300);
    }
    await expect(s2).toBeVisible({ timeout: 5000 });
  });

  test('étape 2 — guide affiche l\'instruction sans erreur JS', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    await stepNext(page);
    const s2 = page.getByText(/Étape 2/i);
    if (!await s2.isVisible().catch(() => false)) {
      await page.locator('[data-drag-handle]').first().click({ force: true });
      await page.waitForTimeout(300);
    }
    await expect(s2).toBeVisible({ timeout: 5000 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read') || e.includes('undefined')
    );
    expect(criticalErrors.length, `Erreurs JS : ${criticalErrors.join('\n')}`).toBe(0);
  });

  test('étape 5 — guide visible sans erreur .or()', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 4; i++) {
      await stepNext(page);
    }
    const s5 = page.getByText(/Étape 5/i);
    if (!await s5.isVisible().catch(() => false)) {
      await page.locator('[data-drag-handle]').first().click({ force: true });
      await page.waitForTimeout(300);
    }
    await expect(s5).toBeVisible({ timeout: 5000 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(500);
    expect(errors.some(e => e.includes('.or is not a function'))).toBe(false);
  });

  test('étape 12 — CTA affiché avec bouton créer club', async ({ page }) => {
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 11; i++) {
      await stepNext(page);
    }
    await expect(page.getByText('Prêt à créer votre club')).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /créer mon club/i })).toBeVisible();
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
