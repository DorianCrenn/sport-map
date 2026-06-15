import { test, expect } from '@playwright/test';

/**
 * Tests responsive automatisés — tous appareils définis dans SPORTLINK_QA_RULES.md
 * Détecte : overflow horizontal, éléments hors écran, zones tactiles trop petites.
 */

const PAGES_TO_TEST = [
  { name: 'Accueil', tab: 'home', selector: null },
  { name: 'Carte', tab: 'map', selector: null },
  { name: 'Clubs', tab: 'clubs', selector: null },
  { name: 'Actualités', tab: 'news', selector: null },
  { name: 'Favoris', tab: 'favoris', selector: null },
];

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 15', width: 393, height: 852 },
  { name: 'Pixel 7', width: 412, height: 915 },
  { name: 'Galaxy S22', width: 360, height: 780 },
  { name: 'Desktop 1440', width: 1440, height: 900 },
];

async function navigateToTab(page, tabName) {
  const labels = {
    home: /accueil|home|agenda/i,
    map: /carte|map/i,
    clubs: /clubs/i,
    news: /actu|news|agenda/i,
    favoris: /favoris|sauvegardés/i,
  };
  const btn = page.getByRole('button', { name: labels[tabName] }).last();
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click({ force: true });
    // SPA : pas de chargement de page — juste attendre le re-rendu
    await page.waitForTimeout(600);
  }
}

async function checkOverflow(page) {
  return page.evaluate(() => {
    // overflow-x:hidden est défini sur html/body/#root dans index.css.
    // On vérifie si le contenu non-fixed dépasse la largeur visible.
    // Stratégie : utiliser document.documentElement.scrollWidth avec tolérance de 2px.
    // Les éléments fixed (BottomNav, FAB, modales) sont exclus de scrollWidth par le navigateur
    // quand overflow-x:hidden est appliqué à l'ancêtre.
    const vw = window.innerWidth;
    const sw = document.documentElement.scrollWidth;
    return {
      hasHorizontalOverflow: sw > vw + 2,
      scrollWidth: sw,
      windowWidth: vw,
    };
  });
}

async function checkSmallTouchTargets(page) {
  return page.evaluate(() => {
    const interactive = document.querySelectorAll('button:not([hidden]), a:not([hidden])');
    const small = [];
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.width < 40 && rect.height < 40) {
        small.push({
          text: el.textContent?.trim().slice(0, 20),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    });
    return small.slice(0, 10);
  });
}

test.describe('Responsive — aucun overflow horizontal', () => {
  for (const viewport of VIEWPORTS) {
    for (const pageInfo of PAGES_TO_TEST) {
      test(`${pageInfo.name} sans overflow sur ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await navigateToTab(page, pageInfo.tab);
        // Attendre que les animations (Framer Motion) et les fetches initiaux se stabilisent
        await page.waitForTimeout(800);
        // Second check après 500ms supplémentaires si le premier échoue (anti-flaky animations)
        let result = await checkOverflow(page);
        if (result.hasHorizontalOverflow) {
          await page.waitForTimeout(500);
          result = await checkOverflow(page);
        }
        expect(
          result.hasHorizontalOverflow,
          `Overflow horizontal sur ${pageInfo.name} à ${viewport.width}px : scrollWidth=${result.scrollWidth} > windowWidth=${result.windowWidth}`
        ).toBe(false);
      });
    }
  }
});

test.describe('Responsive — pas de crash Error Boundary', () => {
  for (const viewport of VIEWPORTS.filter((v) => v.width <= 430)) {
    test(`aucun crash React sur mobile ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      for (const pageInfo of PAGES_TO_TEST) {
        await navigateToTab(page, pageInfo.tab);
        await page.waitForTimeout(300);
        const errorBoundary = page.getByText(/quelque chose s'est mal passé|something went wrong/i);
        await expect(
          errorBoundary,
          `Error Boundary déclenché sur ${pageInfo.name} à ${viewport.width}px`
        ).not.toBeVisible();
      }
    });
  }
});

test.describe('Responsive — zones tactiles (mobile uniquement)', () => {
  test('zones tactiles ≥ 40px sur iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const smallTargets = await checkSmallTouchTargets(page);
    // Warn mais ne pas bloquer — certains petits boutons (icônes) peuvent être intentionnels
    if (smallTargets.length > 0) {
      console.warn(
        `⚠️ ${smallTargets.length} zones tactiles < 40px sur iPhone SE :`,
        smallTargets
      );
    }
    // Bloquer si plus de 5 boutons trop petits (seuil raisonnable)
    expect(smallTargets.length).toBeLessThan(6);
  });
});

test.describe('Responsive — BottomNav sur petits écrans', () => {
  test('BottomNav visible et complet sur iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();

    // Vérifier que le nav n'est pas coupé
    const navBounds = await nav.boundingBox();
    if (navBounds) {
      expect(navBounds.x).toBeGreaterThanOrEqual(0);
      expect(navBounds.x + navBounds.width).toBeLessThanOrEqual(380);
    }
  });

  test('BottomNav visible et complet sur Galaxy S22 (360px)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav').last();
    await expect(nav).toBeVisible();
  });
});

test.describe('Responsive — modales et overlays', () => {
  test('EventFormModal ne sort pas de l\'écran sur iPhone SE', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const createBtn = page.getByRole('button', { name: /créer|nouveau|ajouter/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible()) {
        const bounds = await modal.boundingBox();
        if (bounds) {
          expect(bounds.x).toBeGreaterThanOrEqual(-1);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(376);
        }
      }
    }
  });
});
