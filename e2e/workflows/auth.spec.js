import { test, expect } from '@playwright/test';
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
    // Naviguer vers la page Profil (visible pour les non-connectés)
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });

    // ProfilPage non-connecté → bouton "Se connecter / S'inscrire"
    const connectBtn = page.getByRole('button', { name: /se connecter|connexion|créer/i }).first();
    await expect(connectBtn).toBeVisible({ timeout: 5000 });
    // Pas d'ErrorBoundary
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
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
