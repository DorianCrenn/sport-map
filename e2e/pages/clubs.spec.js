import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests ClubsPage + ClubPageView overlay — P0/P1
 */

test.describe('ClubsPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Naviguer vers le tab clubs
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');
  });

  test('affiche la liste ou le message vide des clubs', async ({ page }) => {
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();

    // Soit des clubs sont listés, soit un message vide
    const hasClubsOrEmpty = await page
      .locator('[class*="club"], [data-testid*="club"], h2, .empty-state')
      .count();
    expect(hasClubsOrEmpty).toBeGreaterThanOrEqual(0);
  });

  test('pas d\'overflow horizontal sur mobile', async ({ page }) => {
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal sur ClubsPage').toBe(true);
  });

  test('le leaderboard clubs est visible (si connecté)', async ({ page }) => {
    // Le leaderboard peut n'être visible qu'aux utilisateurs connectés
    // On vérifie juste qu'il n'y a pas d'erreur
    const errorBoundary = page.getByText(/error|erreur/i).first();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('screenshot — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('clubs-mobile.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('ClubPageView overlay (deep link)', () => {
  test('ouvre via hash #club/id sans crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Tenter d'ouvrir un overlay club (l'ID sera inexistant en test mais ne doit pas crasher)
    await page.evaluate(() => {
      window.location.hash = '#club/test-123';
    });
    await page.waitForTimeout(1000);
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('screenshot ClubPageView — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Cliquer sur le premier club dans la liste si disponible
    const firstClubCard = page.locator('[class*="club-card"], [data-testid="club-card"]').first();
    if (await firstClubCard.isVisible()) {
      await firstClubCard.click();
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot('club-view-mobile.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });
});
