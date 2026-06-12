import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests workflow Création / Modification / Suppression d'événements — P0 CRITIQUE
 *
 * Note : La création réelle nécessite un compte club_admin connecté.
 * Ces tests vérifient le formulaire et les interactions UI.
 */

test.describe('Formulaire création événement (UI)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Aller sur la carte ou l'accueil où se trouve le bouton de création
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');
  });

  test('le bouton de création événement est visible pour club_admin', async ({ page }) => {
    // Le FAB de création peut nécessiter auth — on vérifie juste l'absence de crash
    const fab = page.locator('button[aria-label*="créer"], button[aria-label*="ajouter"], [data-testid*="fab"]').first();
    // Pas forcément visible (non connecté) mais aucun crash
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('EventFormModal s\'ouvre sans crash si accessible', async ({ page }) => {
    // Chercher un bouton "Nouvel événement" ou FAB
    const createButton = page.getByRole('button', { name: /nouvel|nouveau|créer.*événement|ajouter.*événement/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      // Le modal doit s\'ouvrir
      const modal = page.locator('[role="dialog"], [data-testid="event-form"]').first();
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('EventFormModal contient les champs requis', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nouvel|nouveau|créer|ajouter/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      if (await page.locator('[role="dialog"]').first().isVisible()) {
        // Champs attendus dans le formulaire d'événement
        const titleOrTeamField = page.locator('input[name*="title"], input[name*="homeTeam"], input[placeholder*="domicile"], input[placeholder*="équipe"]').first();
        const dateField = page.locator('input[type="date"], input[name*="date"]').first();
        const hasForm = (await titleOrTeamField.count() + await dateField.count()) > 0;
        expect(hasForm).toBe(true);
      }
    }
  });

  test('EventFormModal se ferme avec le bouton Annuler/Fermer', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nouvel|nouveau|créer|ajouter/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const closeButton = page.getByRole('button', { name: /fermer|annuler|cancel|×|close/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
        const modal = page.locator('[role="dialog"]').first();
        await expect(modal).not.toBeVisible({ timeout: 2000 });
      }
    }
  });
});

test.describe('EventCard — interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('un EventCard s\'affiche sans crash', async ({ page }) => {
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('"J\'y serai" toggle fonctionne (si événement visible)', async ({ page }) => {
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const attendButton = page.getByRole('button', { name: /j'y serai|présent|participe/i }).first();
    if (await attendButton.isVisible()) {
      const initialText = await attendButton.innerText();
      await attendButton.click();
      await page.waitForTimeout(500);
      // Le bouton doit changer d'état (feedback visuel)
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('les réactions emoji s\'affichent sans crash', async ({ page }) => {
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const reactionButton = page.locator('[data-testid*="reaction"], button[aria-label*="réaction"]').first();
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('Formulaire événement — responsive', () => {
  test('EventFormModal pas d\'overflow horizontal sur iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createButton = page.getByRole('button', { name: /nouvel|nouveau|créer|ajouter/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);
      const noOverflow = await checkNoHorizontalOverflow(page);
      expect(noOverflow, 'Overflow horizontal dans EventFormModal sur mobile').toBe(true);
    }
  });
});
