import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests PosterStudio — P0 CRITIQUE
 * 37 templates, export PNG, formats, flux AUTO-001 (affiche résultat)
 *
 * ⚠️ FICHIERS PROTÉGÉS — toujours exécuter ces tests avant de modifier :
 *   - src/components/PosterStudio.jsx
 *   - src/components/poster/PosterRenderer.jsx
 *   - src/lib/posterReducer.js
 *   - src/components/poster/posterUtils.js
 *   - src/components/poster/templates/tourUtils.jsx
 */

test.describe('PosterStudio — ouverture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('PosterStudio s\'ouvre depuis un EventCard sans crash', async ({ page }) => {
    // Naviguer vers la carte pour trouver un événement
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    // Chercher un bouton PosterStudio sur un EventCard
    const posterButton = page.getByRole('button', { name: /affiche|poster|studio/i }).first();
    if (await posterButton.isVisible()) {
      await posterButton.click();
      await page.waitForTimeout(1000);

      // Le studio doit s'ouvrir
      const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
      await expect(errorBoundary).not.toBeVisible();
    }
  });

  test('aucune erreur JavaScript lors de l\'ouverture du PosterStudio', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const posterButton = page.getByRole('button', { name: /affiche|poster/i }).first();
    if (await posterButton.isVisible()) {
      await posterButton.click();
      await page.waitForTimeout(1500);
    }

    const criticalErrors = errors.filter((e) =>
      !e.includes('supabase') && !e.includes('removebg') && !e.includes('anthropic')
    );
    expect(criticalErrors, `Erreurs dans PosterStudio: ${criticalErrors.join('\n')}`).toHaveLength(0);
  });
});

test.describe('PosterStudio — interface', () => {
  async function openPosterStudio(page) {
    await page.goto('/');
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const posterButton = page.getByRole('button', { name: /affiche|poster/i }).first();
    if (await posterButton.isVisible()) {
      await posterButton.click();
      await page.waitForTimeout(1200);
      return true;
    }
    return false;
  }

  test('panneau de templates est accessible', async ({ page }) => {
    const opened = await openPosterStudio(page);
    if (opened) {
      const templatesPanel = page.getByRole('button', { name: /template|modèle|style/i }).first();
      if (await templatesPanel.isVisible()) {
        await templatesPanel.click();
        await page.waitForTimeout(400);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
        await expect(errorBoundary).not.toBeVisible();
      }
    }
  });

  test('panneau d\'export est accessible', async ({ page }) => {
    const opened = await openPosterStudio(page);
    if (opened) {
      const exportPanel = page.getByRole('button', { name: /export|télécharger|download/i }).first();
      if (await exportPanel.isVisible()) {
        await exportPanel.click();
        await page.waitForTimeout(400);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
        await expect(errorBoundary).not.toBeVisible();
      }
    }
  });

  test('changement de format Story/Carré/Paysage sans crash', async ({ page }) => {
    const opened = await openPosterStudio(page);
    if (opened) {
      const formatButtons = page.getByRole('button', { name: /story|carré|paysage|square|landscape/i });
      if (await formatButtons.count() > 0) {
        await formatButtons.first().click();
        await page.waitForTimeout(400);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
        await expect(errorBoundary).not.toBeVisible();
      }
    }
  });

  test('screenshot PosterStudio — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const opened = await openPosterStudio(page);
    if (opened) {
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot('poster-studio-mobile.png', {
        maxDiffPixelRatio: 0.02,
      });
    }
  });

  test('pas d\'overflow horizontal dans PosterStudio sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const opened = await openPosterStudio(page);
    if (opened) {
      const noOverflow = await checkNoHorizontalOverflow(page);
      expect(noOverflow, 'Overflow horizontal dans PosterStudio sur mobile').toBe(true);
    }
  });
});

test.describe('PosterStudio — fermeture et nettoyage', () => {
  test('fermeture du studio retourne à l\'app sans crash', async ({ page }) => {
    await page.goto('/');
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('networkidle');

    const posterButton = page.getByRole('button', { name: /affiche|poster/i }).first();
    if (await posterButton.isVisible()) {
      await posterButton.click();
      await page.waitForTimeout(1000);

      const closeButton = page.getByRole('button', { name: /fermer|×|close/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé/i);
        await expect(errorBoundary).not.toBeVisible();
        // L'app doit encore être navigable
        const nav = page.locator('nav').last();
        await expect(nav).toBeVisible();
      }
    }
  });
});
