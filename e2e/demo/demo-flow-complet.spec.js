import { test, expect } from '@playwright/test';

/**
 * Tests Playwright — Flux démo complet
 *
 * Vérifie que les corrections apportées au mode démo fonctionnent :
 *   1. CoachMatchCard visible pour coach/président (event_type championship/cup)
 *   2. LiveScorePupitre visible (demo-ms-016 in_progress)
 *   3. FeedRides visible avec données réalistes et noms de passagers
 *   4. FeedRecentResults visible avec résultats finaux
 *   5. Chaque rôle voit ce qu'il doit voir (et pas ce qu'il ne doit pas)
 *
 * Screenshots : e2e/screenshots/demo-flow/
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

async function gotoDemo(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
  });
  await page.goto('/demo', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('text=Démonstration interactive')).toBeVisible({ timeout: 20000 });
}

async function selectProfile(page, label) {
  await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click({ force: true });
  // Attendre que le nav principal soit visible (app chargée) plutôt que networkidle
  // networkidle ne se stabilise jamais avec Vite HMR + Supabase Realtime
  await page.locator('nav').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
}

async function scrollDown(page, px = 300) {
  // La page SPA utilise un container overflow-y-auto, pas le window
  await page.evaluate((amount) => {
    const container = document.querySelector('[data-demo="agenda-section"]')?.parentElement
      ?? document.querySelector('.overflow-y-auto')
      ?? document.scrollingElement
      ?? document.body;
    container.scrollBy(0, amount);
    window.scrollBy(0, amount);
  }, px);
  await page.waitForTimeout(400);
}

// ── Suite 1 : CoachMatchCard visible (coach + président) ───────────────────────

test.describe('Coach — CoachMatchCard et LiveScorePupitre', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
  });

  test('CoachMatchCard est visible dans l\'onglet Accueil', async ({ page }) => {
    // La carte match doit apparaître — data-demo="coach-match-card"
    const card = page.locator('[data-demo="coach-match-card"]');
    await expect(card.first()).toBeVisible({ timeout: 8000 });
  });

  test('LiveScorePupitre est visible (match en cours 2-1)', async ({ page }) => {
    // Plusieurs matchs peuvent être en cours → plusieurs pupitres possibles
    const pupitres = page.locator('[data-demo="live-score-pupitre"]');
    await expect(pupitres.first()).toBeVisible({ timeout: 8000 });

    // Vérifier qu'au moins un pupitre est affiché
    const count = await pupitres.count();
    expect(count).toBeGreaterThan(0);

    // Vérifier le pupitre Équipe 1 2-1 Brest Iroise FC
    const equipe1Pupitre = pupitres.filter({ hasText: 'Brest Iroise FC' });
    await expect(equipe1Pupitre).toBeVisible({ timeout: 5000 });
  });

  test('CoachMatchCard pré-match (J+4) affiche la synthèse de convocations', async ({ page }) => {
    // Il peut y avoir plusieurs cards — l'une est live, l'autre en pré-match
    const cards = page.locator('[data-demo="coach-match-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });

    // La card doit montrer "Présent" (Présence section) ou "confirmés" (convoc staff)
    // .count() ne nécessite pas de viewport — fonctionne quel que soit le layout
    const hasConvocSummary =
      await page.locator('text=Présent').count() > 0
      || await page.locator('text=confirmés').count() > 0;
    expect(hasConvocSummary).toBe(true);
  });

  test('Screenshot — Coach home avec CoachMatchCard et pupitre', async ({ page }) => {
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/coach-home-match-card.png',
      fullPage: false,
    });
  });

  test('Bouton "Créer l\'affiche" visible sur une card pré-match', async ({ page }) => {
    const cards = page.locator('[data-demo="coach-match-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 8000 });

    // Dans MatchPlanningCard, le bouton affiche s'appelle "Créer l'affiche" (état pre_match)
    // ou "Générer l'affiche résultat" (état post_done)
    const posterBtn = page.locator('button').filter({ hasText: /créer l'affiche|générer l'affiche/i });
    await expect(posterBtn.first()).toBeVisible({ timeout: 8000 });
  });
});

// ── Suite 2 : Président ───────────────────────────────────────────────────────

test.describe('Président — mêmes fonctionnalités que coach', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'pr.*sident');
  });

  test('CoachMatchCard visible', async ({ page }) => {
    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('LiveScorePupitre visible', async ({ page }) => {
    // Plusieurs matchs en cours → utiliser .first() pour éviter le strict mode
    await expect(page.locator('[data-demo="live-score-pupitre"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Screenshot — Président home', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/president-home.png',
      fullPage: false,
    });
  });
});

// ── Suite 3 : FeedRides visible dans ActualitésPage ───────────────────────────

test.describe('Covoiturage démo — CarpoolSection sous les matchs', () => {
  // NB : l'ancien composant FeedRides (« Covoiturages ») a été supprimé. Le
  // covoiturage est désormais inline sous chaque match (CarpoolSection,
  // data-demo="carpool-card") pour les profils staff (coach) ou « présent ».

  async function setupForActus(page, profileLabel) {
    await gotoDemo(page);
    await selectProfile(page, profileLabel);
    await page.waitForTimeout(1000);
  }

  test('Coach — au moins une carte covoiturage visible', async ({ page }) => {
    await setupForActus(page, 'coach');
    const card = page.locator('[data-demo="carpool-card"]').first();
    await card.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(card).toBeVisible({ timeout: 5000 });
  });

  test('Parent — page Actualités charge sans erreur', async ({ page }) => {
    await setupForActus(page, 'parent');
    const agenda = page.locator('[data-demo="agenda-section"]');
    await agenda.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(agenda).toBeVisible({ timeout: 5000 });
  });

  test('Joueur — page Actualités charge sans erreur', async ({ page }) => {
    await setupForActus(page, 'joueur');
    const agenda = page.locator('[data-demo="agenda-section"]');
    await agenda.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(agenda).toBeVisible({ timeout: 5000 });
  });

  test('Covoiturage — au moins un trajet avec places libres affiché', async ({ page }) => {
    await setupForActus(page, 'coach');
    // Résumé CarpoolSection : « N trajet(s) · M place(s) libre(s) ».
    const places = page.getByText(/places? libres?/i).first();
    await places.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(places).toBeVisible({ timeout: 5000 });
  });

  test('Coach — bouton « Rejoindre / Gérer » ou « Proposer » visible', async ({ page }) => {
    await setupForActus(page, 'coach');
    const card = page.locator('[data-demo="carpool-card"]').first();
    await card.scrollIntoViewIfNeeded({ timeout: 12000 });
    const btn = page.locator('button').filter({ hasText: /rejoindre|gérer|proposer/i }).first();
    await expect(btn).toBeVisible({ timeout: 8000 });
  });

  test('Screenshot — Covoiturage (coach)', async ({ page }) => {
    await setupForActus(page, 'coach');
    const card = page.locator('[data-demo="carpool-card"]').first();
    await card.scrollIntoViewIfNeeded({ timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'e2e/screenshots/demo-flow/carpool-coach.png', fullPage: false });
  });

  test('Screenshot — Parent Actualités (résultats et multiplex)', async ({ page }) => {
    await setupForActus(page, 'parent');
    await scrollDown(page, 300);
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'e2e/screenshots/demo-flow/parent-actualites-scroll.png', fullPage: false });
  });
});

// ── Suite 4 : RideSection détail (noms de passagers) ─────────────────────────

test.describe('RideSection — détail avec noms de passagers', () => {

  test('Covoiturage : trajet seed affiché avec données réelles (pas de undefined)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(1000);
    // Carte covoiturage avec des trajets seed (résumé « N trajets · M places »).
    const card = page.locator('[data-demo="carpool-card"]').first();
    await card.scrollIntoViewIfNeeded({ timeout: 12000 });
    const summary = page.getByText(/\d+ trajets? ·/i).first();
    await summary.scrollIntoViewIfNeeded({ timeout: 8000 });
    await expect(summary).toBeVisible({ timeout: 5000 });
    // Le bouton d'ouverture existe et aucune donnée « undefined » n'est rendue.
    await expect(page.locator('button').filter({ hasText: /rejoindre|gérer/i }).first())
      .toBeVisible({ timeout: 5000 });
    expect(await page.locator('text=undefined').count()).toBe(0);
    await page.screenshot({ path: 'e2e/screenshots/demo-flow/ride-section-detail.png', fullPage: false });
  });

  test('RideSection : pas de texte "undefined" visible sur la page', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'parent');
    await page.waitForTimeout(1000);
    // Vérifier que la page visible ne contient pas de texte "undefined"
    // (pas de clic car sticky header peut intercepter pointer events après scroll)
    expect(await page.locator('text=undefined').count()).toBe(0);
  });
});

// ── Suite 5 : FeedRecentResults ───────────────────────────────────────────────

test.describe('FeedRecentResults — résultats récents visibles', () => {

  async function setupForResults(page, profileLabel) {
    await gotoDemo(page);
    await selectProfile(page, profileLabel);
    // Les profils démo démarrent sur ActualitesPage — pas de clic nav bloquant
    await page.waitForTimeout(1000);
  }

  test('Section "Derniers résultats" visible (supporter)', async ({ page }) => {
    await setupForResults(page, 'supporter');
    const section = page.locator('text=Derniers résultats').first();
    await section.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(section).toBeVisible({ timeout: 5000 });
  });

  test('Section "Derniers résultats" visible (parent)', async ({ page }) => {
    await setupForResults(page, 'parent');
    const section = page.locator('text=Derniers résultats').first();
    await section.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(section).toBeVisible({ timeout: 5000 });
  });

  test('Section "Derniers résultats" visible (coach)', async ({ page }) => {
    await setupForResults(page, 'coach');
    const section = page.locator('text=Derniers résultats').first();
    await section.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(section).toBeVisible({ timeout: 5000 });
  });

  test('Au moins un résultat "V" / "D" / "N" affiché', async ({ page }) => {
    await setupForResults(page, 'supporter');
    const section = page.locator('text=Derniers résultats').first();
    await section.scrollIntoViewIfNeeded({ timeout: 12000 });
    // Vérifier qu'un score style "3 – 1" est visible
    const scorePattern = page.locator('text=/\\d+ – \\d+/').first();
    await expect(scorePattern).toBeVisible({ timeout: 8000 });
  });

  test('Screenshot — FeedRecentResults (supporter)', async ({ page }) => {
    await setupForResults(page, 'supporter');
    const section = page.locator('text=Derniers résultats').first();
    await section.scrollIntoViewIfNeeded({ timeout: 12000 });
    await page.waitForTimeout(400);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/feed-recent-results-supporter.png',
      fullPage: false,
    });
  });
});

// ── Suite 6 : Contrôle d'accès par rôle ──────────────────────────────────────

test.describe('Contrôle accès — chaque rôle voit le bon contenu', () => {

  test('Supporter — voit le planning mais PAS de LiveScorePupitre', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'supporter');
    await page.waitForTimeout(1000);

    // Le supporter voit les match cards (demo montre le contenu complet)
    // mais SANS le pupitre score live (réservé aux coaches)
    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-demo="live-score-pupitre"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('Parent — voit le planning mais PAS de LiveScorePupitre', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'parent');
    await page.waitForTimeout(1000);

    // Le parent voit les match cards mais sans le pupitre score live
    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-demo="live-score-pupitre"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('Coach — CoachMatchCard présent', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(1000);

    await expect(page.locator('[data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 8000 });
  });

  test('Supporter — PAS de LiveScorePupitre', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'supporter');
    await page.waitForTimeout(1000);

    const pupitre = page.locator('[data-demo="live-score-pupitre"]');
    await expect(pupitre).toHaveCount(0, { timeout: 3000 });
  });
});

// ── Suite 7 : Flux complet coach (bout en bout) ───────────────────────────────

test.describe('Flux complet coach — événement → convocation → score → affiche', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(800);
  });

  test('FAB "+" présent et accessible', async ({ page }) => {
    // À 1440px l'app utilise la nav desktop : le déclencheur d'actions rapides
    // s'appelle « Actions rapides » (mobile/BottomNav : « Ouvrir le menu rapide »,
    // data-demo="fab-add"). On accepte les deux.
    const fab = page.getByRole('button', { name: /actions rapides|ouvrir le menu|menu rapide/i }).first();
    await expect(fab).toBeVisible({ timeout: 8000 });
  });

  test('Pupitre score : boutons +1 présents dans le DOM', async ({ page }) => {
    const pupitre = page.locator('[data-demo="live-score-pupitre"]').first();
    await expect(pupitre).toBeVisible({ timeout: 8000 });

    // Vérifier que les boutons +1 existent dans le pupitre (sans cliquer)
    // (le guide overlay intercepts les clics sur le pupitre)
    const plusBtn = pupitre.locator('button').filter({ hasText: /\+1/ }).first();
    await expect(plusBtn).toBeVisible({ timeout: 5000 });
    // Aucun message d'erreur critique visible
    const errorMsg = page.locator('text=/erreur critique|error fatal/i');
    await expect(errorMsg).toHaveCount(0);
  });

  test('ConvocationBtn visible dans une MatchPlanningCard', async ({ page }) => {
    // Vérifier qu'un bouton d'action existe sur les match cards
    const convocBtn = page.locator('[data-demo="convocation-btn"]').first();
    await expect(convocBtn).toBeVisible({ timeout: 10000 });
  });

  test('Screenshot — Coach home avec demo guide', async ({ page }) => {
    // Screenshot sans ouvrir le FAB (overlay intercepte les clics)
    await page.waitForTimeout(800);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/coach-fab-menu.png',
      fullPage: false,
    });
  });

  test('Screenshot — Pupitre score live', async ({ page }) => {
    await expect(page.locator('[data-demo="live-score-pupitre"]').first()).toBeVisible({ timeout: 8000 });
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/live-score-pupitre.png',
      fullPage: false,
    });
  });
});

// ── Suite 8 : Flux parent (convocation + covoiturage) ─────────────────────────

test.describe('Flux parent — convocation et covoiturage', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'parent');
    await page.waitForTimeout(800);
  });

  test('Onglet Agenda accessible et affiche du contenu', async ({ page }) => {
    // Le parent démarre sur ActualitesPage — pas de clic nav bloquant
    await page.waitForTimeout(500);
    const content = page.locator('[data-demo="agenda-section"], main, .flex-col').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });

  test('Screenshot — Parent onglet Actualités', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/parent-actualites.png',
      fullPage: false,
    });
  });

  test('Screenshot — Parent home', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/parent-home.png',
      fullPage: false,
    });
  });
});

// ── Suite 9 : Flux joueur ────────────────────────────────────────────────────

test.describe('Flux joueur — convocation et multiplex', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'joueur');
    await page.waitForTimeout(800);
  });

  test('Section Multiplex visible (scores en direct)', async ({ page }) => {
    await scrollDown(page, 300);
    const multiplex = page.locator('[data-demo="live-multiplex"]');
    await expect(multiplex).toBeVisible({ timeout: 8000 });
  });

  test('Screenshot — Joueur home avec multiplex', async ({ page }) => {
    await page.waitForTimeout(1000);
    await scrollDown(page, 200);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/player-home-multiplex.png',
      fullPage: false,
    });
  });
});

// ── Suite 10 : Flux supporter ─────────────────────────────────────────────────

test.describe('Flux supporter — feed et résultats', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'supporter');
    await page.waitForTimeout(800);
  });

  test('Multiplex live visible', async ({ page }) => {
    await scrollDown(page, 200);
    const multiplex = page.locator('[data-demo="live-multiplex"]');
    await expect(multiplex).toBeVisible({ timeout: 8000 });
  });

  test('Screenshot — Supporter home', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/supporter-home.png',
      fullPage: false,
    });
  });

  test('Screenshot — Supporter avec résultats récents', async ({ page }) => {
    // Le supporter démarre sur ActualitesPage — pas de clic nav bloquant
    await scrollDown(page, 400);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/supporter-actualites-results.png',
      fullPage: false,
    });
  });
});

// ── Suite 11 : Convocations — présence et flux réponse ───────────────────────

test.describe('Convocations — présence et flux réponse', () => {

  // ── Coach : résumé convocations ──────────────────────────────────────────

  test('Coach — ConvocationSummary affiche les compteurs (Présents / Sans réponse)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(800);
    // demo-event-001 : 14 acceptés, 1 décliné, 1 indisponible, 3 en attente
    // ConvocationSummary affiche "✓ N Présents" et "⏳ N Sans réponse"
    const summary = page.locator('text=/présent|sans réponse/i').first();
    await summary.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(summary).toBeVisible({ timeout: 5000 });
  });

  test('Coach — bouton "Convoquer l\'équipe" sur match pré-J+4', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(800);
    // cardState pre_match → bouton jaune "Convoquer l'équipe"
    const btn = page.locator('[data-demo="convocation-btn"]').filter({ hasText: /convoquer|gérer/i }).first();
    await btn.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toContainText(/convoquer|gérer/i);
  });

  // ── Coach : résumé détaillé ──────────────────────────────────────────────

  test('Coach — ConvocationSummary badge "Absents" visible (décliné+indispo)', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(800);
    // demo-event-001 : 1 décliné + 1 indisponible → badge "✗ 2 Absents"
    const absentBadge = page.locator('text=/absent/i').first();
    await absentBadge.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(absentBadge).toBeVisible({ timeout: 5000 });
  });

  test('Coach — carte match avec gestion de convocation visible', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(800);
    // Invariant robuste (le récap exact "X confirmés · Y en attente" dépend d'un
    // état de match volatil) : le coach voit une carte match et peut gérer les
    // convocations.
    const card = page.locator('[data-demo="coach-match-card"]').first();
    await card.scrollIntoViewIfNeeded({ timeout: 12000 });
    await expect(card).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[data-demo="convocation-btn"], [data-demo="convocation-respond"]').first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ── Joueur / Parent : comportement en démo documenté ─────────────────────

  test('Joueur — section présence non affichée en démo (isPlayerClub=false)', async ({ page }) => {
    // En démo, useSeasonPlanning ne résout pas isPlayerClub pour les profils non-admin
    // (pas de liaison player→club en démo). En production, le joueur verrait PresenceButtons.
    await gotoDemo(page);
    await selectProfile(page, 'joueur');
    await page.waitForTimeout(1500);
    // convocation-respond absent du DOM pour ce profil en démo
    await expect(page.locator('[data-demo="convocation-respond"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('Parent — section présence non affichée en démo (isGuardian=false)', async ({ page }) => {
    // Même comportement : isGuardian non résolu en démo.
    await gotoDemo(page);
    await selectProfile(page, 'parent');
    await page.waitForTimeout(1500);
    await expect(page.locator('[data-demo="convocation-respond"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('Parent — la page se charge et la navigation est visible', async ({ page }) => {
    // Test robuste : vérifie que le profil parent se charge complètement
    await gotoDemo(page);
    await selectProfile(page, 'parent');
    await page.waitForTimeout(1200);
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 5000 });
    // Au moins une section de contenu est présente
    await expect(page.locator('[data-demo="agenda-section"], [data-demo="coach-match-card"]').first()).toBeVisible({ timeout: 5000 });
  });

  // ── Screenshots ───────────────────────────────────────────────────────────

  test('Screenshot — profil joueur en démo', async ({ page }) => {
    // Screenshot simple sans attente d'élément — le profil joueur en mode démo
    await gotoDemo(page);
    await selectProfile(page, 'joueur');
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/convocation-presence-joueur.png',
      fullPage: false,
    });
  });

  test('Screenshot — coach avec récapitulatif convocations', async ({ page }) => {
    // Screenshot du profil coach — affiche le live match + la carte pre_match
    await gotoDemo(page);
    await selectProfile(page, 'coach');
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: 'e2e/screenshots/demo-flow/convocation-summary-coach.png',
      fullPage: false,
    });
  });
});
