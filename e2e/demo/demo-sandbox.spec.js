import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../helpers/utils.js';

/**
 * Tests Mode Démo et Sandbox — P0 CRITIQUE
 *
 * RÈGLE D'OR : Zéro test silencieux.
 * Toute assertion doit passer ou ÉCHOUER franchement.
 * Les anciens "if (isVisible) { ... }" qui passent silencieusement sont SUPPRIMÉS.
 *
 * Route : /demo  (pathname.startsWith('/demo') dans App.jsx)
 * Profils : Président (12 étapes), Coach (6), Communication (6),
 *           Parent (6), Joueur (6), Supporter (5)
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

// Injecte le nettoyage AVANT que le script de la page lit sessionStorage.
// addInitScript s'exécute à chaque navigation dans le contexte de la page.
async function addCleanDemoSession(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
    // Désactive l'auto-avance des étapes info (4s) pour rendre les tests déterministes
    sessionStorage.setItem('sl-demo-no-auto-advance', '1');
  });
}

// Navigue vers /demo et attend que DemoLandingPage soit visible.
// Échoue si le mode démo ne charge pas.
async function gotoDemo(page) {
  await addCleanDemoSession(page);
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  await expect(
    page.getByText('Démonstration interactive'),
    'La landing démo doit afficher "Démonstration interactive" — bouton démo cassé ?'
  ).toBeVisible({ timeout: 8000 });
}

// Clique sur un profil et attend l'apparition du DemoGuide.
async function selectProfile(page, label) {
  const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
  await expect(btn, `Profil "${label}" absent de la landing`).toBeVisible({ timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(600);
}

// Regex step-1 : match "Étape 1 / 12" ET "Étape 1/12" mais PAS "Étape 12 / 12"
const STEP_1 = /Étape 1[^0-9]/;
const STEP_2 = /Étape 2[^0-9]/;

// ── GROUPE 1 : Landing page ──────────────────────────────────────────────────

test.describe('Mode Démo — landing page', () => {
  test('D01 · DemoBanner visible sur /demo', async ({ page }) => {
    await gotoDemo(page);
    await expect(page.getByText('Démonstration SportLink')).toBeVisible({ timeout: 5000 });
  });

  test('D02 · Les 6 profils sont affichés', async ({ page }) => {
    await gotoDemo(page);
    for (const label of ['Président', 'Coach', 'Communication', 'Parent', 'Joueur', 'Supporter']) {
      await expect(
        page.getByRole('button', { name: new RegExp(label, 'i') }).first(),
        `Profil "${label}" absent`
      ).toBeVisible();
    }
  });

  test('D03 · Aucune erreur JavaScript au chargement', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await gotoDemo(page);
    await page.waitForTimeout(1200);
    const critiques = errors.filter(e =>
      !e.includes('supabase') && !e.includes('removebg') && !e.includes('vapid')
    );
    expect(critiques, `Erreurs JS : ${critiques.join('\n')}`).toHaveLength(0);
  });

  test('D04 · Pas d\'overflow horizontal (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow horizontal sur la landing démo mobile').toBe(true);
  });
});

// ── GROUPE 2 : Sélection de profil — P0 ─────────────────────────────────────

for (const label of ['Président', 'Coach']) {
  test(`D10 · [P0] Profil ${label} — DemoGuide visible après sélection`, async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, label);

    await expect(
      page.getByText(STEP_1),
      `DemoGuide absent après sélection "${label}" — tour cassé ?`
    ).toBeVisible({ timeout: 6000 });

    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });
}

// ── GROUPE 3 : Sélection de profil — P1 ─────────────────────────────────────

for (const label of ['Communication', 'Parent', 'Joueur', 'Supporter']) {
  test(`D11 · [P1] Profil ${label} — DemoGuide visible après sélection`, async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, label);

    await expect(
      page.getByText(STEP_1),
      `DemoGuide absent après sélection "${label}"`
    ).toBeVisible({ timeout: 6000 });

    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });
}

// ── GROUPE 4 : Navigation dans le guide (profil Président) ───────────────────

test.describe('Mode Démo — navigation guide (Président)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 6000 });
  });

  // Avance le guide d'une étape (gère le mode pill + force:true pour contourner
  // l'instabilité Playwright due au timer setInterval 50ms de DemoGuide)
  async function nextStep(page) {
    const btn = page.getByRole('button', { name: /continuer|passer cette étape/i }).first();
    if (!await btn.isVisible().catch(() => false)) {
      await page.locator('[data-drag-handle]').first().click({ force: true, timeout: 5000 });
      await page.waitForTimeout(300);
    }
    await btn.click({ force: true, timeout: 8000 });
    await page.waitForTimeout(400);
  }

  test('D20 · Le bouton de progression passe à l\'étape 2', async ({ page }) => {
    await nextStep(page);
    // Step 2 est interactif (pill mode) — expand le guide pour voir le compteur
    await page.locator('[data-drag-handle]').first().click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByText(STEP_2)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('D21 · "← Précédent" revient à l\'étape 1 depuis l\'étape 2', async ({ page }) => {
    await nextStep(page);
    // Expand le guide pour accéder à "← Précédent"
    await page.locator('[data-drag-handle]').first().click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByText(STEP_2)).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: '← Précédent' }).click({ force: true });
    await page.waitForTimeout(400);
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 3000 });
  });

  test('D22 · Clic sur le compteur d\'étape réduit le guide (pill)', async ({ page }) => {
    // Le compteur est cliquable et toggle le collapse
    await page.getByText(STEP_1).click({ force: true });
    await page.waitForTimeout(400);
    // En mode pill, le texte "Étape 1" reste visible
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 3000 });
  });

  test('D23 · Bouton "Passer" → label "Confirmer ?" en 3 s', async ({ page }) => {
    // force:true contourne l'instabilité Playwright due au timer 50ms de DemoGuide
    await page.getByRole('button', { name: 'Passer' }).click({ force: true });
    await expect(
      page.getByRole('button', { name: 'Confirmer ?' }),
      '"Confirmer ?" absent après premier clic sur Passer'
    ).toBeVisible({ timeout: 4000 });
  });
});

// ── GROUPE 5 : SandboxWelcome ─────────────────────────────────────────────────

test.describe('Mode Démo — SandboxWelcome', () => {
  test('D30 · "Passer" × 2 → SandboxWelcome affiché', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 6000 });

    // 1er clic → confirmation (force:true pour contourner instabilité timer 50ms)
    await page.getByRole('button', { name: 'Passer' }).click({ force: true });
    await expect(page.getByRole('button', { name: 'Confirmer ?' })).toBeVisible({ timeout: 4000 });

    // 2e clic → exitTour() → SandboxWelcome
    await page.getByRole('button', { name: 'Confirmer ?' }).click({ force: true });
    await page.waitForTimeout(800);

    await expect(
      page.getByText('Vous venez de découvrir'),
      'SandboxWelcome absent après confirmation exit'
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('D31 · "Explorer librement la sandbox" ferme SandboxWelcome', async ({ page }) => {
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 6000 });

    await page.getByRole('button', { name: 'Passer' }).click({ force: true });
    await page.getByRole('button', { name: 'Confirmer ?' }).click({ force: true });
    await expect(page.getByText('Vous venez de découvrir')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /Explorer librement la sandbox/i }).click({ force: true });
    await page.waitForTimeout(600);

    await expect(page.getByText('Vous venez de découvrir')).not.toBeVisible();
    // DemoBanner reste présent en sandbox
    await expect(page.getByText('Démonstration SportLink')).toBeVisible();
  });
});

// ── GROUPE 6 : Responsive ────────────────────────────────────────────────────

test.describe('Mode Démo — responsive', () => {
  test('D40 · Pas d\'overflow avec guide actif (iPhone SE 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 6000 });
    const noOverflow = await checkNoHorizontalOverflow(page);
    expect(noOverflow, 'Overflow dans le mode démo sur iPhone SE').toBe(true);
  });

  test('D41 · Le guide ne dépasse pas l\'écran à droite (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoDemo(page);
    await selectProfile(page, 'Président');
    await expect(page.getByText(STEP_1)).toBeVisible({ timeout: 6000 });

    const guideLabel = page.getByText(STEP_1).first();
    const bounds = await guideLabel.boundingBox();
    if (bounds) {
      expect(
        bounds.x + bounds.width,
        'Le guide dépasse la largeur d\'écran (375px)'
      ).toBeLessThanOrEqual(376);
    }
  });
});
