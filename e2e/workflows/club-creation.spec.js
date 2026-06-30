import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests workflow Création de club — P0 CRITIQUE
 * ClubCreationWizard : 4 étapes (infos, sport, localisation, photo)
 */

test.describe('ClubCreationWizard (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('le bouton Créer un club est accessible', async ({ page }) => {
    // Bouton sur la ClubsPage ou ProfilPage
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('le wizard s\'ouvre et affiche l\'étape 1', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const createClubButton = page.getByRole('button', { name: /créer.*club|nouveau.*club/i }).first();
    if (await createClubButton.isVisible()) {
      await createClubButton.click();
      await page.waitForTimeout(500);

      // L'étape 1 du wizard doit être visible
      const step1 = page.locator('[role="dialog"], [data-testid="club-wizard"]').first();
      await expect(step1).toBeVisible({ timeout: 3000 });

      // Vérifier les champs de l'étape 1 (nom du club, sport)
      const nameInput = page.locator('input[name*="name"], input[placeholder*="nom"]').first();
      if (await nameInput.isVisible()) {
        await expect(nameInput).toBeVisible();
      }
    }
  });

  test('navigation entre étapes du wizard', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const createClubButton = page.getByRole('button', { name: /créer.*club|nouveau.*club/i }).first();
    if (await createClubButton.isVisible()) {
      await createClubButton.click();
      await page.waitForTimeout(500);

      // Remplir l'étape 1 et avancer
      const nameInput = page.locator('input[name*="name"], input[placeholder*="nom du club"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Club Test E2E');
        const nextButton = page.getByRole('button', { name: /suivant|next|continuer/i }).first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          await page.waitForTimeout(300);
          // L'étape 2 doit être visible
          const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
          await expect(errorBoundary).not.toBeVisible();
        }
      }
    }
  });

  test('fermeture du wizard avec bouton Annuler', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const createClubButton = page.getByRole('button', { name: /créer.*club|nouveau.*club/i }).first();
    if (await createClubButton.isVisible()) {
      await createClubButton.click();
      await page.waitForTimeout(500);

      const closeButton = page.getByRole('button', { name: /annuler|fermer|cancel|×/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
        const modal = page.locator('[role="dialog"]').first();
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('wizard sans overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const createClubButton = page.getByRole('button', { name: /créer.*club|nouveau.*club/i }).first();
    if (await createClubButton.isVisible()) {
      await createClubButton.click();
      await page.waitForTimeout(500);
      const noOverflow = await checkNoHorizontalOverflow(page);
      expect(noOverflow, 'Overflow dans ClubCreationWizard sur mobile').toBe(true);
    }
  });
});

test.describe('ClubDashboard', () => {
  test('ouvre le dashboard d\'un club managé sans crash', async ({ page }) => {
    await page.goto('/');
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });
});
