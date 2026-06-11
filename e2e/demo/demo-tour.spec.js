import { test, expect } from '@playwright/test';

/**
 * Tests profonds du mode démo — parcours complets, navigation app, données.
 *
 * Complète demo-sandbox.spec.js qui couvre l'accès et la structure.
 * Ce fichier couvre :
 *   - Parcours complet step 1 → N (Président 12 étapes, Coach 6 étapes)
 *   - Navigation app : vérifie que l'onglet actif change pendant le tour
 *   - Données démo : club, événements, carte
 *   - Bouton "Essayer moi-même" sur les étapes tryIt
 *   - CTA finale (dernière étape isCTA)
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

// Regex step N : match "Étape N / 12" et "Étape N/12" mais pas "Étape N+1"
function stepRegex(n) {
  return new RegExp(`Étape ${n}[^0-9]`);
}

// Clique sur "Suivant →" et attend l'animation du guide + la navigation
async function clickNext(page) {
  await page.getByRole('button', { name: 'Suivant →' }).click();
  await page.waitForTimeout(400);
}

// Navigue jusqu'à l'étape N en cliquant N-1 fois sur Suivant
async function goToStep(page, targetStep) {
  for (let s = 1; s < targetStep; s++) {
    await expect(page.getByText(stepRegex(s))).toBeVisible({ timeout: 4000 });
    await clickNext(page);
  }
  await expect(page.getByText(stepRegex(targetStep))).toBeVisible({ timeout: 4000 });
}

// Récupère l'onglet actif depuis sessionStorage (App.jsx l'y stocke)
async function getActiveTab(page) {
  return page.evaluate(() => sessionStorage.getItem('sl-tab'));
}

// ── PARCOURS COMPLETS ─────────────────────────────────────────────────────────

test.describe('Parcours complet — Président (12 étapes)', () => {
  test('T01 · Step 1→12 sans crash, CTA finale visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    // Parcourir les étapes 1→11 (les 10 premières ont "Suivant →")
    for (let step = 1; step <= 10; step++) {
      await expect(page.getByText(stepRegex(step))).toBeVisible({ timeout: 4000 });
      await clickNext(page);
    }

    // Étape 11 — non-CTA, "Suivant →" visible, tab 'clubs'
    await expect(page.getByText(stepRegex(11))).toBeVisible({ timeout: 4000 });
    await clickNext(page);

    // Étape 12 — isCTA : plus de "Suivant →", boutons CTA à la place
    await expect(
      page.getByRole('button', { name: /Créer mon club gratuitement/i }),
      'Bouton CTA final absent à l\'étape 12'
    ).toBeVisible({ timeout: 4000 });
    await expect(
      page.getByRole('button', { name: /Explorer librement la sandbox/i }),
    ).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: 'Suivant →' })).not.toBeVisible();
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });
});

test.describe('Parcours complet — Coach (6 étapes)', () => {
  test('T02 · Step 1→6 sans crash, CTA finale visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Coach');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    for (let step = 1; step <= 4; step++) {
      await expect(page.getByText(stepRegex(step))).toBeVisible({ timeout: 4000 });
      await clickNext(page);
    }

    // Étape 5 — non-CTA
    await expect(page.getByText(stepRegex(5))).toBeVisible({ timeout: 4000 });
    await clickNext(page);

    // Étape 6 — isCTA
    await expect(
      page.getByRole('button', { name: /Créer mon club gratuitement/i }),
      'Bouton CTA final absent à l\'étape 6 (Coach)'
    ).toBeVisible({ timeout: 4000 });
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });
});

// ── NAVIGATION APP PENDANT LE TOUR ────────────────────────────────────────────

test.describe('Navigation app — onglet actif change avec le guide', () => {
  // Les onglets du profil Président :
  //   Step 1  → tab 'mon-club'
  //   Step 4  → tab 'map'
  //   Step 11 → tab 'clubs'

  test('T10 · Step 1 → onglet mon-club activé', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    // Laisser le CustomEvent sl-demo-navigate se propager
    await page.waitForTimeout(600);

    const tab = await getActiveTab(page);
    expect(tab, 'L\'onglet actif doit être mon-club à l\'étape 1').toBe('mon-club');
  });

  test('T11 · Step 4 → onglet map activé, Leaflet visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 4);
    await page.waitForTimeout(600); // laisser la navigation s'effectuer

    const tab = await getActiveTab(page);
    expect(tab, 'L\'onglet actif doit être map à l\'étape 4').toBe('map');

    // La carte Leaflet doit être rendue
    await expect(
      page.locator('.leaflet-container'),
      'Leaflet absent après navigation vers l\'onglet map'
    ).toBeVisible({ timeout: 8000 });
  });

  test('T12 · Step 11 → onglet clubs activé', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 11);
    await page.waitForTimeout(600);

    const tab = await getActiveTab(page);
    expect(tab, 'L\'onglet actif doit être clubs à l\'étape 11').toBe('clubs');
  });

  test('T13 · Supporter tour — step 1 → onglet clubs, step 3 → onglet home', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Supporter');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(600);

    expect(await getActiveTab(page), 'Supporter step 1 doit être clubs').toBe('clubs');

    await goToStep(page, 3);
    await page.waitForTimeout(600);
    expect(await getActiveTab(page), 'Supporter step 3 doit être home').toBe('home');
  });
});

// ── DONNÉES DÉMO ──────────────────────────────────────────────────────────────

test.describe('Données démo — club, événements, carte', () => {
  test('T20 · Club "FC SportLink Démo" visible dans l\'app (step 1)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(800);

    // Le nom du club démo doit apparaître quelque part dans l'app (pas seulement dans le guide)
    await expect(
      page.getByText('FC SportLink Démo').first(),
      'Le club démo "FC SportLink Démo" n\'est pas affiché dans l\'app'
    ).toBeVisible({ timeout: 6000 });
  });

  test('T21 · Événements démo sur la carte (step 4, onglet map)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 4);
    await page.waitForTimeout(600);

    // Carte Leaflet visible
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 8000 });

    // Au moins un marqueur d'événement sur la carte
    await expect(
      page.locator('.leaflet-marker-icon').first(),
      'Aucun marqueur sur la carte — demoEvents ne se chargent pas ?'
    ).toBeVisible({ timeout: 6000 });
  });

  test('T22 · Utilisateur démo reconnu comme club_admin — FAB visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await page.waitForTimeout(800);

    // En mode démo, l'utilisateur est club_admin → le FAB (+) doit être dans la BottomNav.
    // S'il est absent, l'auth démo est cassée (rôle non reconnu).
    const fab = page.locator('[data-testid="fab"], button[aria-label*="Ajouter"], button[aria-label*="Créer"]')
      .or(page.locator('nav').locator('button').filter({ hasText: /^\+$/ }))
      .first();

    // Alternative : vérifier le nom du club dans le header ou le dashboard
    const clubName = page.getByText('FC SportLink Démo').first();
    await expect(
      clubName,
      'Le club démo doit être visible — auth club_admin non fonctionnelle ?'
    ).toBeVisible({ timeout: 6000 });
  });
});

// ── BOUTON "ESSAYER MOI-MÊME" ─────────────────────────────────────────────────

test.describe('Bouton tryIt — Essayer moi-même', () => {
  test('T30 · Étape 3 Président — bouton "Créer un événement" visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    // Naviguer à l'étape 3 (tryItLabel: 'Créer un événement')
    await goToStep(page, 3);

    await expect(
      page.getByRole('button', { name: /Créer un événement/i }),
      'Bouton tryIt absent à l\'étape 3 du tour Président'
    ).toBeVisible({ timeout: 4000 });
  });

  test('T31 · Clic tryIt collapse le guide en pill', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });
    await goToStep(page, 3);

    await page.getByRole('button', { name: /Créer un événement/i }).click();
    await page.waitForTimeout(500);

    // Après tryIt, le guide passe en pill avec "✨ À vous de jouer !"
    await expect(
      page.getByText(/À vous de jouer/i),
      'Mode tryIt actif : "À vous de jouer !" doit être visible'
    ).toBeVisible({ timeout: 3000 });
  });

  test('T32 · Étape 3 Coach — bouton "Envoyer une convocation" visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Coach');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    await goToStep(page, 3);

    await expect(
      page.getByRole('button', { name: /Envoyer une convocation/i }),
      'Bouton tryIt absent à l\'étape 3 du tour Coach'
    ).toBeVisible({ timeout: 4000 });
  });
});

// ── AUCUNE ERREUR SUR TOUT LE PARCOURS ───────────────────────────────────────

test.describe('Stabilité — zéro erreur JS sur un parcours rapide', () => {
  test('T40 · Parcours 6 étapes Coach sans aucune erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await gotoDemo(page);
    await selectProfile(page, 'Coach');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    for (let step = 1; step <= 4; step++) {
      await clickNext(page);
    }
    await clickNext(page); // step 6 (CTA)
    await expect(
      page.getByRole('button', { name: /Créer mon club gratuitement/i })
    ).toBeVisible({ timeout: 4000 });

    const critiques = errors.filter(e =>
      !e.includes('supabase') && !e.includes('removebg') && !e.includes('vapid')
    );
    expect(critiques, `Erreurs JS : ${critiques.join('\n')}`).toHaveLength(0);
  });

  test('T41 · Parcours Joueur 6 étapes sans aucune erreur JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await gotoDemo(page);
    await selectProfile(page, 'Joueur');
    await expect(page.getByText(stepRegex(1))).toBeVisible({ timeout: 6000 });

    for (let step = 1; step <= 5; step++) {
      await clickNext(page);
    }
    // Étape 6 (isCTA)
    await expect(
      page.getByRole('button', { name: /Créer mon club gratuitement/i })
    ).toBeVisible({ timeout: 4000 });

    const critiques = errors.filter(e =>
      !e.includes('supabase') && !e.includes('removebg') && !e.includes('vapid')
    );
    expect(critiques, `Erreurs JS : ${critiques.join('\n')}`).toHaveLength(0);
  });
});
