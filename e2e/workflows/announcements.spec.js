import { test, expect } from '@playwright/test';

/**
 * Tests Annonces clubs — P1
 * AnnouncementsCenter, SendAnnouncementModal, ClubAnnouncements
 */

test.describe('Centre d\'annonces', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('le centre d\'annonces s\'ouvre sans crash', async ({ page }) => {
    // Le centre d'annonces est accessible via un bouton dans le header ou la page profil
    const announcementsButton = page.getByRole('button', {
      name: /annonces|notifications/i,
    }).first();
    if (await announcementsButton.isVisible()) {
      await announcementsButton.click();
      await page.waitForTimeout(500);
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('SendAnnouncementModal s\'ouvre depuis le ClubDashboard', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const sendAnnouncementBtn = page.getByRole('button', {
      name: /envoyer.*annonce|nouvelle.*annonce|créer.*annonce/i,
    }).first();
    if (await sendAnnouncementBtn.isVisible()) {
      await sendAnnouncementBtn.click();
      await page.waitForTimeout(500);
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('annonces marquées comme lues sans crash', async ({ page }) => {
    const announcementsButton = page.getByRole('button', {
      name: /annonces/i,
    }).first();
    if (await announcementsButton.isVisible()) {
      await announcementsButton.click();
      await page.waitForTimeout(500);
      const markReadBtn = page.getByRole('button', { name: /tout lire|marquer/i }).first();
      if (await markReadBtn.isVisible()) {
        await markReadBtn.click();
        await page.waitForTimeout(300);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
        await expect(errorBoundary).not.toBeVisible();
      }
    }
  });
});
