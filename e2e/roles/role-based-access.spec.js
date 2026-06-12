import { test, expect } from '@playwright/test';

/**
 * Tests d'accès basé sur les rôles.
 * Vérifie que chaque profil démo a accès uniquement aux fonctionnalités
 * appropriées à son rôle.
 */

test.describe('Rôles démo — accès différenciés', () => {
  async function selectDemoProfile(page, profile) {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    // Mapper le label affiché sur la landing page
    const labels = {
      president:    'Président',
      coach:        'Entraîneur',
      communication:'Communicant',
      parent:       'Parent',
      player:       'Joueur',
      supporter:    'Supporter',
    };
    await page.getByText(labels[profile] ?? profile).click();
    await page.waitForTimeout(500);
  }

  test('Président — FAB visible avec actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'president');
    // FAB doit être visible
    const fab = page.locator('[data-demo="fab-add"]');
    await expect(fab).toBeVisible({ timeout: 5000 });
  });

  test('Coach — FAB visible', async ({ page }) => {
    await selectDemoProfile(page, 'coach');
    const fab = page.locator('[data-demo="fab-add"]');
    await expect(fab).toBeVisible({ timeout: 5000 });
  });

  test('Parent — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'parent');
    // Le guide ne doit pas mentionner "Créer un événement" ou "Tableau de bord"
    await expect(page.getByText('Tout le club, depuis votre canapé')).toBeVisible({ timeout: 5000 });
    // Pas de référence à des fonctionnalités admin dans les premières étapes
    await expect(page.getByText('Tableau de bord')).not.toBeVisible();
    await expect(page.getByText('Créer un événement')).not.toBeVisible();
  });

  test('Joueur — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'player');
    await expect(page.getByText('Votre espace joueur')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Tableau de bord')).not.toBeVisible();
  });

  test('Supporter — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'supporter');
    await expect(page.getByText('L\'actualité de votre club')).toBeVisible({ timeout: 5000 });
    // Pas d'étape de convocation ou de création d'événement
    await expect(page.getByText('Convoquer')).not.toBeVisible();
  });

  test('tous les tours se terminent sur un CTA', async ({ page }) => {
    const profiles = ['president', 'coach', 'parent', 'player', 'supporter'];
    for (const profile of profiles) {
      await selectDemoProfile(page, profile);
      // Avancer jusqu'au bout
      let attempts = 0;
      while (attempts < 15) {
        const nextBtn = page.getByRole('button', { name: /suivant|passer/i }).first();
        if (await nextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(200);
        } else {
          break;
        }
        attempts++;
      }
      // Le CTA final doit être visible
      const ctaBtn = page.getByRole('button', { name: /créer mon club/i });
      await expect(ctaBtn).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Bannière démo — présente sur /demo', () => {
  test('bannière "Démonstration SportLink" visible', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/démonstration sportlink/i)).toBeVisible({ timeout: 5000 });
  });

  test('bouton "Créer mon club" dans la bannière', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /créer mon club/i }).first()).toBeVisible({ timeout: 5000 });
  });
});
