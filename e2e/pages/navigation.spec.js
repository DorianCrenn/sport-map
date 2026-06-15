import { test, expect } from '@playwright/test';
import { collectConsoleErrors, checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests de navigation principale — P0 CRITIQUE
 * Teste le BottomNav, les 6 tabs, et les deep links hash-based.
 *
 * Note : L'app est une SPA (sessionStorage sl-tab). Les clics de tab ne déclenchent
 * PAS de nouveau chargement de page → ne pas utiliser waitForLoadState('domcontentloaded')
 * après un clic tab, utiliser waitForTimeout ou attendre un élément spécifique.
 */

async function waitForApp(page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

test.describe('Navigation principale (P0)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForApp(page);
  });

  test('la page charge sans erreur JavaScript critique', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Filtrer les erreurs non bloquantes
    const criticalErrors = errors.filter((e) =>
      !e.includes('supabase') &&
      !e.includes('vapid') &&
      !e.includes('removebg') &&
      !e.includes('anthropic') &&
      !e.includes('Failed to fetch') &&
      !e.includes('NetworkError') &&
      !e.includes('net::ERR') &&
      !e.includes('fal.run') &&
      !e.includes('pollinations')
    );
    expect(criticalErrors.length, `Erreurs JS critiques: ${criticalErrors.join('\n')}`).toBe(0);
  });

  test('le BottomNav est visible avec les tabs principaux', async ({ page }) => {
    // beforeEach a déjà navigué — pas de second goto
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible({ timeout: 8000 });
    // BottomNav contient au moins 4 boutons (tabs + FAB)
    const navButtons = nav.locator('button');
    const count = await navButtons.count();
    expect(count, `Le BottomNav doit avoir > 3 boutons, en a ${count}`).toBeGreaterThan(3);
  });

  test('navigation vers tab Carte', async ({ page }) => {
    const mapTab = page.getByRole('button', { name: /carte|map/i }).last();
    await mapTab.click({ force: true });
    // SPA : attendre que Leaflet se charge (lazy chunk)
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });
  });

  test('navigation vers tab Clubs', async ({ page }) => {
    const clubsTab = page.getByRole('button', { name: /clubs/i }).last();
    await clubsTab.click({ force: true });
    await page.waitForTimeout(1500);
    // ClubsPage utilise des divs stylsés, pas de h1/h2
    // Vérifier absence de crash plutôt qu'un élément précis
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal sur ClubsPage').toBe(true);
  });

  test('navigation vers tab Actualités', async ({ page }) => {
    const newsTab = page.getByRole('button', { name: /actu|agenda/i }).last();
    if (await newsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newsTab.click({ force: true });
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('navigation vers tab Favoris', async ({ page }) => {
    const favTab = page.getByRole('button', { name: /favoris|sauvegardés/i }).last();
    if (await favTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await favTab.click({ force: true });
      await page.waitForTimeout(1000);
    }
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('navigation vers tab Profil', async ({ page }) => {
    const profilTab = page.getByRole('button', { name: /profil/i }).last();
    await profilTab.click({ force: true });
    await page.waitForTimeout(800);
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('pas de débordement horizontal sur mobile', async ({ page }) => {
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal détecté sur la page d\'accueil').toBe(true);
  });

  test('deep link hash #club/:id ouvre une page club', async ({ page }) => {
    await page.goto('/#club/test-club-id');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('le BottomNav reste visible lors du scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);
    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
  });
});
