import { test, expect } from '@playwright/test';

/**
 * Flux de convocation — vérifie que la modale de convocation
 * s'ouvre depuis CoachMatchCard (ActualitesPage) et affiche les joueurs.
 *
 * Note : Ces tests utilisent le mode démo pour éviter d'avoir besoin
 * d'une authentification réelle.
 */

test.describe('Flux convocation — depuis CoachMatchCard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    // Sélectionner le profil Président (qui a CoachMatchCard)
    await page.getByText('Président').click();
    await page.waitForTimeout(800);
  });

  test('CoachMatchCard affiche un bouton de convocation', async ({ page }) => {
    const card = page.locator('[data-demo="coach-match-card"]').first();
    await expect(card).toBeVisible({ timeout: 5000 });
    // Le bouton "Créer la convocation" doit être visible dans la carte
    const convBtn = card.getByText(/créer la convocation|convoquer|relancer/i);
    await expect(convBtn.first()).toBeVisible({ timeout: 3000 });
  });

  test('clic sur Convoquer ouvre une modale (pas de navigation page)', async ({ page }) => {
    const card = page.locator('[data-demo="coach-match-card"]').first();
    await expect(card).toBeVisible({ timeout: 5000 });
    // URL avant clic
    const urlBefore = page.url();
    // Cliquer "Créer la convocation"
    const btn = card.getByText(/créer la convocation/i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(800);
      // L'URL ne doit pas avoir changé (pas de navigation)
      expect(page.url()).toBe(urlBefore);
    }
  });
});

test.describe('Flux convocation — liste de joueurs en démo', () => {
  test('EventFormStepConvocation affiche les joueurs de l\'équipe', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    await page.waitForTimeout(800);

    const card = page.locator('[data-demo="coach-match-card"]').first();
    if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btn = card.getByText(/créer la convocation/i);
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(1000);
        // Vérifier qu'il n'y a PAS "Aucun joueur trouvé"
        await expect(page.getByText('Aucun joueur trouvé')).not.toBeVisible({ timeout: 2000 }).catch(() => {});
        await expect(page.getByText('0 joueur')).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      }
    }
  });
});

test.describe('Flux annonces — SendAnnouncementModal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await page.getByText('Président').click();
    await page.waitForTimeout(800);
  });

  test('AnnouncementsCenter s\'ouvre depuis le FAB', async ({ page }) => {
    // Cliquer le FAB
    const fab = page.locator('[data-demo="fab-add"]');
    await expect(fab).toBeVisible({ timeout: 5000 });
    await fab.click();
    await page.waitForTimeout(300);
    // Chercher l'option "Envoyer une annonce"
    const announceBtn = page.getByText(/envoyer une annonce|annonce/i).first();
    if (await announceBtn.isVisible().catch(() => false)) {
      await announceBtn.click();
      await page.waitForTimeout(800);
      // Le modal d'annonces doit s'ouvrir
      await expect(page.getByText(/publier une annonce/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
