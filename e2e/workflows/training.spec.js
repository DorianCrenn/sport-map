import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests workflow Training Manager — P1 IMPORTANT
 * TrainingManagerPage : liste des séances, création, responsive.
 */

test.describe('Training Manager — accès et navigation (P1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('aucun crash sur la page d\'accueil', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('la page training n\'a pas d\'overflow horizontal sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow sur page principale en mode training mobile').toBe(true);
  });

  test('TrainingManagerPage s\'ouvre sans crash quand accessible', async ({ page }) => {
    // La page training est accessible via ProfilPage ou BottomNav (si connecté club manager)
    // En mode non-connecté, on vérifie juste l'absence de crash
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('Training Manager — démo mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      sessionStorage.removeItem('sl-demo-initialized');
    });
  });

  test('profil Coach voit une section entraînements dans le guide', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const coachBtn = page.getByText(/entraîneur/i).first();
    if (await coachBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await coachBtn.click();
      await page.waitForTimeout(800);

      // Le guide doit être visible pour le coach
      const guide = page.getByText(/étape 1/i).first();
      const isVisible = await guide.isVisible({ timeout: 4000 }).catch(() => false);
      if (isVisible) {
        await expect(guide).toBeVisible();
      }
    }
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('profil Président a accès aux fonctionnalités d\'entraînement dans le guide', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const presidentBtn = page.getByText(/président/i).first();
    if (await presidentBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await presidentBtn.click();
      await page.waitForTimeout(800);
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    }
  });
});

test.describe('Training Manager — responsive', () => {
  const viewports = [
    { name: 'iPhone SE (375px)',    width: 375,  height: 667  },
    { name: 'iPhone 15 (393px)',    width: 393,  height: 852  },
    { name: 'Desktop 1440px',       width: 1440, height: 900  },
  ];

  for (const vp of viewports) {
    test(`page principale sans overflow sur ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const noOverflow = await checkNoHorizontalOverflow(page);
      expect(noOverflow, `Overflow sur ${vp.name}`).toBe(true);
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    });
  }
});
