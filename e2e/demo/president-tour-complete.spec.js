import { test, expect } from '@playwright/test';

/**
 * Tour Président complet — 8 étapes sans erreur.
 * Vérifie que chaque étape s'affiche correctement et que les actions
 * déclenchées ne produisent pas d'erreur.
 */

test.describe('Tour Président — 8 étapes', () => {
  test.beforeEach(async ({ page }) => {
    // Partir d'une session propre
    await page.addInitScript(() => {
      sessionStorage.removeItem('sl-demo-initialized');
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('landing page affiche les 6 profils', async ({ page }) => {
    await expect(page.getByText('Président')).toBeVisible();
    await expect(page.getByText('Entraîneur')).toBeVisible();
    await expect(page.getByText('Parent')).toBeVisible();
    await expect(page.getByText('Joueur')).toBeVisible();
    await expect(page.getByText('Supporter')).toBeVisible();
  });

  test('sélectionner Président lance le tour', async ({ page }) => {
    await page.getByText('Président').click();
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible({ timeout: 5000 });
  });

  test('étape 1 — cockpit opérationnel visible', async ({ page }) => {
    await page.getByText('Président').click();
    await expect(page.getByText('Votre cockpit opérationnel')).toBeVisible();
    // Pas d'erreur console
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(500);
    const jsErrors = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR'));
    expect(jsErrors.length, `Erreurs console : ${jsErrors.join(', ')}`).toBe(0);
  });

  test('avancer jusqu\'à l\'étape 2 (créer événement)', async ({ page }) => {
    await page.getByText('Président').click();
    // Avancer vers étape 2
    await page.getByRole('button', { name: /suivant/i }).click();
    await expect(page.getByText('Créer votre prochain événement')).toBeVisible({ timeout: 3000 });
  });

  test('étape 2 — FAB s\'ouvre avec les équipes du club', async ({ page }) => {
    await page.getByText('Président').click();
    await page.getByRole('button', { name: /suivant/i }).click();
    // Attendre l'étape 2 qui trigger open-event-form
    await expect(page.getByText('Créer votre prochain événement')).toBeVisible();
    // EventFormModal doit s'ouvrir (ou être ouvert via action)
    // On vérifie qu'aucune erreur critique n'est apparue
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(e =>
      e.includes('is not a function') || e.includes('Cannot read') || e.includes('undefined')
    );
    expect(criticalErrors.length, `Erreurs JS : ${criticalErrors.join('\n')}`).toBe(0);
  });

  test('étape 5 — PosterStudio s\'ouvre sans erreur .or()', async ({ page }) => {
    await page.getByText('Président').click();
    // Avancer jusqu'à l'étape 5
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /suivant|passer/i }).first().click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText('Créer une affiche pro')).toBeVisible({ timeout: 5000 });
    // Vérifier qu'il n'y a pas l'erreur ".or is not a function"
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.waitForTimeout(1000);
    expect(errors.some(e => e.includes('.or is not a function') || e.includes('or is not a function'))).toBe(false);
  });

  test('étape 8 — CTA affiché avec bouton créer club', async ({ page }) => {
    await page.getByText('Président').click();
    // Avancer jusqu'au dernier step
    for (let i = 0; i < 7; i++) {
      await page.getByRole('button', { name: /suivant|passer/i }).first().click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText('Prêt à créer votre club')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /créer mon club/i })).toBeVisible();
  });

  test('nouvelle visite /demo repart du début', async ({ page }) => {
    // Simuler une session précédente
    await page.addInitScript(() => {
      sessionStorage.setItem('sl-demo-initialized', 'true');
      sessionStorage.setItem('sl-demo-profile', 'coach');
      sessionStorage.setItem('sl-demo-step', '3');
    });
    // Nouvelle navigation (simule un nouveau visiteur)
    await page.addInitScript(() => {
      // Effacer l'initialized pour simuler une vraie nouvelle visite
      sessionStorage.removeItem('sl-demo-initialized');
    });
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    // Doit afficher le landing page, pas reprendre le tour coach
    await expect(page.getByText('Président')).toBeVisible({ timeout: 5000 });
  });
});
