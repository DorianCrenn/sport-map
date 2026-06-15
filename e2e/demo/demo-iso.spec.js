import { test, expect } from '@playwright/test';

/**
 * Tests ISO — vérifie que les fonctionnalités clés fonctionnent en mode démo
 * sans erreur console, avec les mêmes composants que l'app réelle.
 */

// ── Helper : avance une étape (gère pill-mode + instabilité timer) ─────────────
async function stepNext(page) {
  const btn = page.getByRole('button', { name: /continuer|passer cette étape/i }).first();
  if (!await btn.isVisible().catch(() => false)) {
    // Pill mode (étape interactive) — cliquer le pill pour ouvrir le guide complet
    await page.locator('[data-drag-handle]').first().click({ force: true, timeout: 5000 });
    await page.waitForTimeout(300);
  }
  await btn.click({ force: true, timeout: 10000 });
  await page.waitForTimeout(400);
}

test.describe('Demo ISO — pas d\'erreurs console', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('net::ERR') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      sessionStorage.setItem('sl-demo-no-auto-advance', '1');
    });
  });

  test('landing page /demo sans erreur JS', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const criticals = consoleErrors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read properties')
    );
    expect(criticals, `Erreurs JS critiques : ${criticals.join('\n')}`).toHaveLength(0);
  });

  test('tour Président — aucune erreur .or() sur 3 étapes', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 3; i++) {
      await stepNext(page);
    }
    const orErrors = consoleErrors.filter(e => e.includes('.or is not a function'));
    expect(orErrors).toHaveLength(0);
  });

  test('tour Président — étape 5 visible sans erreur JS', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(500);
    for (let i = 0; i < 4; i++) {
      await stepNext(page);
    }
    // Étape 5 : interactive (fab-add) → guide en pill — expand pour voir le compteur
    const stepBtn = page.getByText(/Étape 5/i);
    if (!await stepBtn.isVisible().catch(() => false)) {
      await page.locator('[data-drag-handle]').first().click({ force: true });
      await page.waitForTimeout(300);
    }
    await expect(stepBtn).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    const jsErrors = consoleErrors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read')
    );
    expect(jsErrors, `Erreurs JS : ${jsErrors.join('\n')}`).toHaveLength(0);
  });

  test('tour Parent — aucune erreur sur convocations fictives', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Parent/i }).first().click();
    await page.waitForTimeout(800);
    const criticals = consoleErrors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read')
    );
    expect(criticals, `Erreurs JS : ${criticals.join('\n')}`).toHaveLength(0);
  });
});

test.describe('Demo ISO — composants clés présents en démo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      sessionStorage.setItem('sl-demo-no-auto-advance', '1');
    });
  });

  test('DemoGuide visible après sélection d\'un profil', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Président/i }).first().click();
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible({ timeout: 5000 });
  });

  test('LiveMultiplexSection visible sur page home', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(1000);
    const multiplex = page.locator('[data-demo="live-multiplex"]');
    await expect(multiplex).toBeVisible({ timeout: 5000 });
  });

  test('CoachMatchCard visible pour le Président', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(1000);
    // Plusieurs cartes coach-match-card peuvent exister — vérifier que au moins 1 est visible
    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('data-demo="fab-add" présent pour Président et Coach', async ({ page }) => {
    for (const profile of ['Président', 'Coach']) {
      await page.addInitScript(() => {
        sessionStorage.removeItem('sl-demo-initialized');
        sessionStorage.removeItem('sl-demo-profile');
        sessionStorage.removeItem('sl-demo-step');
      });
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: new RegExp(profile, 'i') }).first().click();
      await page.waitForTimeout(800);
      await expect(page.locator('[data-demo="fab-add"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
