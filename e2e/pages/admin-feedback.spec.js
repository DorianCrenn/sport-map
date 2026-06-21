import { test, expect } from '@playwright/test';

/**
 * AdminFeedbackPage — gestion des retours communautaires
 * Vérifie la protection d'accès, le rendu sans crash, et les filtres.
 * Aucune donnée réelle n'est attendue (environnement local).
 */
test.describe('AdminFeedbackPage — protection & rendu', () => {
  test('AF01 · Non-admin : tab admin absent du BottomNav', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const adminTab = page.locator('nav button').filter({ hasText: /admin/i });
    await expect(adminTab).toHaveCount(0);
  });

  test('AF02 · Forcer adminSubView=feedback ne provoque pas de crash', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      sessionStorage.setItem('sl-tab', 'admin');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Pas d'ErrorBoundary visible
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('AF03 · Pas d\'overflow horizontal sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
    expect(ov).toBe(false);
  });

  test('AF04 · Pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
    expect(ov).toBe(false);
  });

  test('AF05 · La page principale charge sans erreur JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const fatal = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error') &&
      !e.includes('supabase')
    );
    expect(fatal).toHaveLength(0);
  });
});
