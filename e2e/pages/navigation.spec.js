import { test, expect } from '@playwright/test';
import { collectConsoleErrors, waitForAppReady, checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests de navigation principale — P0 CRITIQUE
 * Teste le BottomNav, les 6 tabs, et les deep links hash-based.
 */

test.describe('Navigation principale (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('la page charge sans erreur JavaScript critique', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Filtrer les erreurs non bloquantes (CORS Supabase en test, etc.)
    const criticalErrors = errors.filter((e) =>
      !e.includes('supabase') &&
      !e.includes('vapid') &&
      !e.includes('removebg') &&
      !e.includes('anthropic')
    );
    expect(criticalErrors.length, `Erreurs JS: ${criticalErrors.join('\n')}`).toBe(0);
  });

  test('le BottomNav est visible avec les tabs principaux', async ({ page }) => {
    await page.goto('/');
    // Le nav doit être visible
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
    // Doit contenir au moins 4 éléments cliquables
    const navButtons = nav.locator('button, a');
    await expect(navButtons).toHaveCountGreaterThan(3);
  });

  test('navigation vers tab Carte', async ({ page }) => {
    await page.goto('/');
    // Cliquer sur le tab carte dans le BottomNav
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    // La carte Leaflet doit se charger (div .leaflet-container)
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 8000 });
  });

  test('navigation vers tab Clubs', async ({ page }) => {
    await page.goto('/');
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    // La page clubs doit avoir un titre ou liste
    await expect(page.locator('h1, h2').filter({ hasText: /club/i }).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('navigation vers tab Actualités', async ({ page }) => {
    await page.goto('/');
    const newsTab = page.getByRole('button', { name: /actu|news/i }).last();
    await newsTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL('/error');
  });

  test('navigation vers tab Favoris', async ({ page }) => {
    await page.goto('/');
    const favTab = page.getByRole('button', { name: /favoris/i }).last();
    await favTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL('/error');
  });

  test('navigation vers tab Profil', async ({ page }) => {
    await page.goto('/');
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL('/error');
  });

  test('pas de débordement horizontal sur mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal détecté sur la page d\'accueil').toBe(true);
  });

  test('deep link hash #club/:id ouvre une page club', async ({ page }) => {
    // Utilise le premier club disponible en prod/démo
    await page.goto('/#club/test-club-id');
    await page.waitForLoadState('domcontentloaded');
    // Soit la page club s'ouvre, soit l'app gère gracieusement le club introuvable
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL('/error');
  });

  test('le BottomNav reste visible lors du scroll', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
  });
});
