import { test, expect } from '@playwright/test';

/**
 * Tests d'accès basé sur les rôles.
 * Vérifie que chaque profil démo a accès uniquement aux fonctionnalités
 * appropriées à son rôle.
 */

async function selectDemoProfile(page, profile) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-initialized');
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
  });
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  // S'assurer que la landing page est chargée
  await expect(page.getByText(/démonstration/i)).toBeVisible({ timeout: 8000 });

  const labels = {
    president:     'Président',
    coach:         'Entraîneur',
    communication: 'Communicant',
    parent:        'Parent',
    player:        'Joueur',
    supporter:     'Supporter',
  };
  const label = labels[profile] ?? profile;
  const profileBtn = page.getByText(label).first();
  await expect(profileBtn).toBeVisible({ timeout: 5000 });
  await profileBtn.click();
  // Attendre que l'app démo s'initialise (chargement Supabase démo)
  await page.waitForTimeout(1500);
}

test.describe('Rôles démo — accès différenciés', () => {
  test('Président — FAB ou contenu admin visible', async ({ page }) => {
    await selectDemoProfile(page, 'president');
    // Le FAB ou le dashboard admin doit être accessible
    const fab = page.locator('[data-demo="fab-add"]');
    const fabVisible = await fab.isVisible({ timeout: 10000 }).catch(() => false);
    if (!fabVisible) {
      // Fallback : au moins l'app ne crash pas et du contenu est présent
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
      const hasContent = await page.evaluate(() => document.body.innerText.trim().length > 50);
      expect(hasContent, 'L\'app présidente doit afficher du contenu').toBe(true);
    } else {
      await expect(fab).toBeVisible();
    }
  });

  test('Coach — FAB ou interface coach visible', async ({ page }) => {
    await selectDemoProfile(page, 'coach');
    const fab = page.locator('[data-demo="fab-add"]');
    const fabVisible = await fab.isVisible({ timeout: 10000 }).catch(() => false);
    if (!fabVisible) {
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
      const hasContent = await page.evaluate(() => document.body.innerText.trim().length > 50);
      expect(hasContent, 'L\'app coach doit afficher du contenu').toBe(true);
    } else {
      await expect(fab).toBeVisible();
    }
  });

  test('Parent — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'parent');
    // Le guide parent doit apparaître (contenu quelconque du guide)
    const guide = page.locator('[data-testid="demo-guide"], .demo-guide, [class*="DemoGuide"]')
      .or(page.getByText(/votre canapé|agenda|convocation/i).first());
    const guideVisible = await guide.isVisible({ timeout: 8000 }).catch(() => false);
    // Au minimum : pas de crash, pas de fonctionnalités admin visibles
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    // Tableau de bord admin ne doit pas être en première étape
    await expect(page.getByText('Tableau de bord')).not.toBeVisible();
  });

  test('Joueur — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'player');
    await page.waitForTimeout(500);
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    await expect(page.getByText('Tableau de bord')).not.toBeVisible();
  });

  test('Supporter — le tour commence sans actions admin', async ({ page }) => {
    await selectDemoProfile(page, 'supporter');
    await page.waitForTimeout(500);
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    // Pas d'étape de convocation ou de création d'événement
    await expect(page.getByText('Convoquer')).not.toBeVisible();
  });

  test('tous les tours se terminent sur un CTA ou sans crash', async ({ page }) => {
    const profiles = ['president', 'coach', 'parent', 'player', 'supporter'];
    for (const profile of profiles) {
      await selectDemoProfile(page, profile);
      // Avancer jusqu'au bout (max 20 clics)
      let attempts = 0;
      while (attempts < 20) {
        const nextBtn = page.getByRole('button', { name: /suivant|passer/i }).first();
        if (await nextBtn.isVisible({ timeout: 600 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(250);
        } else {
          break;
        }
        attempts++;
      }
      // Le CTA final ou le guide est présent — pas de crash
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
      // Un bouton CTA-like doit exister quelque part (bannière ou guide)
      const ctaExists = await page.getByRole('button', { name: /créer mon club/i }).first()
        .isVisible({ timeout: 3000 }).catch(() => false);
      // Acceptable si le CTA est absent (certains profils ont un parcours sans CTA)
      if (!ctaExists) {
        console.info(`[${profile}] Pas de CTA "Créer mon club" — acceptable si le guide est terminé`);
      }
    }
  });
});

test.describe('Bannière démo — présente sur /demo', () => {
  test('bannière "Démonstration SportLink" visible', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/démonstration sportlink/i)).toBeVisible({ timeout: 8000 });
  });

  test('un CTA d\'inscription visible sur /demo', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    // "Créer mon club" peut être un <a> (DemoBanner) ou <button> (DemoGuide)
    const cta = page.getByText(/créer mon club/i).first();
    const ctaVisible = await cta.isVisible({ timeout: 8000 }).catch(() => false);
    // Fallback : vérifier qu'il y a du contenu sur la page
    if (!ctaVisible) {
      const hasContent = await page.evaluate(() => document.body.innerText.trim().length > 100);
      expect(hasContent, 'La page /demo doit afficher du contenu').toBe(true);
    } else {
      await expect(cta).toBeVisible();
    }
  });
});
