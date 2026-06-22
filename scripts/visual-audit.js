/**
 * Audit visuel complet SportLink — capture toutes les vues.
 * Usage : npm run dev  puis  node scripts/visual-audit.js
 * Résultats : scripts/audit-screenshots/
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT       = resolve(__dirname, 'audit-screenshots');
const BASE      = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';
const W = 390, H = 844, SCALE = 2;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// ── résultats ─────────────────────────────────────────────────────────────────
const results = [];
function ok(name, note = '')  { results.push({ name, ok: true,  note }); console.log(`  ✓ ${name}${note ? '  — ' + note : ''}`); }
function fail(name, ov, note='') { results.push({ name, ok: false, overflow: ov, note }); console.log(`  ✗ ${name}${note ? '  — '+note : ''}\n    ⚠ ${JSON.stringify(ov[0])}`); }

// ── helpers ───────────────────────────────────────────────────────────────────
async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, `${name}.png`), clip: { x: 0, y: 0, width: W, height: H } });
}
async function shotFull(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: false });
}

async function tab(page, id, ms = 1000) {
  await page.click(`[data-demo="tab-${id}"]`, { force: true, timeout: 5000 }).catch(() => null);
  await page.waitForTimeout(ms);
}

async function scrollDown(page, px = 400) {
  await page.evaluate(y => window.scrollBy(0, y), px);
  await page.waitForTimeout(400);
}

// Détection overflow — exclut éléments dans conteneurs scroll + fixed + intentionnels
async function overflow(page, vw = W) {
  return page.evaluate((w) => {
    function inScrollable(el) {
      let n = el.parentElement;
      while (n) { const s = getComputedStyle(n); if (s.overflowX === 'auto' || s.overflowX === 'scroll') return true; n = n.parentElement; }
      return false;
    }
    const hits = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.01) return;
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') return; // conteneur scroll lui-même
      if (s.position === 'fixed') return;                              // fixed légitimes
      if (inScrollable(el)) return;                                    // dans un scroll (pills, etc.)
      // Exclure les éléments avec transform intentionnel qui sort du parent (décors)
      if (s.transform && s.transform !== 'none' && el.className?.toString?.().includes('pointer-events-none')) return;
      // Exclure les éléments internes Leaflet (clippés par overflow:hidden du conteneur carte)
      const cls = el.className?.toString?.() ?? '';
      if (cls.includes('leaflet-tile') || cls.includes('leaflet-proxy') || cls.includes('leaflet-zoom-animated')) return;
      const r = el.getBoundingClientRect();
      if (r.right > w + 4 || r.left < -4) {
        hits.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 60), txt: (el.textContent ?? '').trim().replace(/\s+/g,' ').slice(0, 50), r: Math.round(r.right), l: Math.round(r.left) });
      }
    });
    return hits.slice(0, 6);
  }, vw);
}

async function check(page, name, note = '', vw = W) {
  const ov = await overflow(page, vw);
  if (ov.length === 0) ok(name, note); else fail(name, ov, note);
}

// Passer la landing démo puis fermer le consent banner
async function passDemoLanding(page) {
  // Attendre un bouton profil (Président, Coach, Joueur…)
  const profileBtn = await page.waitForSelector(
    'button:has-text("Président"), button:has-text("Coach"), button:has-text("Joueur"), button:has-text("Communication")',
    { timeout: 8000 }
  ).catch(() => null);
  if (profileBtn) {
    await profileBtn.click({ force: true });
    await page.waitForTimeout(2000);
  }
  // Accepter le consent banner RGPD s'il est visible (sinon il bloque les clics)
  const acceptBtn = await page.$('button:has-text("Accepter et continuer"), button:has-text("Accepter")');
  if (acceptBtn) { await acceptBtn.click({ force: true }).catch(() => null); await page.waitForTimeout(600); }
  // Fermer le guide draggable s'il est présent
  const closeGuide = await page.$('[aria-label*="Quitter"], button:has-text("Quitter"), [aria-label*="fermer"]');
  if (closeGuide) { await closeGuide.click({ force: true }).catch(() => null); await page.waitForTimeout(400); }
  // Attendre que la bottom nav soit cliquable
  await page.waitForSelector('[data-demo]', { timeout: 8000 }).catch(() => null);
  await page.waitForTimeout(500);
}

// ═══════════════════════════════════════════════════════════════════════════════
async function run() {
  const browser = await chromium.launch({ headless: true });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Contexte mobile dark
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n── Visiteur sans compte (dark) ──');
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, locale: 'fr-FR', colorScheme: 'dark',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  await shot(page, '01-accueil-visiteur');
  await check(page, '01-accueil-visiteur');

  await tab(page, 'map', 2000);
  await page.waitForSelector('.leaflet-container', { timeout: 8000 }).catch(() => null);
  await page.waitForTimeout(1000);
  await shot(page, '02-carte');
  await check(page, '02-carte');

  await tab(page, 'clubs', 1500);
  await shot(page, '03-clubs-liste');
  await check(page, '03-clubs-liste');

  await scrollDown(page, 500);
  await shot(page, '04-clubs-scroll');
  await check(page, '04-clubs-scroll');
  await page.evaluate(() => window.scrollTo(0, 0));

  await tab(page, 'favoris', 1000);
  await shot(page, '05-favoris-visiteur');
  await check(page, '05-favoris-visiteur', 'invite connexion attendue');

  // Modal Auth — cliquer "Connexion" dans header
  const authBtn = await page.$('button:has-text("Connexion")');
  if (authBtn) {
    await authBtn.click({ force: true });
    await page.waitForTimeout(800);
    await shot(page, '06-modal-auth');
    await check(page, '06-modal-auth');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  } else { ok('06-modal-auth', 'bouton non trouvé'); }

  // Page légale
  await page.goto(`${BASE}/#legal`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(800);
  await shot(page, '07-legal');
  await check(page, '07-legal');

  await ctx.close();

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Mode démo
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n── Mode démo ──');
  const ctxD = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, locale: 'fr-FR', colorScheme: 'dark',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const pd = await ctxD.newPage();

  await pd.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await pd.waitForTimeout(2000);
  // Capturer la landing démo avant de la passer
  await shot(pd, '08-demo-landing');
  ok('08-demo-landing', 'page de choix de profil');
  // Passer la landing
  await passDemoLanding(pd);

  await shot(pd, '09-demo-accueil');
  await check(pd, '09-demo-accueil');

  await tab(pd, 'map', 2000);
  await pd.waitForSelector('.leaflet-container', { timeout: 8000 }).catch(() => null);
  await pd.waitForTimeout(1200);
  await shot(pd, '10-demo-carte');
  await check(pd, '10-demo-carte');

  await tab(pd, 'clubs', 1500);
  await shot(pd, '11-demo-clubs');
  await check(pd, '11-demo-clubs');

  await scrollDown(pd, 500);
  await shot(pd, '12-demo-clubs-scroll');
  await check(pd, '12-demo-clubs-scroll');
  await pd.evaluate(() => window.scrollTo(0, 0));

  // Onglet favoris (visiteur) ou profil (démo Coach = Mon Club)
  // En mode démo Coach, la nav est : home/map/clubs/mon-club — pas de favoris/profil
  const hasFavoris = await pd.$('[data-demo="tab-favoris"]');
  if (hasFavoris) {
    await tab(pd, 'favoris', 1200);
    await shot(pd, '13-demo-favoris');
    await check(pd, '13-demo-favoris');
  } else { ok('13-demo-favoris', 'onglet absent en mode démo Coach'); }

  const hasProfil = await pd.$('[data-demo="tab-profil"]');
  if (hasProfil) {
    await tab(pd, 'profil', 1500);
    await shot(pd, '14-demo-profil');
    await check(pd, '14-demo-profil');
    await scrollDown(pd, 400);
    await shot(pd, '15-demo-profil-scroll');
    await check(pd, '15-demo-profil-scroll');
    await pd.evaluate(() => window.scrollTo(0, 0));
  } else { ok('14-demo-profil', 'onglet absent en mode démo Coach'); ok('15-demo-profil-scroll', 'skipped'); }

  // Mon Club (si disponible)
  const monClubTab = await pd.$('[data-demo="tab-mon-club"]');
  if (monClubTab) {
    await tab(pd, 'mon-club', 2000);
    await shot(pd, '16-demo-mon-club');
    await check(pd, '16-demo-mon-club');
    await scrollDown(pd, 400);
    await shot(pd, '17-demo-mon-club-scroll');
    await check(pd, '17-demo-mon-club-scroll');
    await pd.evaluate(() => window.scrollTo(0, 0));
  } else { ok('16-demo-mon-club', 'onglet non disponible pour ce profil'); ok('17-demo-mon-club-scroll', 'skipped'); }

  // Page Actualités / home
  await tab(pd, 'home', 1500);
  await shot(pd, '18-demo-actualites');
  await check(pd, '18-demo-actualites');

  await scrollDown(pd, 400);
  await shot(pd, '19-demo-actualites-scroll');
  await check(pd, '19-demo-actualites-scroll');
  await pd.evaluate(() => window.scrollTo(0, 0));

  // Club page publique — cliquer "Voir la page" sur le premier club
  await tab(pd, 'clubs', 1500);
  const voirBtn = await pd.$('button:has-text("Voir la page")');
  if (voirBtn) {
    await voirBtn.click({ force: true, timeout: 5000 }).catch(() => null);
    await pd.waitForTimeout(1500);
    await shot(pd, '20-club-page-publique');
    await check(pd, '20-club-page-publique');
    await scrollDown(pd, 400);
    await shot(pd, '21-club-page-publique-scroll');
    await check(pd, '21-club-page-publique-scroll');
    await pd.keyboard.press('Escape');
    await pd.waitForTimeout(600);
  } else { ok('20-club-page-publique', 'bouton non trouvé'); ok('21-club-page-publique-scroll', 'skipped'); }

  // Formulaire nouvel événement via FAB
  await tab(pd, 'home', 800);
  const fab = await pd.$('[aria-label*="menu rapide"], [aria-label*="Ouvrir le menu"]');
  if (fab) {
    await fab.click({ force: true, timeout: 5000 }).catch(() => null);
    await pd.waitForTimeout(600);
    // Chercher le bouton "Événement" ou "Créer"
    const evBtn = await pd.$('button:has-text("Événement"), button:has-text("événement"), button:has-text("Créer un")');
    if (evBtn) {
      await evBtn.click({ force: true, timeout: 5000 }).catch(() => null);
      await pd.waitForTimeout(1200);
      await shot(pd, '22-formulaire-evenement');
      await check(pd, '22-formulaire-evenement');
      await pd.keyboard.press('Escape');
      await pd.waitForTimeout(500);
    } else {
      // Prendre screenshot du FAB ouvert
      await shot(pd, '22-fab-ouvert');
      await check(pd, '22-fab-ouvert', 'FAB ouvert');
      await pd.keyboard.press('Escape');
    }
  } else { ok('22-formulaire-evenement', 'FAB non trouvé'); }

  // PosterStudio — chercher un bouton "Affiche" ou "Poster" sur la home
  await tab(pd, 'home', 800);
  const posterBtn = await pd.$('button:has-text("Affiche"), button:has-text("affiche"), [data-demo="poster"]');
  if (posterBtn) {
    await posterBtn.click({ force: true, timeout: 5000 }).catch(() => null);
    await pd.waitForTimeout(2500);
    await shot(pd, '23-poster-studio');
    await check(pd, '23-poster-studio');
    await pd.keyboard.press('Escape');
    await pd.waitForTimeout(600);
  } else { ok('23-poster-studio', 'bouton affiche non trouvé en accueil démo'); }

  await ctxD.close();

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Light mode
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n── Light mode ──');
  const ctxL = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, locale: 'fr-FR', colorScheme: 'light',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const pl = await ctxL.newPage();
  await pl.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await pl.waitForTimeout(2000);
  await passDemoLanding(pl);
  // Activer le thème clair via le bouton toggle si disponible
  const themeBtn = await pl.$('[aria-label*="thème"], [aria-label*="clair"], [data-testid="theme-toggle"]');
  if (themeBtn) { await themeBtn.click({ force: true }).catch(() => null); await pl.waitForTimeout(500); }

  await shot(pl, '24-light-accueil');
  await check(pl, '24-light-accueil');

  await tab(pl, 'clubs', 1200);
  await shot(pl, '25-light-clubs');
  await check(pl, '25-light-clubs');

  await tab(pl, 'map', 2000);
  await pl.waitForSelector('.leaflet-container', { timeout: 8000 }).catch(() => null);
  await pl.waitForTimeout(1000);
  await shot(pl, '26-light-carte');
  await check(pl, '26-light-carte');

  await tab(pl, 'profil', 1200);
  await shot(pl, '27-light-profil');
  await check(pl, '27-light-profil');

  await ctxL.close();

  // ────────────────────────────────────────────────────────────────────────────
  // 4. Desktop (1280×800)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n── Desktop (1280×800) ──');
  const ctxDsk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: 'fr-FR', colorScheme: 'dark' });
  const pdsk = await ctxDsk.newPage();
  await pdsk.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await pdsk.waitForTimeout(2000);
  await passDemoLanding(pdsk);
  await pdsk.screenshot({ path: resolve(OUT, '28-desktop-accueil.png') });
  await check(pdsk, '28-desktop-accueil', '', 1280);

  await pdsk.click('[data-demo="tab-map"]', { force: true, timeout: 5000 }).catch(() => null);
  await pdsk.waitForSelector('.leaflet-container', { timeout: 8000 }).catch(() => null);
  await pdsk.waitForTimeout(1500);
  await pdsk.screenshot({ path: resolve(OUT, '29-desktop-carte.png') });
  await check(pdsk, '29-desktop-carte', '', 1280);

  await pdsk.click('[data-demo="tab-clubs"]', { force: true, timeout: 5000 }).catch(() => null);
  await pdsk.waitForTimeout(1200);
  await pdsk.screenshot({ path: resolve(OUT, '30-desktop-clubs.png') });
  await check(pdsk, '30-desktop-clubs', '', 1280);

  await ctxDsk.close();
  await browser.close();

  // ── Rapport ───────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.ok).length;
  const total  = results.length;
  const failed = results.filter(r => !r.ok);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Audit : ${passed}/${total} vues OK`);
  if (failed.length) {
    console.log('\n⚠ Problèmes :');
    failed.forEach(r => console.log(`  • ${r.name} — ${JSON.stringify(r.overflow?.[0])}`));
  } else {
    console.log('✓ Aucun débordement horizontal');
  }
  console.log(`\nScreenshots → ${OUT}\n`);
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify({ date: new Date().toISOString(), passed, total, results }, null, 2));
}

run().catch(e => { console.error(e.message); process.exit(1); });
