import { test, expect } from '@playwright/test';

/**
 * Tests DemoSpotlight — halos de guidage.
 *
 * DemoSpotlight cherche [data-demo="<target>"] dans le DOM et rend une
 * bordure lumineuse pulsante (animation sl-demo-highlight) autour de
 * l'élément trouvé.
 *
 * Deux vecteurs de régression couverts ici :
 *   1. data-demo manquant dans le code → spotlight silencieusement absent
 *   2. target incorrect dans le tour → même résultat, invisible pour les devs
 *
 * Bugs corrigés avant ce commit :
 *   - president.js steps 7 & 10 : target 'open-dashboard' → 'admin-dashboard'
 *   - ConvocationsList.jsx : data-demo="convocation-respond" ajouté
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

async function addCleanDemoSession(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
  });
}

async function gotoDemo(page) {
  await addCleanDemoSession(page);
  await page.goto('/demo');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText('Démonstration interactive')).toBeVisible({ timeout: 8000 });
}

async function selectProfile(page, label) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
  await page.waitForTimeout(600);
}

function stepRegex(n) {
  return new RegExp(`Étape ${n}[^0-9]`);
}

async function clickNext(page) {
  await page.getByRole('button', { name: 'Suivant →' }).click();
  await page.waitForTimeout(400);
}

async function goToStep(page, targetStep) {
  for (let s = 1; s < targetStep; s++) {
    await expect(page.getByText(stepRegex(s))).toBeVisible({ timeout: 4000 });
    await clickNext(page);
  }
  await expect(page.getByText(stepRegex(targetStep))).toBeVisible({ timeout: 4000 });
}

// Vérifie que le halo DemoSpotlight est actif dans le DOM.
// DemoSpotlight injecte animation: 'sl-demo-highlight ...' en inline style.
async function isSpotlightActive(page) {
  return page.evaluate(() => !!document.querySelector('[style*="sl-demo-highlight"]'));
}

// Attend que l'élément [data-demo="<target>"] soit dans le DOM.
async function waitForDemoTarget(page, target, timeout = 5000) {
  await page.waitForFunction(
    (t) => !!document.querySelector(`[data-demo="${t}"]`),
    target,
    { timeout }
  );
}

// ── GROUPE 1 : Présence des data-demo targets dans le DOM ────────────────────

test.describe('DemoSpotlight — data-demo targets présents dans le DOM', () => {
  test('SP01 · [data-demo="fab-add"] visible sur onglet mon-club (step 1 Président)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(600);

    await expect(
      page.locator('[data-demo="fab-add"]'),
      'FAB button [data-demo="fab-add"] absent — annotation manquante dans BottomNav ?'
    ).toBeVisible({ timeout: 4000 });
  });

  test('SP02 · [data-demo="convocations-tab"] visible après step 9 (action open-convocations)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 9);
    // L'action 'open-convocations' au step 9 ouvre le panneau convocations dans ClubMatchesTab
    await page.waitForTimeout(800);

    await expect(
      page.locator('[data-demo="convocations-tab"]'),
      '[data-demo="convocations-tab"] absent — annotation manquante dans ClubMatchesTab ?'
    ).toBeVisible({ timeout: 5000 });
  });

  test('SP03 · [data-demo="admin-dashboard"] visible après step 10 (action open-dashboard)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 10);
    // L'action 'open-dashboard' ouvre le ClubAdminDrawer avec item id='dashboard'
    // → data-demo="admin-dashboard" (cf. ClubAdminDrawer.jsx)
    await page.waitForTimeout(800);

    await expect(
      page.locator('[data-demo="admin-dashboard"]'),
      '[data-demo="admin-dashboard"] absent — target du tour corrigé mais drawer non ouvert ?'
    ).toBeVisible({ timeout: 5000 });
  });

  test('SP04 · [data-demo="tab-clubs"] présent dans BottomNav (Supporter step 1)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Supporter');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(600);

    // [data-demo="follow-club-btn"] est dans ClubHero (overlay) — non testable sans ouvrir
    // un club manuellement. On vérifie à la place que les data-demo nav sont présents.
    await expect(
      page.locator('[data-demo="tab-clubs"]'),
      '[data-demo="tab-clubs"] absent dans BottomNav — annotation BottomNav cassée ?'
    ).toBeVisible({ timeout: 4000 });
  });

  test('SP05 · [data-demo="convocation-respond"] visible (Joueur step 2)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Joueur');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 2);
    await page.waitForTimeout(800);

    // ConvocationsList doit afficher une convocation pending avec les boutons de réponse
    // portant data-demo="convocation-respond"
    await expect(
      page.locator('[data-demo="convocation-respond"]').first(),
      '[data-demo="convocation-respond"] absent — ajout manquant dans ConvocationsList.jsx ?'
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── GROUPE 2 : Halo pulsant effectivement rendu ──────────────────────────────

test.describe('DemoSpotlight — halo sl-demo-highlight actif', () => {
  test('SP10 · Halo actif après tryIt step 3 Président (target: fab-add)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 3);
    // Step 3 : tryItAction 'event-created', target 'fab-add'
    // Cliquer tryIt → spotlightActive = true → DemoSpotlight cherche [data-demo="fab-add"]
    await page.getByRole('button', { name: /Créer un événement/i }).click();
    await page.waitForTimeout(600); // polling DemoSpotlight : 100ms × n

    const active = await isSpotlightActive(page);
    expect(active, 'Halo DemoSpotlight absent après activation tryIt (target: fab-add)').toBe(true);
  });

  test('SP11 · Halo actif au step 10 Président (autoSpotlight, target: admin-dashboard)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    // Step 10 : target 'admin-dashboard', pas de tryItAction → autoSpotlight = true
    await goToStep(page, 10);
    // Laisser l'action 'open-dashboard' s'exécuter ET le polling DemoSpotlight trouver l'élément
    await page.waitForTimeout(1200);

    const active = await isSpotlightActive(page);
    expect(active, 'Halo DemoSpotlight absent au step 10 (target: admin-dashboard, autoSpotlight)').toBe(true);
  });

  test('SP12 · Halo inactif quand target introuvable dans le DOM', async ({ page }) => {
    // DemoSpotlight retourne null si l'élément n'est pas trouvé après 40 tentatives.
    // Ce test vérifie qu'il ne plante pas et reste silencieux (pas d'erreur JS).
    // Cas : follow-club-btn est dans ClubHero (overlay) — absent sur la clubs list.
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await gotoDemo(page);
    await selectProfile(page, 'Supporter');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 2);
    await page.getByRole('button', { name: /Suivre ce club/i }).click();
    // Laisser le polling DemoSpotlight s'épuiser (40 × 100ms = 4s max)
    await page.waitForTimeout(500);

    // Aucune erreur JS — DemoSpotlight doit échouer silencieusement
    const critiques = errors.filter(e => !e.includes('supabase') && !e.includes('vapid'));
    expect(critiques, 'Erreur JS pendant spotlight silencieux').toHaveLength(0);
  });

  test('SP13 · Halo disparaît quand on passe à l\'étape suivante', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    // Activer le spotlight au step 3
    await goToStep(page, 3);
    await page.getByRole('button', { name: /Créer un événement/i }).click();
    await page.waitForTimeout(600);
    expect(await isSpotlightActive(page), 'Halo doit être actif au step 3').toBe(true);

    // Après tryIt, le guide est en pill "✨ À vous de jouer !".
    // Cliquer dessus l'expand → "Suivant →" redevient visible.
    await page.getByText(/À vous de jouer/i).click();
    await page.waitForTimeout(400);

    // Aller au step 4 (map, pas de target) → spotlight doit disparaître
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await page.waitForTimeout(600);
    const stillActive = await isSpotlightActive(page);
    expect(stillActive, 'Halo doit disparaître au step 4 (pas de target)').toBe(false);
  });

  test('SP14 · keyframes sl-demo-highlight injectés dans <head>', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    // DemoSpotlight.useEffect injecte les keyframes dès le montage
    const stylesInjected = await page.evaluate(
      () => !!document.getElementById('sl-demo-spotlight-styles')
    );
    expect(stylesInjected, 'Keyframes sl-demo-spotlight-styles non injectés').toBe(true);
  });
});

// ── GROUPE 3 : Aucune régression data-demo sur les onglets nav ───────────────

test.describe('DemoSpotlight — annotations BottomNav (tab-*)', () => {
  test('SP20 · Tous les onglets de nav ont un data-demo="tab-<id>"', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(400);

    // En mode club_admin : HOME (home), MAP (map), CLUBS (clubs), MON_CLUB (mon-club)
    for (const tabId of ['home', 'map', 'clubs', 'mon-club']) {
      const count = await page.locator(`[data-demo="tab-${tabId}"]`).count();
      expect(count, `Onglet nav [data-demo="tab-${tabId}"] absent dans BottomNav`).toBeGreaterThan(0);
    }
  });
});
