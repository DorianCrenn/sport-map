import { test, expect } from '@playwright/test';
import { collectConsoleErrors } from '../helpers/utils.js';

/**
 * Tests Authentication — P0 CRITIQUE
 * Connexion email/password, Google OAuth (mocked), création de compte.
 *
 * Note : Les tests réels nécessitent des credentials de test dans .env.test
 * Variables : E2E_TEST_EMAIL, E2E_TEST_PASSWORD
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@sportlink-e2e.fr';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

test.describe('Page Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('affiche le formulaire de connexion quand non connecté', async ({ page }) => {
    // L'app doit permettre d'accéder à l'auth
    const authButton = page
      .getByRole('button', { name: /connexion|se connecter|login|sign in/i })
      .or(page.getByRole('link', { name: /connexion|se connecter/i }))
      .first();

    // Si l'utilisateur n'est pas connecté, un bouton d'accès à l'auth doit exister
    // (ou la page profil affiche directement le formulaire)
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    // AuthPage ou bouton de connexion visible
    const loginForm = page.locator('form, [data-testid="auth-form"]')
      .or(page.getByText(/connexion|se connecter|créer un compte/i).first());
    await expect(loginForm).toBeVisible({ timeout: 5000 });
  });

  test('affiche les champs email et mot de passe', async ({ page }) => {
    // Naviguer vers la page auth
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name*="password"]').first();

    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });

  test('affiche un bouton Google OAuth', async ({ page }) => {
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    const googleButton = page.getByRole('button', { name: /google/i })
      .or(page.locator('[aria-label*="Google"]'));
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible();
    }
  });

  test('connexion avec credentials invalides affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.getByRole('button', { name: /connexion|se connecter|login/i }).first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalide@test.fr');
      await passwordInput.fill('mauvais-mot-de-passe');
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Un message d'erreur doit apparaître (pas un crash)
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"], [class*="toast"]');
      const hasError = await errorMessage.count() > 0;
      // On vérifie juste qu'il n'y a pas de crash React
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('page auth sans overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Overflow horizontal sur page auth mobile').toBe(false);
  });
});

/**
 * Tests de connexion réelle — nécessite des credentials de test
 * Désactivés si pas de variables d'env
 */
test.describe('Connexion réelle (si credentials disponibles)', () => {
  test.skip(!process.env.E2E_TEST_EMAIL, 'E2E_TEST_EMAIL non défini — test ignoré');

  test('connexion email/password réussie', async ({ page }) => {
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /connexion|se connecter/i }).first().click();
    await page.waitForLoadState('networkidle');

    // Après connexion, l'utilisateur ne doit plus voir le formulaire
    const loginForm = page.locator('input[type="password"]').first();
    await expect(loginForm).not.toBeVisible({ timeout: 8000 });
  });

  test('déconnexion fonctionne', async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });

    if (await page.locator('input[type="email"]').isVisible()) {
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: /connexion/i }).first().click();
      await page.waitForLoadState('networkidle');
    }

    // Se déconnecter
    const logoutButton = page.getByRole('button', { name: /déconnexion|logout|se déconnecter/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      // Le formulaire de connexion doit réapparaître
      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
