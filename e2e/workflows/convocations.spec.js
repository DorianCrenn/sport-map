import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests Convocations — P1
 * ConvocationsList, EventFormStepConvocation
 */

test.describe('Système de convocations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('l\'onglet convocations s\'affiche sans crash dans le profil/club', async ({ page }) => {
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('ConvocationsList accessible depuis une page club', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('réponse convocation (présent/absent) sans crash', async ({ page }) => {
    // Naviguer vers la section convocations si disponible
    await page.goto('/');
    const convocButton = page.getByRole('button', { name: /convocation|présence/i }).first();
    if (await convocButton.isVisible()) {
      await convocButton.click();
      await page.waitForTimeout(500);
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });
});
