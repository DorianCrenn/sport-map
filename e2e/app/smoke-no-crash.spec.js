// ─────────────────────────────────────────────────────────────────────────────
// Smoke anti-crash : lance réellement l'app sur les surfaces critiques et échoue
// si l'ErrorBoundary s'affiche ("Une erreur est survenue") OU si une erreur JS
// de code (RangeError/TypeError/ReferenceError) remonte non catchée.
// Complète les tests unitaires, qui ne détectent pas les crashs runtime :
// ce smoke a déjà attrapé un `RangeError: Invalid time value` (date invalide
// dans useWeekendPosters) que 1958 tests unitaires verts n'avaient pas vu.
// ─────────────────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

const CRASH_TEXT = 'Une erreur est survenue';
// Erreurs de CODE (bugs) — on ignore le bruit réseau/annulations.
const CODE_ERROR = /RangeError|TypeError|ReferenceError|Invalid time value|is not a function|Cannot read/i;

/** Attache un collecteur d'erreurs JS non catchées à la page. */
function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => { if (CODE_ERROR.test(e.message)) errors.push(e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && CODE_ERROR.test(m.text())) errors.push(m.text()); });
  return errors;
}

/** Échoue si l'ErrorBoundary est monté ou si une erreur de code a remonté. */
async function expectHealthy(page, errors, label) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400); // laisse les effets/realtime se déclencher
  await expect(page.getByText(CRASH_TEXT), `ErrorBoundary affiché sur : ${label}`).toHaveCount(0);
  expect(errors, `Erreur JS non catchée sur ${label} : ${errors.join(' | ')}`).toEqual([]);
}

test.describe('Smoke — aucune ErrorBoundary ni erreur JS sur les surfaces critiques', () => {
  test('page d\'accueil (visiteur)', async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto('/');
    await expectHealthy(page, errs, 'accueil visiteur');
  });

  test('mode démo — cockpit (ActualitesPage / QuickActions)', async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto('/demo');
    await expectHealthy(page, errs, 'démo cockpit');
  });

  test('mode démo — navigation entre onglets', async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto('/demo');
    await expectHealthy(page, errs, 'démo (avant nav)');
    for (const tab of ['map', 'clubs', 'favoris', 'profil', 'home']) {
      await page.evaluate((t) => sessionStorage.setItem('sl-tab', t), tab);
      await page.reload();
      await expectHealthy(page, errs, `onglet ${tab}`);
    }
  });

  test('page club via deep-link (#club/:id)', async ({ page }) => {
    const errs = trackErrors(page);
    // Club statique stable (US Brest Football) → rend ClubPageView sans dépendre
    // du réseau ni d'un clic fragile.
    await page.goto('/#club/1');
    await expectHealthy(page, errs, 'page club #club/1');
  });

  test('page légale (mentions)', async ({ page }) => {
    const errs = trackErrors(page);
    await page.goto('/#legal');
    await expectHealthy(page, errs, 'legal');
  });
});
