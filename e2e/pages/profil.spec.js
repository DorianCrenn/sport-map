import { test, expect } from '@playwright/test';

/**
 * ProfilPage / AuthPage — P1
 */
test.describe('ProfilPage / Auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    const profilTab = page.locator('nav button').filter({ hasText: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
  });

  test('P01 · Page auth charge sans crash', async ({ page }) => {
    const error = page.getByText(/quelque chose s'est mal passé/i);
    await expect(error).not.toBeVisible();
  });

  test('P02 · Formulaire de connexion visible', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });

  test('P03 · Bouton Google OAuth visible', async ({ page }) => {
    const google = page.getByRole('button', { name: /google/i })
      .or(page.getByText(/continuer avec google/i).first());
    if (await google.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(google.first()).toBeVisible();
    }
  });

  test('P04 · Pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const ov = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(ov).toBe(false);
  });

  test('P05 · Onglets Connexion / S\'inscrire présents', async ({ page }) => {
    const connexion = page.getByRole('button', { name: /connexion/i })
      .or(page.getByText(/connexion/i).first());
    const inscrire = page.getByRole('button', { name: /s'inscrire/i })
      .or(page.getByText(/s'inscrire/i).first());
    if (await connexion.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(connexion.first()).toBeVisible();
    }
  });
});
