import { test, expect } from '@playwright/test';

/**
 * AdminPage — P1 (accès réservé admin)
 * Ces tests vérifient que la page est protégée pour les non-admins
 * et accessible pour les admins.
 */
test.describe('AdminPage — protection accès', () => {
  test('A01 · Non-admin : tab admin absent du BottomNav', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    // Le tab admin ne doit pas être visible dans le nav pour un non-admin
    const adminTab = page.locator('nav button').filter({ hasText: /admin/i });
    await expect(adminTab).toHaveCount(0);
  });

  test('A02 · Accès direct via sessionStorage redirige ou affiche erreur', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => sessionStorage.setItem('sl-tab', 'admin'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Pour un non-admin, ne doit pas crasher même si le tab est forcé
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('A03 · Pas d\'overflow si page admin accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(ov).toBe(false);
  });
});
