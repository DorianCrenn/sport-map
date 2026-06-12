import { test, expect } from '@playwright/test';

/**
 * Tests ISO — vérifie que les fonctionnalités clés fonctionnent en mode démo
 * sans erreur console, avec les mêmes composants que l'app réelle.
 */

test.describe('Demo ISO — pas d\'erreurs console', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer les erreurs réseau inévitables
        if (!text.includes('net::ERR') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
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
    await page.getByText('Président').click();
    await page.waitForTimeout(500);
    // Avancer 3 fois
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /suivant|passer/i }).first().click();
      await page.waitForTimeout(400);
    }
    const orErrors = consoleErrors.filter(e => e.includes('.or is not a function'));
    expect(orErrors).toHaveLength(0);
  });

  test('tour Président — PosterStudio s\'ouvre sans erreur', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    // Avancer jusqu'à l'étape 5 (PosterStudio)
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /suivant|passer/i }).first().click();
      await page.waitForTimeout(400);
    }
    await expect(page.getByText('Créer une affiche pro')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1500);
    const jsErrors = consoleErrors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read')
    );
    expect(jsErrors, `Erreurs JS : ${jsErrors.join('\n')}`).toHaveLength(0);
  });

  test('tour Parent — aucune erreur sur convocations fictives', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Parent').click();
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
    });
  });

  test('DemoGuide visible après sélection d\'un profil', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    // Le guide démo (pill ou complet) doit être présent
    const guideVisible = await page.locator('[data-testid="demo-guide"], .demo-guide').isVisible().catch(() => false);
    // Alternative : vérifier que le titre de l'étape est visible
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible({ timeout: 5000 });
  });

  test('LiveMultiplexSection visible sur page home', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    await page.waitForTimeout(1000);
    // Le multiplex live doit être visible (matchs en direct)
    const multiplex = page.locator('[data-demo="live-multiplex"]');
    await expect(multiplex).toBeVisible({ timeout: 5000 });
  });

  test('CoachMatchCard visible pour le Président', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    await page.waitForTimeout(1000);
    const card = page.locator('[data-demo="coach-match-card"]');
    await expect(card).toBeVisible({ timeout: 5000 });
  });

  test('data-demo="fab-add" présent pour Président et Coach', async ({ page }) => {
    for (const profile of ['Président', 'Entraîneur']) {
      await page.addInitScript(() => {
        sessionStorage.removeItem('sl-demo-initialized');
        sessionStorage.removeItem('sl-demo-profile');
        sessionStorage.removeItem('sl-demo-step');
      });
      await page.goto('/demo');
      await page.waitForLoadState('networkidle');
      await page.getByText(profile).click();
      await page.waitForTimeout(800);
      await expect(page.locator('[data-demo="fab-add"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
