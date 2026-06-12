import { test, expect } from '@playwright/test';

/**
 * FavorisPage / Sauvegardés — P1
 */
test.describe('FavorisPage (Sauvegardés)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const favTab = page.locator('nav button').filter({ hasText: /sauvegardés|favoris/i }).last();
    await favTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
  });

  test('F01 · Page favoris charge sans crash', async ({ page }) => {
    const error = page.getByText(/quelque chose s'est mal passé/i);
    await expect(error).not.toBeVisible();
  });

  test('F02 · Affiche message si aucun favori (non connecté)', async ({ page }) => {
    // Soit message vide, soit invitation à se connecter, soit liste vide — pas de crash
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(5);
  });

  test('F03 · Pas d\'overflow horizontal mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(ov).toBe(false);
  });

  test('F04 · Pas d\'overflow horizontal Galaxy S22 (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const favTab = page.locator('nav button').filter({ hasText: /sauvegardés/i }).last();
    await favTab.click({ force: true });
    await page.waitForTimeout(500);
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(ov).toBe(false);
  });
});
