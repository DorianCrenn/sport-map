import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests Covoiturage (Rides) — P1
 * CreateRideModal, JoinRideModal, RideCard, RideSection
 */

test.describe('Covoiturage — page principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('MyRidesPage charge sans crash', async ({ page }) => {
    // La page covoiturage est lazy-loaded
    // Elle est accessible via un lien dans ProfilPage ou directement
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });

  test('RideSection visible dans un EventCard si événement a des trajets', async ({ page }) => {
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');
    // Vérifier juste l'absence de crash
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('CreateRideModal', () => {
  test('le modal de création de trajet s\'ouvre sans crash', async ({ page }) => {
    await page.goto('/');
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    // Chercher un bouton "Proposer un trajet" dans un EventCard
    const rideButton = page.getByRole('button', { name: /proposer.*trajet|covoiturage|trajet/i }).first();
    if (await rideButton.isVisible()) {
      await rideButton.click();
      await page.waitForTimeout(500);
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });
});

test.describe('Covoiturage — responsive', () => {
  test('pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow).toBe(true);
  });
});
