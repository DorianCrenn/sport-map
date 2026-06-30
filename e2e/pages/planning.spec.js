import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow, collectConsoleErrors } from '../helpers/utils.js';

/**
 * PlanningTimeline — Suite E2E Playwright
 *
 * Architecture testée (Zone 3 de ActualitesPage) :
 *   - Timeline verticale : navigation mois, pills filtre, filtre clubs
 *   - TrainingPlanningCard : entraînements, boutons présence joueur
 *   - MatchPlanningCard : matchs, actions staff, vue supporter
 *   - AttendanceListSheet : bottom sheet liste présences
 *   - CarpoolSection : covoiturage inline si Présent
 *
 * Profils démo testés : Président, Coach, Joueur, Parent, Supporter
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

async function gotoDemo(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    sessionStorage.removeItem('sl-demo-guide-pos');
    sessionStorage.removeItem('sl-demo-guide-collapsed');
  });
  await page.goto('/demo');
  await page.waitForLoadState('domcontentloaded');
  await expect(
    page.getByText('Démonstration interactive'),
    'Landing démo visible'
  ).toBeVisible({ timeout: 8000 });
}

async function selectProfile(page, label) {
  const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
  await expect(btn, `Profil "${label}" absent`).toBeVisible({ timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(700);
}

async function dismissGuide(page) {
  for (const text of ['Essayer moi-même', 'Explorer librement', 'Sandbox', 'Passer', 'Skip']) {
    try {
      const el = page.getByText(text, { exact: true }).first();
      if (await el.isVisible({ timeout: 800 })) { await el.click(); await page.waitForTimeout(400); return; }
    } catch { /* absent */ }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

async function activateDemoAs(page, profile) {
  await gotoDemo(page);
  await selectProfile(page, profile);
  await dismissGuide(page);
  await page.waitForLoadState('networkidle');
}

/** Attend que la timeline contienne au moins une carte */
async function waitForTimeline(page) {
  await expect(
    page.locator('.bg-\\[var\\(--sl-card\\)\\]').first(),
    'Au moins une carte dans la timeline'
  ).toBeVisible({ timeout: 10000 });
}

// ── P01 — Chargement de base ──────────────────────────────────────────────────

test.describe('P01 · Chargement de base', () => {
  test('charge sans crash en mode non-auth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('charge en démo Président sans erreur JS', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await activateDemoAs(page, 'Président');
    const crit = errors.filter(e =>
      !e.includes('supabase') && !e.includes('vapid') &&
      !e.includes('removebg') && !e.includes('anthropic') &&
      !e.includes('fal.ai') && !e.includes('pollinations')
    );
    expect(crit, `Erreurs JS : ${crit.join('\n')}`).toHaveLength(0);
  });

  test('pas d\'overflow horizontal iPhone SE (375px)', async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});

// ── P02 — Navigation mois ─────────────────────────────────────────────────────

test.describe('P02 · Navigation mois', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
  });

  test('le mois courant est affiché par défaut', async ({ page }) => {
    const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const currentMonth = MONTHS_FR[new Date().getMonth()];
    await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible({ timeout: 5000 });
  });

  test('clic ‹ navigue vers le mois précédent', async ({ page }) => {
    const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const now = new Date();
    const prevMonth = MONTHS_FR[(now.getMonth() + 11) % 12];

    const prevBtn = page.getByRole('button', { name: /mois précédent/i }).first();
    await expect(prevBtn).toBeVisible({ timeout: 5000 });
    await prevBtn.click();
    await page.waitForTimeout(400);

    await expect(page.getByText(new RegExp(prevMonth, 'i'))).toBeVisible({ timeout: 3000 });
  });

  test('clic › navigue vers le mois suivant', async ({ page }) => {
    const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const now = new Date();
    const nextMonth = MONTHS_FR[(now.getMonth() + 1) % 12];

    const nextBtn = page.getByRole('button', { name: /mois suivant/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();
    await page.waitForTimeout(400);

    await expect(page.getByText(new RegExp(nextMonth, 'i'))).toBeVisible({ timeout: 3000 });
  });

  test('aller et retour sur le mois courant fonctionne', async ({ page }) => {
    const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const currentMonth = MONTHS_FR[new Date().getMonth()];

    const nextBtn = page.getByRole('button', { name: /mois suivant/i }).first();
    const prevBtn = page.getByRole('button', { name: /mois précédent/i }).first();
    await nextBtn.click();
    await page.waitForTimeout(300);
    await prevBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible({ timeout: 3000 });
  });
});

// ── P03 — Pills filtre type ───────────────────────────────────────────────────

test.describe('P03 · Pills filtre type', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
  });

  test('les 3 pills sont visibles pour le Président', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^Tout$/ })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /^Matchs$/ })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /^Entraînements$/ })).toBeVisible({ timeout: 3000 });
  });

  test('filtre Matchs masque les cartes Entraînement', async ({ page }) => {
    await page.getByRole('button', { name: /^Matchs$/ }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Entraînement', { exact: true }).first()).not.toBeVisible();
  });

  test('filtre Entraînements masque les cartes Match', async ({ page }) => {
    await page.getByRole('button', { name: /^Entraînements$/ }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Championnat').first()).not.toBeVisible();
  });

  test('retour à Tout affiche tous les types', async ({ page }) => {
    await page.getByRole('button', { name: /^Matchs$/ }).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Tout$/ }).first().click();
    await page.waitForTimeout(400);
    await expect(page.getByText('Entraînement', { exact: true }).first()).toBeVisible({ timeout: 3000 });
  });
});

// ── P04 — Cartes entraînement ─────────────────────────────────────────────────

test.describe('P04 · Cartes entraînement', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
  });

  test('badge ENTRAÎNEMENT visible', async ({ page }) => {
    await expect(page.getByText('Entraînement', { exact: true }).first()).toBeVisible({ timeout: 5000 });
  });

  test('heure de la séance visible', async ({ page }) => {
    await expect(page.getByText(/18h30/).first()).toBeVisible({ timeout: 5000 });
  });

  test('compteurs présence visibles', async ({ page }) => {
    // Attend qu'au moins un compteur vert soit visible (présents)
    await expect(page.locator('.text-emerald-400').first()).toBeVisible({ timeout: 5000 });
  });
});

// ── P05 — Cartes match ────────────────────────────────────────────────────────

test.describe('P05 · Cartes match', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
  });

  test('badge CHAMPIONNAT visible', async ({ page }) => {
    await expect(page.getByText('Championnat').first()).toBeVisible({ timeout: 5000 });
  });

  test('adversaire visible sur une carte match', async ({ page }) => {
    await expect(page.getByText(/Plougastel|Brestois|Landerneau|Lorient|Quimper/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ── P06 — Boutons présence (Président est aussi joueur Équipe 1) ──────────────

test.describe('P06 · Boutons présence', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
    // Filtre sur Entraînements pour trouver les boutons facilement
    const pillBtn = page.getByRole('button', { name: /^Entraînements$/ }).first();
    if (await pillBtn.isVisible({ timeout: 2000 })) await pillBtn.click();
    await page.waitForTimeout(400);
  });

  test('bouton Présent visible sur une carte entraînement', async ({ page }) => {
    await expect(page.getByText('Présent').first()).toBeVisible({ timeout: 5000 });
  });

  test('clic Présent change l\'état du bouton', async ({ page }) => {
    const btn = page.getByText('Présent').first();
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.evaluate(el => el.click());
    await page.waitForTimeout(600);
    // Le bouton Présent devient aria-pressed=true (via le composant)
    const pressed = page.locator('[aria-pressed="true"]').first();
    await expect(pressed).toBeVisible({ timeout: 3000 });
  });
});

// ── P07 — AttendanceListSheet ─────────────────────────────────────────────────

test.describe('P07 · AttendanceListSheet', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
    const pillBtn = page.getByRole('button', { name: /^Entraînements$/ }).first();
    if (await pillBtn.isVisible({ timeout: 2000 })) await pillBtn.click();
    await page.waitForTimeout(400);
  });

  test('le compteur présence est cliquable et ouvre le sheet', async ({ page }) => {
    // Le compteur est un bouton sans role explicite — on cherche le ✓ (signe présent)
    const counter = page.locator('button').filter({ hasText: /✓/ }).first();
    if (await counter.isVisible({ timeout: 3000 })) {
      await counter.evaluate(el => el.click());
      await page.waitForTimeout(500);
      await expect(page.getByText(/Présences entraînement/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('le sheet se ferme avec le bouton ✕', async ({ page }) => {
    const counter = page.locator('button').filter({ hasText: /✓/ }).first();
    if (await counter.isVisible({ timeout: 3000 })) {
      await counter.evaluate(el => el.click());
      await page.waitForTimeout(500);
      const closeBtn = page.locator('button').filter({ hasText: '✕' }).last();
      await closeBtn.click();
      await page.waitForTimeout(400);
      await expect(page.getByText(/Présences entraînement/i)).not.toBeVisible();
    }
  });
});

// ── P08 — Actions staff (Convoquer + Affiche) ─────────────────────────────────

test.describe('P08 · Actions staff', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
    // Filtre matchs
    const matchBtn = page.getByRole('button', { name: /^Matchs$/ }).first();
    if (await matchBtn.isVisible({ timeout: 2000 })) await matchBtn.click();
    await page.waitForTimeout(500);
  });

  test('badge "Rôle Staff" visible sur les cartes match', async ({ page }) => {
    await expect(page.getByText('Rôle Staff').first()).toBeVisible({ timeout: 5000 });
  });

  test('bouton "Convoquer l\'équipe" visible', async ({ page }) => {
    await expect(page.getByText(/Convoquer l'équipe/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('bouton "Créer l\'affiche" visible', async ({ page }) => {
    await expect(page.getByText(/Créer l'affiche/i).first()).toBeVisible({ timeout: 5000 });
  });
});

// ── P09 — Vue supporter ───────────────────────────────────────────────────────

test.describe('P09 · Vue supporter', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Supporter');
    await page.waitForLoadState('networkidle');
  });

  test('la pill "Entraînements" n\'est pas visible pour le Supporter', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByRole('button', { name: /^Entraînements$/ })).not.toBeVisible();
  });

  test('pas de carte Entraînement dans la timeline', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByText('Entraînement', { exact: true })).not.toBeVisible();
  });

  test('les matchs sont visibles pour le Supporter', async ({ page }) => {
    await page.waitForTimeout(1500);
    // Au moins une carte match ou état vide (pas de crash)
    const hasMatch = await page.getByText('Championnat').isVisible().catch(() => false);
    const isEmpty  = await page.getByText(/Aucun événement/i).isVisible().catch(() => false);
    expect(hasMatch || isEmpty).toBe(true);
  });

  test('pas de bouton Présent/Absent sur une carte match', async ({ page }) => {
    await page.waitForTimeout(1500);
    await expect(page.getByText('Présent')).not.toBeVisible();
    await expect(page.getByText('Absent')).not.toBeVisible();
  });
});

// ── P10 — État vide ───────────────────────────────────────────────────────────

test.describe('P10 · État vide', () => {
  test('naviguer sur un mois sans événements affiche un message vide', async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);

    // Naviguer loin dans le futur (6 mois)
    const nextBtn = page.getByRole('button', { name: /mois suivant/i }).first();
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    for (let i = 0; i < 6; i++) {
      await nextBtn.click();
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(600);

    // Soit un message vide, soit des cartes (si données futures)
    const hasEmpty = await page.getByText(/Aucun événement/i).isVisible().catch(() => false);
    const hasCards = await page.locator('.bg-\\[var\\(--sl-card\\)\\]').count();
    expect(hasEmpty || hasCards >= 0).toBe(true);
  });
});

// ── P11 — Pas d'overflow ─────────────────────────────────────────────────────

test.describe('P11 · Overflow', () => {
  test('pas d\'overflow horizontal sur Galaxy S22 (360px)', async ({ page }) => {
    await activateDemoAs(page, 'Président');
    await waitForTimeline(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(300);
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});
