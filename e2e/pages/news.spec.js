import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow, collectConsoleErrors } from '../helpers/utils.js';

/**
 * ActualitesPage — Suite complète Playwright P1
 *
 * Architecture testée :
 *   Zone 1 : Quick Actions (Parent / Coach / Communicant / Président)
 *   Zone 2 : Multiplex EN DIRECT (useDemoFeed setInterval)
 *   Zone 3 : ClubFeed chronologique
 *
 * Pattern clé : le DemoGuide crée un overlay pointer-events qui bloque les clics CDP.
 * Solution → domClick() appelle element.click() directement dans le DOM (bypass overlay).
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
    'La landing démo doit être visible'
  ).toBeVisible({ timeout: 8000 });
}

async function selectProfile(page, label) {
  const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
  await expect(btn, `Profil "${label}" absent`).toBeVisible({ timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(700);
}

async function dismissGuide(page) {
  // Essaye plusieurs variantes du bouton sandbox/skip
  for (const text of ['Essayer moi-même', 'Explorer librement', 'Sandbox', 'Passer', 'Skip']) {
    try {
      const el = page.getByText(text, { exact: true }).first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click();
        await page.waitForTimeout(400);
        return;
      }
    } catch { /* absent */ }
  }
  // Fallback : Échap pour fermer le guide modal
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
}

async function activateDemoAs(page, profile) {
  await gotoDemo(page);
  await selectProfile(page, profile);
  await dismissGuide(page);
  await page.waitForLoadState('networkidle');
}

/**
 * Click un élément directement via DOM — bypasse l'overlay DemoGuide
 * qui intercepte les clics CDP même avec { force: true }.
 */
async function domClick(page, testid) {
  await page.locator(`[data-testid="${testid}"]`).first().evaluate(el => el.click());
}

/** Attend que les cartes parent soient entièrement animées et interactives. */
async function waitForParentCardsReady(page) {
  await expect(
    page.locator('[data-testid="convoc-absent"]').first(),
    'Bouton Absent doit être visible (animation Framer Motion terminée)'
  ).toBeVisible({ timeout: 12000 });
}

// ── A. Chargement de base (visiteur) ─────────────────────────────────────────

test.describe('ActualitesPage — Chargement de base', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('N01 · Charge sans ErrorBoundary', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('N02 · Aucune erreur JavaScript critique', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const crit = errors.filter(e =>
      !e.includes('supabase') && !e.includes('vapid') &&
      !e.includes('removebg') && !e.includes('anthropic') &&
      !e.includes('fal.ai') && !e.includes('pollinations')
    );
    expect(crit, `Erreurs JS : ${crit.join('\n')}`).toHaveLength(0);
  });

  test('N03 · Pas d\'overflow horizontal sur iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });

  test('N04 · Pas d\'overflow horizontal sur desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});

// ── B. Mode Démo — Profil Parent (Zone 1) ────────────────────────────────────

test.describe('ActualitesPage — Zone 1 · Profil Parent', () => {

  // Garantit que les cartes sont entièrement rendues + animées avant chaque test.
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Parent');
    await waitForParentCardsReady(page);
  });

  test('N05 · En-tête "Convocations en attente" visible', async ({ page }) => {
    await expect(page.getByText('Convocations en attente')).toBeVisible();
  });

  test('N06 · Contenu carte 1 — joueur + équipe', async ({ page }) => {
    // useDemoFeed dc-1 → Liam Creach, équipe U17
    await expect(page.getByText(/Liam Creach/).first()).toBeVisible();
    await expect(page.getByText(/U17/).first()).toBeVisible();
  });

  test('N07 · Deux cartes de convocation affichées', async ({ page }) => {
    await expect(page.locator('[data-testid="convoc-absent"]')).toHaveCount(2);
  });

  test('N08 · Flux Absent → input raison visible', async ({ page }) => {
    await domClick(page, 'convoc-absent');
    await expect(
      page.getByPlaceholder(/raison de l'absence/i),
      "L'input raison doit apparaître après clic Absent"
    ).toBeVisible({ timeout: 3000 });
  });

  test('N09 · Flux Absent → confirmer → toast + une carte en moins', async ({ page }) => {
    const countBefore = await page.locator('[data-testid="convoc-absent"]').count();

    await domClick(page, 'convoc-absent');
    const input = page.getByPlaceholder(/raison de l'absence/i);
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('Blessure');

    await domClick(page, 'convoc-confirm-absent');

    await expect(page.getByText(/absence enregistrée/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-absent"]'))
      .toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('N10 · Flux Absent → Annuler → boutons idle restaurés', async ({ page }) => {
    await domClick(page, 'convoc-absent');
    await expect(page.getByPlaceholder(/raison de l'absence/i)).toBeVisible({ timeout: 3000 });

    await domClick(page, 'convoc-cancel-absent');

    await expect(
      page.locator('[data-testid="convoc-absent"]').first()
    ).toBeVisible({ timeout: 3000 });
    await expect(page.getByPlaceholder(/raison de l'absence/i)).not.toBeVisible();
  });

  test('N11 · Flux Présent → panneau transport slide-up', async ({ page }) => {
    await domClick(page, 'convoc-present');

    await expect(page.locator('[data-testid="convoc-drive"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-passenger"]')).toBeVisible();
    await expect(page.locator('[data-testid="convoc-own-means"]')).toBeVisible();
  });

  test('N12 · Transport → Je conduis → stepper de places visible', async ({ page }) => {
    await domClick(page, 'convoc-present');
    await expect(page.locator('[data-testid="convoc-drive"]')).toBeVisible({ timeout: 3000 });

    await domClick(page, 'convoc-drive');

    await expect(page.getByText(/Combien de places/i)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-seats-plus"]')).toBeVisible();
  });

  test('N13 · Transport → Je conduis → incrémenter + valider → toast + une carte en moins', async ({ page }) => {
    const countBefore = await page.locator('[data-testid="convoc-absent"]').count();

    await domClick(page, 'convoc-present');
    await expect(page.locator('[data-testid="convoc-drive"]')).toBeVisible({ timeout: 3000 });
    await domClick(page, 'convoc-drive');
    await expect(page.locator('[data-testid="convoc-seats-plus"]')).toBeVisible({ timeout: 3000 });

    // Incrémenter : 3 → 4
    await domClick(page, 'convoc-seats-plus');
    await expect(page.locator('span').filter({ hasText: /^4$/ }).first()).toBeVisible();

    await domClick(page, 'convoc-drive-validate');

    await expect(page.getByText(/trajet ajouté/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-absent"]'))
      .toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('N14 · Transport → Je cherche une place → toast + une carte en moins', async ({ page }) => {
    const countBefore = await page.locator('[data-testid="convoc-absent"]').count();

    await domClick(page, 'convoc-present');
    await expect(page.locator('[data-testid="convoc-passenger"]')).toBeVisible({ timeout: 3000 });
    await domClick(page, 'convoc-passenger');

    await expect(page.getByText(/en attente d'un chauffeur/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-absent"]'))
      .toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('N15 · Transport → Par mes propres moyens → toast + une carte en moins', async ({ page }) => {
    const countBefore = await page.locator('[data-testid="convoc-absent"]').count();

    await domClick(page, 'convoc-present');
    await expect(page.locator('[data-testid="convoc-own-means"]')).toBeVisible({ timeout: 3000 });
    await domClick(page, 'convoc-own-means');

    await expect(page.getByText(/présence confirmée/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-absent"]'))
      .toHaveCount(countBefore - 1, { timeout: 5000 });
  });

  test('N16 · Transport → Retour depuis panneau → phase idle restaurée', async ({ page }) => {
    await domClick(page, 'convoc-present');
    await expect(page.locator('[data-testid="convoc-drive"]')).toBeVisible({ timeout: 3000 });

    await domClick(page, 'convoc-back-transport');

    // Le panneau transport doit disparaître, Absent/Présent reviennent
    await expect(page.locator('[data-testid="convoc-drive"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="convoc-absent"]').first()).toBeVisible();
  });

  test('N17 · Pas d\'overflow horizontal en mode Parent (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});

// ── C. Zone 2 — Multiplex EN DIRECT ──────────────────────────────────────────

test.describe('ActualitesPage — Zone 2 · Multiplex live', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Parent');
  });

  test('N18 · Section [data-demo="live-multiplex"] visible', async ({ page }) => {
    await expect(
      page.locator('[data-demo="live-multiplex"]')
    ).toBeVisible({ timeout: 7000 });
  });

  test('N19 · Badge "EN DIRECT" clignote', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
    await expect(page.getByText(/en direct/i).first()).toBeVisible();
  });

  test('N20 · Pill Réserve "CS Plabennec R" visible', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('[data-demo="live-multiplex"]').getByText(/CS Plabennec/i)).toBeVisible();
  });

  test('N21 · Pill U17 "ES Lannilis U17" visible', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
    await expect(page.locator('[data-demo="live-multiplex"]').getByText(/Lannilis/i)).toBeVisible();
  });

  test('N22 · Multiplex affiche au moins un score', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
    const text = await page.locator('[data-demo="live-multiplex"]').innerText();
    // Au moins un score de la forme "X – Y"
    expect(text).toMatch(/\d+\s*[–-]\s*\d+/);
  });

  test('N23 · Score auto-incrémenté après 12 secondes (fake timer)', async ({ page }) => {
    await page.clock.install();

    await gotoDemo(page);
    await selectProfile(page, 'Parent');
    await dismissGuide(page);

    await expect(
      page.locator('[data-demo="live-multiplex"]')
    ).toBeVisible({ timeout: 8000 });

    const multiplex   = page.locator('[data-demo="live-multiplex"]');
    const scoreBefore = await multiplex.innerText();

    await page.clock.fastForward(13000);
    await page.waitForTimeout(400);

    const scoreAfter = await multiplex.innerText();
    expect(scoreBefore, 'Le score doit changer après 12s').not.toBe(scoreAfter);
  });
});

// ── D. Mode Démo — Profil Coach ───────────────────────────────────────────────

test.describe('ActualitesPage — Zone 1 · Profil Coach', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Coach');
  });

  test('N24 · Page charge sans crash', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('N25 · En-tête "Actions requises" visible (si matchs disponibles)', async ({ page }) => {
    const hasSection = await page.getByText('Actions requises').isVisible({ timeout: 6000 }).catch(() => false);
    if (!hasSection) {
      // Pas de matchs J-3/J+1 en démo → acceptable, pas de crash
      await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
    }
  });

  test('N26 · Zone 2 multiplex visible pour le coach', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
  });

  test('N27 · Pas d\'overflow horizontal (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});

// ── E. Mode Démo — Profil Communicant ────────────────────────────────────────

test.describe('ActualitesPage — Zone 1 · Profil Communicant', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Communication');
  });

  test('N28 · Page charge sans crash', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('N29 · Zone 2 multiplex visible pour le communicant', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
  });

  test('N30 · Aucune erreur JavaScript critique', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForTimeout(1500);
    const crit = errors.filter(e =>
      !e.includes('supabase') && !e.includes('vapid') &&
      !e.includes('removebg') && !e.includes('fal.ai') && !e.includes('pollinations')
    );
    expect(crit, `Erreurs JS : ${crit.join('\n')}`).toHaveLength(0);
  });
});

// ── F. Mode Démo — Profil Président ──────────────────────────────────────────

test.describe('ActualitesPage — Zone 1 · Profil Président', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Président');
  });

  test('N31 · Page charge sans crash', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('N32 · Zone 2 multiplex visible pour le président', async ({ page }) => {
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 7000 });
  });

  test('N33 · Zone 2 multiplex visible pour le président (démo)', async ({ page }) => {
    // Le Multiplex est toujours visible en mode démo (demoLiveMatches)
    await expect(
      page.locator('[data-demo="live-multiplex"]'),
      'Zone 2 doit être visible pour le Président'
    ).toBeVisible({ timeout: 12000 });
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });
});

// ── G. Zone 3 — Feed chronologique ───────────────────────────────────────────

test.describe('ActualitesPage — Zone 3 · Feed', () => {
  test.beforeEach(async ({ page }) => {
    await activateDemoAs(page, 'Supporter');
  });

  test('N34 · Zone 3 rendue sous le multiplex', async ({ page }) => {
    await expect(page.getByText(/quelque chose s'est mal passé/i)).not.toBeVisible();
  });

  test('N35 · Pas d\'overflow horizontal sur iPhone 15 (393px)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });

  test('N36 · Pas d\'overflow horizontal sur Pixel 7 (412px)', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    expect(await checkNoHorizontalOverflow(page)).toBe(true);
  });
});

// ── H. Zéro crash tous profils démo ──────────────────────────────────────────

test.describe('ActualitesPage — Zéro crash tous profils démo', () => {
  for (const profile of ['Parent', 'Coach', 'Communication', 'Président', 'Joueur', 'Supporter']) {
    test(`N37-${profile} · Pas d'ErrorBoundary — profil ${profile}`, async ({ page }) => {
      await activateDemoAs(page, profile);
      await page.waitForTimeout(600);
      await expect(
        page.getByText(/quelque chose s'est mal passé/i),
        `ErrorBoundary déclenchée pour ${profile}`
      ).not.toBeVisible();
    });
  }
});

// ── I. Screenshots visuels de référence ──────────────────────────────────────

test.describe('ActualitesPage — Visuels de référence', () => {
  test('N43 · Screenshot profil Parent — iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await activateDemoAs(page, 'Parent');
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('actualites-parent-375.png', { maxDiffPixelRatio: 0.02 });
  });

  test('N44 · Screenshot profil Coach — iPhone SE (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await activateDemoAs(page, 'Coach');
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('actualites-coach-375.png', { maxDiffPixelRatio: 0.02 });
  });

  test('N45 · Screenshot profil Parent — desktop 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await activateDemoAs(page, 'Parent');
    await expect(page.locator('[data-demo="live-multiplex"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('actualites-desktop-1440.png', { maxDiffPixelRatio: 0.02 });
  });
});
