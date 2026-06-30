import { test, expect } from '@playwright/test';

/**
 * AdminAnalyticsPage — dashboard analytics Chart.js
 * Vérifie la protection d'accès et l'absence de crash au chargement.
 * Les données réelles ne sont pas disponibles en env local sans auth admin.
 */
test.describe('AdminAnalyticsPage — protection & rendu', () => {
  test('AA01 · Non-admin : tab admin absent du BottomNav', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const adminTab = page.locator('nav button').filter({ hasText: /admin/i });
    await expect(adminTab).toHaveCount(0);
  });

  test('AA02 · Forcer adminSubView=analytics ne provoque pas de crash', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      sessionStorage.setItem('sl-tab', 'admin');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('AA03 · Pas d\'overflow horizontal sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
    expect(ov).toBe(false);
  });

  test('AA04 · Pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 2);
    expect(ov).toBe(false);
  });

  test('AA05 · Aucune erreur JS fatale au chargement', async ({ page }) => {
    const errors = [];
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

  test('AA06 · Le ConsentBanner ou son absence ne crashe pas', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    // Le banner peut être absent (consentement déjà donné en localStorage)
    // Mais sa présence ne doit pas bloquer le rendu
    const appRoot = page.locator('#root');
    await expect(appRoot).not.toBeEmpty();
  });
});
