/**
 * Utilitaires partagés pour les tests Playwright SportLink.
 * Navigation tab-based (pas de router URL) — utilise sessionStorage sl-tab.
 */

export const TABS = {
  home: 'home',
  map: 'map',
  favoris: 'favoris',
  news: 'news',
  clubs: 'clubs',
  profil: 'profil',
};

export const VIEWPORTS = {
  iphoneSE: { width: 375, height: 667 },
  iphone15: { width: 393, height: 852 },
  pixel7: { width: 412, height: 915 },
  ipad: { width: 768, height: 1024 },
  desktop1440: { width: 1440, height: 900 },
  desktop1920: { width: 1920, height: 1080 },
};

/**
 * Navigue vers un tab en cliquant sur le BottomNav.
 * Attend que le contenu du tab soit visible.
 */
export async function navigateToTab(page, tabName) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Le BottomNav est en bas de l'écran
  const navButton = page.locator(`[data-tab="${tabName}"], nav button`).filter({
    hasText: new RegExp(getTabLabel(tabName), 'i'),
  });

  if (await navButton.count() > 0) {
    await navButton.first().click();
  } else {
    // Fallback : sessionStorage direct
    await page.evaluate((tab) => {
      sessionStorage.setItem('sl-tab', tab);
    }, tabName);
    await page.reload();
  }

  await page.waitForLoadState('networkidle');
}

function getTabLabel(tabName) {
  const labels = {
    home: 'accueil|home',
    map: 'carte|map',
    favoris: 'favoris',
    news: 'actualités|news|actu',
    clubs: 'clubs',
    profil: 'profil',
  };
  return labels[tabName] || tabName;
}

/**
 * Vérifie l'absence d'erreurs console critiques.
 * Retourne la liste des erreurs détectées.
 */
export function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
}

/**
 * Vérifie qu'il n'y a pas d'overflow horizontal (responsive check).
 */
export async function checkNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });
  return !overflow;
}

/**
 * Vérifie que les zones tactiles font au moins 44x44px.
 * Retourne les éléments trop petits.
 */
export async function checkTouchTargets(page) {
  return page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, [role="button"]');
    const tooSmall = [];
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          tooSmall.push({
            tag: el.tagName,
            text: el.textContent?.trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    });
    return tooSmall;
  });
}

/**
 * Attend que l'app soit chargée (AuthContext + providers).
 */
export async function waitForAppReady(page) {
  await page.goto('/');
  // Attend que le BottomNav soit visible (app montée)
  await page.waitForSelector('nav, [role="navigation"]', { timeout: 10000 }).catch(() => {
    // L'app peut afficher un écran de chargement
  });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Ouvre le hash deep link pour un club.
 */
export async function openClubPage(page, clubId) {
  await page.goto(`/#club/${clubId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Démarre la démo pour un profil donné.
 * Présuppose que le bouton démo est visible sur la HomePage.
 */
export async function startDemo(page, profileName) {
  await navigateToTab(page, 'home');
  const demoButton = page.getByRole('button', { name: /démo|demo/i });
  await demoButton.click();
  // Sélectionner le profil
  const profileButton = page.getByRole('button', { name: new RegExp(profileName, 'i') });
  await profileButton.click();
  await page.waitForLoadState('networkidle');
}
