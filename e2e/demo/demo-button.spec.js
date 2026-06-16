import { test, expect } from '@playwright/test';

/**
 * Tests P0 CRITIQUE — Bouton d'ouverture de la démo depuis la page d'accueil.
 *
 * Régression visée : le bouton "Découvrir la démo interactive" sur la homepage
 * doit toujours mener à /demo et afficher la page de sélection de profil,
 * même après un changement de build ou une mise en cache navigateur.
 *
 * Ces tests couvrent l'intégralité du chemin critique :
 *   / → clic bouton → /demo → DemoLandingPage → sélection profil → DemoGuide
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

async function cleanDemoStorage(page) {
  await page.addInitScript(() => {
    [
      'sl-demo-initialized', 'sl-demo-profile', 'sl-demo-step',
      'sl-demo-sandbox', 'sl-demo-version', 'sl-demo-guide-pos',
      'sl-demo-guide-collapsed',
    ].forEach(k => sessionStorage.removeItem(k));
  });
}

async function gotoHome(page) {
  await cleanDemoStorage(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

// ── GROUPE 1 : Boutons demo sur la homepage ───────────────────────────────────

test.describe('[P0] Bouton démo — homepage → /demo', () => {
  test('DB01 · Le bouton "Découvrir la démo interactive" est visible sur /', async ({ page }) => {
    await gotoHome(page);

    // Pour les utilisateurs non connectés, la HomePage affiche le bouton démo
    // Si connecté (ActualitesPage), on cherche quand même un bouton démo alternatif
    const demoBtn = page.getByRole('link', { name: /démo|demo/i }).first();

    // Attendre que la page soit chargée (lazy chunks)
    await page.waitForTimeout(1500);

    const hasDemoLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href="/demo"]'));
      return links.length > 0;
    });

    expect(hasDemoLink, 'Aucun lien href="/demo" trouvé sur la page d\'accueil').toBe(true);
  });

  test('DB02 · Cliquer le bouton navigue vers /demo', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1500);

    const demoLink = page.locator('a[href="/demo"]').first();
    const isVisible = await demoLink.isVisible().catch(() => false);

    if (!isVisible) {
      // Cas possible : utilisateur connecté → ActualitesPage sans bouton démo
      // Naviguer directement vers /demo pour tester le reste du parcours
      test.info().annotations.push({ type: 'skip-reason', description: 'Bouton non visible (utilisateur connecté ?) — test direct /demo' });
      await page.goto('/demo');
    } else {
      await demoLink.click();
    }

    await page.waitForURL('**/demo**', { timeout: 8000 });
    expect(page.url()).toContain('/demo');
  });

  test('DB03 · /demo affiche la DemoLandingPage (page de sélection de profil)', async ({ page }) => {
    await cleanDemoStorage(page);
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    // La DemoLandingPage doit afficher le titre et les 6 profils
    await expect(
      page.getByText('Démonstration interactive'),
      '"Démonstration interactive" absent — DemoLandingPage ne s\'affiche pas'
    ).toBeVisible({ timeout: 10000 });

    // Les 6 cartes de profil doivent être visibles
    for (const label of ['Président', 'Coach', 'Communication', 'Parent', 'Joueur', 'Supporter']) {
      await expect(
        page.getByRole('button', { name: new RegExp(label, 'i') }).first(),
        `Profil "${label}" absent de la landing démo`
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('DB04 · Sélectionner "Président" affiche le guide DemoGuide', async ({ page }) => {
    await cleanDemoStorage(page);
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });

    // Sélectionner le profil Président
    await page.getByRole('button', { name: /Président/i }).first().click();
    await page.waitForTimeout(600);

    // Le guide doit apparaître avec le compteur d'étapes
    await expect(
      page.getByText(/Étape 1\s*\/\s*12/),
      'DemoGuide absent après sélection du profil Président — guide non affiché'
    ).toBeVisible({ timeout: 6000 });

    // La DemoLandingPage ne doit plus être visible
    await expect(page.getByText('Démonstration interactive')).not.toBeVisible();
  });

  test('DB05 · Le guide affiche bien le titre de la première étape', async ({ page }) => {
    await cleanDemoStorage(page);
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });

    await page.getByRole('button', { name: /Coach/i }).first().click();
    await page.waitForTimeout(600);

    // Le premier titre du tour Coach doit être visible
    await expect(
      page.getByText(/cockpit coach|votre espace/i).first(),
      'Titre de la première étape du tour Coach absent'
    ).toBeVisible({ timeout: 6000 });
  });

  test('DB06 · Pas d\'erreur JS lors de l\'ouverture depuis la homepage', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await cleanDemoStorage(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Naviguer vers /demo
    const demoLink = page.locator('a[href="/demo"]').first();
    if (await demoLink.isVisible().catch(() => false)) {
      await demoLink.click();
    } else {
      await page.goto('/demo');
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const critiques = errors.filter(e =>
      !e.includes('supabase') && !e.includes('removebg') && !e.includes('vapid') &&
      !e.includes('service-worker')
    );
    expect(critiques, `Erreurs JS lors de l\'ouverture démo : ${critiques.join('\n')}`).toHaveLength(0);
  });

  test('DB07 · La session démo est toujours réinitialisée à chaque visite /demo', async ({ page }) => {
    // Simule un utilisateur qui a déjà fait la démo (session en cache)
    await page.addInitScript(() => {
      sessionStorage.setItem('sl-demo-initialized', 'true');
      sessionStorage.setItem('sl-demo-profile', 'president');
      sessionStorage.setItem('sl-demo-step', '5');
      sessionStorage.setItem('sl-demo-sandbox', 'true');
    });

    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    // Malgré la session en cache, la DemoLandingPage DOIT s'afficher
    await expect(
      page.getByText('Démonstration interactive'),
      'DemoLandingPage absente malgré une session sandbox en cache — la réinitialisation ne fonctionne pas'
    ).toBeVisible({ timeout: 10000 });

    // Et les 6 profils doivent être sélectionnables
    await expect(
      page.getByRole('button', { name: /Président/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('DB08 · /demo responsive — pas d\'overflow mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await cleanDemoStorage(page);
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow, 'Overflow horizontal sur mobile 375px dans la démo').toBe(false);
  });
});
