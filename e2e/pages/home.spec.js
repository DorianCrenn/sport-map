import { test, expect } from '@playwright/test';
import { collectConsoleErrors, checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests HomePage (accueil) — P0
 */

test.describe('HomePage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('charge sans crash React', async ({ page }) => {
    // Aucun Error Boundary ne doit s'être déclenché
    const errorBoundary = page.getByText(/quelque chose s'est mal passé|something went wrong/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('affiche le logo ou le nom SportLink', async ({ page }) => {
    const logo = page.locator('img[alt*="SportLink"], img[alt*="sport"], svg[aria-label*="SportLink"]')
      .or(page.getByText('SportLink').first());
    await expect(logo).toBeVisible({ timeout: 5000 });
  });

  test('affiche au moins un contenu de bienvenue ou d\'événements', async ({ page }) => {
    // La homepage doit afficher quelque chose (stats, events, feed, etc.)
    const hasContent = await page.evaluate(() => {
      const body = document.body;
      return body.innerText.length > 50;
    });
    expect(hasContent).toBe(true);
  });

  test('pas d\'overflow horizontal sur iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal sur iPhone SE').toBe(true);
  });

  test('screenshot de référence — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('screenshot de référence — desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
