/**
 * Audit visuel complet SportLink — 75+ écrans, tous profils, admin, modaux
 * Usage  : npm run dev  puis  node scripts/visual-audit-full.js
 * Output : scripts/audit-full/
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = resolve(__dir, 'audit-full');
const BASE  = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';
const W = 390, H = 844, SCALE = 2;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

/* ── résultats ───────────────────────────────────────────────────────────── */
const results = [];
function pass(n, note='')  { results.push({n,s:'ok',note});   console.log(`  ✓ ${n}${note?' — '+note:''}`); }
function warn(n, note='')  { results.push({n,s:'warn',note}); console.log(`  ⚠ ${n} — ${note}`); }
function skip(n, note='')  { results.push({n,s:'skip',note}); console.log(`  · ${n} — ${note}`); }

/* ── browser contexts ────────────────────────────────────────────────────── */
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
async function mobileCx(browser, scheme='dark') {
  return browser.newContext({ viewport:{width:W,height:H}, deviceScaleFactor:SCALE, locale:'fr-FR', colorScheme:scheme, userAgent:MOBILE_UA });
}
async function desktopCx(browser) {
  return browser.newContext({ viewport:{width:1280,height:800}, deviceScaleFactor:1, locale:'fr-FR', colorScheme:'dark' });
}

/* ── overflow detector ───────────────────────────────────────────────────── */
async function checkOv(page, vw=W) {
  return page.evaluate(w => {
    function inScroll(el) {
      let n = el.parentElement;
      while (n) { const s=getComputedStyle(n); if(s.overflowX==='auto'||s.overflowX==='scroll')return true; n=n.parentElement; }
      return false;
    }
    const hits=[];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if(s.display==='none'||s.visibility==='hidden'||parseFloat(s.opacity)<0.01)return;
      if(s.overflowX==='auto'||s.overflowX==='scroll')return;
      if(s.position==='fixed')return;
      if(inScroll(el))return;
      const cls = el.className?.toString?.()??'';
      if(cls.includes('leaflet-tile')||cls.includes('leaflet-proxy')||cls.includes('leaflet-zoom-animated'))return;
      if(s.transform&&s.transform!=='none'&&cls.includes('pointer-events-none'))return;
      const r=el.getBoundingClientRect();
      if(r.right>w+4||r.left<-4)
        hits.push({tag:el.tagName,cls:cls.slice(0,60),txt:(el.textContent??'').trim().replace(/\s+/g,' ').slice(0,50),r:Math.round(r.right),l:Math.round(r.left)});
    });
    return hits.slice(0,3);
  }, vw);
}

/* ── screenshot + overflow check ────────────────────────────────────────── */
async function shot(page, name, vw=W) {
  try {
    await page.waitForTimeout(700);
    if (vw===W) await page.screenshot({path:resolve(OUT,`${name}.png`), clip:{x:0,y:0,width:W,height:H}});
    else        await page.screenshot({path:resolve(OUT,`${name}.png`)});
    const ov = await checkOv(page, vw);
    if(ov.length===0) pass(name);
    else warn(name, `overflow ${JSON.stringify(ov[0])}`);
  } catch(e) { warn(name, e.message.slice(0,80)); }
}

/* ── core helpers ────────────────────────────────────────────────────────── */
async function goto(page, url) {
  await page.goto(url, {waitUntil:'networkidle',timeout:30000});
  await page.waitForTimeout(800);
}
async function tab(page, id, ms=1300) {
  // dispatchEvent cible le nœud DOM directement (pas les coordonnées visuelles)
  // Nécessaire car le DemoGuide (zIndex 10001) chevauche la BottomNav et intercepte
  // les clicks basés sur coordonnées, même avec force:true
  const found = await page.evaluate((tabId) => {
    const el = document.querySelector(`[data-demo="tab-${tabId}"]`);
    if (el) { el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})); return true; }
    return false;
  }, id);
  if (!found) {
    // Fallback si l'élément n'existe pas encore
    await page.click(`[data-demo="tab-${id}"]`, {force:true,timeout:5000}).catch(()=>null);
  }
  await page.waitForTimeout(ms);
}
async function scroll(page, px=450) {
  await page.evaluate(y => {
    window.scrollBy(0, y);
    // Also scroll the largest non-fixed scrollable child (app content containers)
    const divs = [...document.querySelectorAll('div')].filter(d => {
      const s = getComputedStyle(d);
      return d.scrollHeight > d.clientHeight + 100 && d.clientHeight > 100
        && s.overflowY !== 'visible' && s.overflowY !== 'hidden'
        && s.position !== 'fixed';
    });
    if (divs.length) {
      const biggest = divs.reduce((a, b) => a.scrollHeight > b.scrollHeight ? a : b);
      biggest.scrollTop += y;
    }
  }, px);
  await page.waitForTimeout(350);
}
async function scrollTop(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('div').forEach(d => {
      const s = getComputedStyle(d);
      if (d.scrollTop > 0 && s.overflowY !== 'visible' && s.overflowY !== 'hidden' && s.position !== 'fixed')
        d.scrollTop = 0;
    });
  });
}
async function esc(page)            { await page.keyboard.press('Escape'); await page.waitForTimeout(500); }

/* Cliquer sur un ElementHandle via dispatchEvent — bypasse le guide (zIndex 10001)
 * et la SandboxBadge (zIndex 9990) qui couvrent physiquement certains éléments. */
async function clickEl(el) {
  await el.evaluate(e => e.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true})));
  // Petit tick pour que React traite l'event
  await el.evaluate(() => new Promise(r => requestAnimationFrame(r)));
}

/* Accepter le consent RGPD — attend l'apparition du bouton */
async function acceptConsent(page) {
  try {
    await page.waitForSelector('button:has-text("Accepter et continuer")', {timeout:7000});
    // dispatchEvent pour bypasser les overlays potentiels (guide, SandboxBadge)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Accepter et continuer'));
      if (btn) btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
    });
    await page.waitForSelector('button:has-text("Accepter et continuer")', {state:'detached',timeout:4000}).catch(()=>null);
    await page.waitForTimeout(400);
  } catch { /* pas de bannière */ }
}

/* Entrer en mode démo comme un profil donné.
 * Single-clic "× Quitter" → confirmExit=true (guide reste visible, step 0 sans clickTarget).
 * On N'appelle PAS exitTour() : cela évite l'apparition de SandboxWelcome qui interfère. */
// Mapping label affiché → data-profile (évite le faux-positif has-text case-insensitive)
const PROFILE_ID = {
  'Président':     'president',
  'Coach':         'coach',
  'Communication': 'communication',
  'Parent':        'parent',
  'Joueur':        'player',
  'Supporter':     'supporter',
};

async function enterDemo(page, profileLabel) {
  await goto(page, `${BASE}/demo`);
  // Attendre que la landing soit stable (React hydraté, plus de navigation interne)
  await page.waitForLoadState('domcontentloaded').catch(() => null);
  await page.waitForTimeout(1200);
  // Sélectionner le profil via data-profile (évite le faux-positif has-text case-insensitive)
  const profileId = PROFILE_ID[profileLabel] ?? profileLabel.toLowerCase();
  const btn = await page.$(`[data-profile="${profileId}"]`);
  if (btn) { await btn.click({force:true}); await page.waitForTimeout(2500); }
  // Bloquer window.location.assign vers /#register — maintenant que le démo est chargé
  await page.evaluate(() => {
    const _orig = window.location.assign.bind(window.location);
    window.location.assign = (url) => { if (!String(url).includes('register')) _orig(url); };
  }).catch(() => null);
  await page.waitForTimeout(300);
  // Single-clic "× Quitter" → confirmExit=true (step 1 sans clickTarget = aucun blocage)
  const q = await page.$('button:has-text("Quitter")');
  if (q) { await q.click({force:true}); await page.waitForTimeout(500); }
  await acceptConsent(page);
  await page.waitForTimeout(600);
}

/* Changer de rôle dev dans le header — via evaluate pour bypasser la visibilité */
async function switchRole(page, label) {
  // Utilise evaluate car le bouton peut être dans un container overflowX:auto non-visible
  const found = await page.evaluate((lbl) => {
    const btn = [...document.querySelectorAll('button')]
      .find(b => b.textContent?.trim() === lbl);
    if (btn) { btn.click(); return true; }
    return false;
  }, label);
  if (!found) {
    // Fallback Playwright
    await page.click(`button:has-text("${label}")`, {force:true,timeout:5000}).catch(()=>null);
  }
  await page.waitForTimeout(1500);
}

/* Ouvrir FAB — dispatchEvent pour bypasser le guide qui chevauche la BottomNav */
async function openFab(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-demo="fab-add"]');
    if (el) el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
  });
  await page.waitForTimeout(900);
}

/* Onglet interne (club, help, etc.) — dispatchEvent pour bypasser le guide */
async function clickTab(page, label, ms=1000) {
  await page.evaluate(lbl => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(lbl));
    if (btn) btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
  }, label);
  await page.waitForTimeout(ms);
}

/* Naviguer vers la page admin via ProfilPage → onglet Paramètres */
async function openAdmin(page) {
  // S'assurer d'être tout en haut
  await page.evaluate(()=>window.scrollTo(0,0));
  // Attendre que le tab profil soit disponible (après switch de rôle)
  await page.waitForSelector('[data-demo="tab-profil"]', {timeout:8000}).catch(()=>null);
  await tab(page, 'profil', 2500);
  // Le bouton admin "Tableau de bord" est dans l'onglet "Paramètres" de ProfilPage
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Paramètres');
    if (btn) btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
  });
  await page.waitForTimeout(800);
  const found = await page.waitForSelector('button:has-text("Tableau de bord")', {timeout:6000}).catch(()=>null);
  if (found) {
    await clickEl(found);
    await page.waitForTimeout(2500);
    return true;
  }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
async function run() {
  const browser = await chromium.launch({ headless:true });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 1. VISITEUR SANS COMPTE                                                  */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 1. VISITEUR SANS COMPTE ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();

    await goto(p, BASE);
    await shot(p, '01-visitor-home');
    await scroll(p, 500); await shot(p, '02-visitor-home-scroll'); await scrollTop(p);

    await tab(p, 'map', 2500);
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1200);
    await shot(p, '03-visitor-map');

    await tab(p, 'clubs', 1500);
    await shot(p, '04-visitor-clubs');
    await scroll(p, 500); await shot(p, '05-visitor-clubs-scroll'); await scrollTop(p);

    await tab(p, 'favoris', 1000);
    await shot(p, '06-visitor-favoris');

    // Modal Auth
    await goto(p, BASE);
    await p.waitForTimeout(600);
    const connBtn = await p.$('button:has-text("Connexion"), button:has-text("Se connecter"), [data-testid="auth-btn"]');
    if (connBtn) {
      await connBtn.click({force:true}); await p.waitForTimeout(1000);
      await shot(p, '07-auth-login');
      const regTab = await p.$('button:has-text("S\'inscrire"), button:has-text("Créer un compte")');
      if (regTab) { await regTab.click({force:true}); await p.waitForTimeout(600); await shot(p, '08-auth-register'); }
      else skip('08-auth-register', 'onglet register non trouvé');
      await esc(p);
    } else { skip('07-auth-login', 'bouton auth non trouvé'); skip('08-auth-register', 'bouton auth non trouvé'); }

    await goto(p, `${BASE}/#legal`);
    await shot(p, '09-legal-page');
    await scroll(p, 500); await shot(p, '10-legal-scroll'); await scrollTop(p);

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 2. DEMO LANDING PAGE                                                     */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 2. DEMO LANDING ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await goto(p, `${BASE}/demo`);
    await p.waitForTimeout(1500);
    await shot(p, '11-demo-landing');
    await scroll(p, 350); await shot(p, '12-demo-landing-scroll'); await scrollTop(p);
    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 3. DEMO COACH                                                            */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 3. DEMO COACH ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Coach');

    await shot(p, '13-coach-home');
    await scroll(p, 500); await shot(p, '14-coach-home-scroll'); await scrollTop(p);

    // Mon Club — onglets internes (avant clubs ET carte pour éviter les conflits)
    await tab(p, 'mon-club', 2000);
    await shot(p, '17-coach-mon-club-accueil');
    // Shot 25 : même vue scrollée pour voir le Planning de la Saison
    await p.evaluate(() => {
      // Chercher tous les scrollables et prendre le plus grand (ClubPageView)
      const divs = [...document.querySelectorAll('div')].filter(
        d => d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 200
      );
      if (divs.length) {
        const biggest = divs.reduce((a, b) => a.scrollHeight > b.scrollHeight ? a : b);
        biggest.scrollTop = 500;
      }
    });
    await p.waitForTimeout(500);
    await shot(p, '25-coach-trainings');
    await p.evaluate(() => {
      const divs = [...document.querySelectorAll('div')].filter(
        d => d.scrollHeight > d.clientHeight + 200 && d.clientHeight > 200
      );
      if (divs.length) {
        const biggest = divs.reduce((a, b) => a.scrollHeight > b.scrollHeight ? a : b);
        biggest.scrollTop = 0;
      }
    });
    await p.waitForTimeout(300);
    await clickTab(p, 'Actualités', 1000); await shot(p, '18-coach-mon-club-actualites');
    await clickTab(p, 'Matchs', 1000);     await shot(p, '19-coach-mon-club-matchs');
    await clickTab(p, 'Effectif', 1000);   await shot(p, '20-coach-mon-club-effectif');
    await clickTab(p, 'Infos', 1000);      await shot(p, '21-coach-mon-club-infos');

    // Clubs — pris après mon-club, avant la carte
    await tab(p, 'clubs', 1500);
    await shot(p, '16-coach-clubs');

    // Carte — en dernier pour éviter que Leaflet pollue les écrans suivants
    await tab(p, 'map', 2500);
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1200);
    await shot(p, '15-coach-map');

    await ctx.close();
  }

  // Contexte séparé pour le FAB Coach (naviguer vers mon-club puis home crash BottomNav)
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Coach');

    // FAB Coach + Créer événement (depuis home, sans passer par mon-club)
    await openFab(p);
    await shot(p, '22-coach-fab-open');
    const evBtn = await p.$('button:has-text("Créer un événement")');
    if (evBtn) {
      await clickEl(evBtn); await p.waitForTimeout(2000);
      await shot(p, '23-coach-event-form');
      await scroll(p, 400); await shot(p, '24-coach-event-form-scroll'); await scrollTop(p);
      await esc(p); await p.waitForTimeout(500);
    } else { skip('23-coach-event-form','btn non trouvé'); skip('24-coach-event-form-scroll',''); }

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 4. DEMO PRÉSIDENT                                                        */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 4. DEMO PRÉSIDENT ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Président');

    await shot(p, '26-president-home');
    await scroll(p, 500); await shot(p, '27-president-home-scroll'); await scrollTop(p);

    await tab(p, 'mon-club', 2000);
    await shot(p, '28-president-mon-club-accueil');
    await scrollTop(p);

    // FAB Président (9 options)
    await tab(p, 'home', 800);
    await openFab(p);
    await shot(p, '29-president-fab-open');
    await scroll(p, 250); await shot(p, '30-president-fab-scroll'); await scrollTop(p);

    const dashBtn = await p.$('button:has-text("Tableau de bord")');
    if (dashBtn) {
      await clickEl(dashBtn); await p.waitForTimeout(2000);
      await shot(p, '31-president-dashboard');
      await scroll(p, 500); await shot(p, '32-president-dashboard-scroll'); await scrollTop(p);
      await esc(p); await p.waitForTimeout(600);
    } else { skip('31-president-dashboard','btn non trouvé'); skip('32-president-dashboard-scroll',''); }

    // Créer événement
    await openFab(p);
    const evBtn = await p.$('button:has-text("Créer un événement")');
    if (evBtn) {
      await clickEl(evBtn); await p.waitForTimeout(2000);
      await shot(p, '33-president-event-form');
      await esc(p);
    } else skip('33-president-event-form','btn non trouvé');

    // Envoyer annonce
    await openFab(p);
    const annBtn = await p.$('button:has-text("Envoyer une annonce")');
    if (annBtn) {
      await clickEl(annBtn); await p.waitForTimeout(1500);
      await shot(p, '34-president-announce-form');
      await scroll(p, 300); await shot(p, '35-president-announce-scroll'); await scrollTop(p);
      await esc(p);
    } else { skip('34-president-announce-form','btn non trouvé'); skip('35-president-announce-scroll',''); }

    // Modifier la page (éditeur drag-drop blocs)
    await openFab(p);
    const editBtn = await p.$('button:has-text("Modifier la page")');
    if (editBtn) {
      await clickEl(editBtn); await p.waitForTimeout(2000);
      await shot(p, '36-president-club-editor');
      await esc(p);
    } else skip('36-president-club-editor','btn non trouvé');

    // Membres (roster) — dans les actions secondaires du FAB (fabExpanded requis)
    // Forcer retour home pour réinitialiser l'état du FAB
    await tab(p, 'home', 1000);
    await openFab(p);
    // Cliquer "Toutes les actions" pour révéler la section secondaire
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Toutes les actions'));
      if (btn) btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
    }).catch(() => null);
    await p.waitForTimeout(800);
    const rosterBtn = await p.$('button:has-text("Membres")');
    if (rosterBtn) {
      await clickEl(rosterBtn); await p.waitForTimeout(1500);
      await shot(p, '37-president-roster');
      await scroll(p, 400); await shot(p, '38-president-roster-scroll'); await scrollTop(p);
      await esc(p);
    } else { skip('37-president-roster','btn non trouvé'); skip('38-president-roster-scroll',''); }

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 5. DEMO COMMUNICATION (PosterStudio mis en avant)                        */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 5. DEMO COMMUNICATION ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Communication');

    await shot(p, '39-comm-home');
    await scroll(p, 500); await shot(p, '40-comm-home-scroll'); await scrollTop(p);

    await tab(p, 'clubs', 1500);
    await shot(p, '41-comm-clubs');

    // PosterStudio — via bouton "Générer l'affiche résultat" dans MatchPlanningCard (état post_done)
    await tab(p, 'home', 800);
    // Scroll progressif pour trouver le bouton affiche (peut être sous le fold)
    let posterBtn = null;
    for (let sc = 0; sc < 5; sc++) {
      posterBtn = await p.$('button:has-text("affiche"), button:has-text("Affiche"), button:has-text("Générer")');
      if (posterBtn) break;
      await p.evaluate(()=>window.scrollBy(0,200));
      await p.waitForTimeout(300);
    }
    if (posterBtn) {
      await clickEl(posterBtn); await p.waitForTimeout(3000);
      // Vérifier que PosterStudio est ouvert (chercher un élément distinctif)
      const studioEl = await p.$('[data-testid="poster-studio"], button:has-text("Télécharger"), button:has-text("Exporter"), button:has-text("template"), .poster-studio');
      if (studioEl) { // toujours screenshot pour vérifier
        await shot(p, '42-poster-studio');
        await scroll(p, 400); await shot(p, '43-poster-studio-scroll'); await scrollTop(p);
        await esc(p); await p.waitForTimeout(500);
      }
    } else { skip('42-poster-studio','bouton affiche non trouvé'); skip('43-poster-studio-scroll',''); }

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 6. DEMO PARENT                                                           */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 6. DEMO PARENT ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Parent');

    await shot(p, '44-parent-home');
    await scroll(p, 500); await shot(p, '45-parent-home-scroll'); await scrollTop(p);

    await tab(p, 'clubs', 1500);
    await shot(p, '46-parent-clubs');

    // Favoris
    const hasFav = await p.$('[data-demo="tab-favoris"]');
    if (hasFav) { await tab(p, 'favoris', 1200); await shot(p, '47-parent-favoris'); }
    else skip('47-parent-favoris','onglet absent pour ce profil');

    // Profil
    const hasProf = await p.$('[data-demo="tab-profil"]');
    if (hasProf) {
      await tab(p, 'profil', 1500);
      await shot(p, '48-parent-profil');
      await scroll(p, 500); await shot(p, '49-parent-profil-scroll'); await scrollTop(p);
    } else skip('48-parent-profil','onglet profil absent');

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 7. DEMO JOUEUR                                                           */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 7. DEMO JOUEUR ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Joueur');

    await shot(p, '50-player-home');
    await scroll(p, 500); await shot(p, '51-player-home-scroll'); await scrollTop(p);

    // Favoris + profil AVANT la carte (évite la race condition Leaflet+useClubs)
    const hasFav = await p.$('[data-demo="tab-favoris"]');
    if (hasFav) { await tab(p, 'favoris', 1200); await shot(p, '53-player-favoris'); }
    else skip('53-player-favoris','onglet absent');

    const hasProf = await p.$('[data-demo="tab-profil"]');
    if (hasProf) {
      await tab(p, 'profil', 1500);
      await shot(p, '54-player-profil');
      await scroll(p, 400); await shot(p, '55-player-profil-scroll'); await scrollTop(p);
    } else skip('54-player-profil','onglet profil absent');

    // Carte en dernier (après favoris/profil pour éviter la race condition Leaflet)
    await tab(p, 'map', 2500);
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1200);
    await shot(p, '52-player-map');

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 8. DEMO SUPPORTER                                                        */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 8. DEMO SUPPORTER ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Supporter');

    await shot(p, '56-supporter-home');
    await scroll(p, 500); await shot(p, '57-supporter-home-scroll'); await scrollTop(p);

    await tab(p, 'clubs', 1500);
    await shot(p, '58-supporter-clubs');
    await scroll(p, 400); await shot(p, '59-supporter-clubs-scroll'); await scrollTop(p);

    // Favoris + profil AVANT la carte (évite la race condition Leaflet+useClubs)
    const hasFav = await p.$('[data-demo="tab-favoris"]');
    if (hasFav) { await tab(p, 'favoris', 1200); await shot(p, '61-supporter-favoris'); }
    else skip('61-supporter-favoris','onglet absent');

    const hasProf = await p.$('[data-demo="tab-profil"]');
    if (hasProf) {
      await tab(p, 'profil', 1500);
      await shot(p, '62-supporter-profil');
      await scroll(p, 400); await shot(p, '63-supporter-profil-scroll'); await scrollTop(p);
    } else skip('62-supporter-profil','onglet profil absent');

    // Carte en dernier (après favoris/profil pour éviter la race condition Leaflet)
    await tab(p, 'map', 2500);
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1200);
    await shot(p, '60-supporter-map');

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 9. ADMIN (Coach + Super role → profil tab → Tableau de bord)            */
  /* Note: NON_ADMIN_DEMO_PROFILES=['parent','player','supporter'] force      */
  /* effectiveRole='user' → Coach/Président ne sont PAS dans cette liste.    */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 9. ADMIN ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Coach');  // Coach: effectiveRole respecte devRole
    // Header (avec role switcher) n'est rendu que sur les onglets ≠ home
    await tab(p, 'clubs', 1500); // → Header visible → "Super" button disponible
    await switchRole(p, 'Super'); // devRole='superadmin' → effectiveRole='superadmin' → isAdmin=true
    await p.waitForTimeout(3000); // attendre re-render (tabs changent → tab-profil apparaît)

    const ok = await openAdmin(p);
    if (!ok) {
      skip('64-admin-overview','navigation admin échouée');
    }
    else {
      await shot(p, '64-admin-overview');
      await scroll(p, 500); await shot(p, '65-admin-overview-scroll'); await scrollTop(p);

      // Sous-pages admin via les cards "Espaces dédiés"
      async function adminCard(label, nameBase) {
        const card = await p.$(`button:has-text("${label}")`);
        if (!card) { skip(nameBase, `card "${label}" non trouvée`); return; }
        await clickEl(card); await p.waitForTimeout(2000);
        await shot(p, nameBase);
        await scroll(p, 400); await shot(p, nameBase+'-scroll'); await scrollTop(p);
        // Retour
        const back = await p.$('button[aria-label*="Retour"], button[aria-label*="retour"]');
        if (back) { await clickEl(back); await p.waitForTimeout(1500); }
      }

      await adminCard('Feedback communautaire', '66-admin-feedback');
      await adminCard('Analytics',              '68-admin-analytics');

      // Cards dans "Gestion des accès & abonnements" — besoin de scroll
      await scroll(p, 400);
      await adminCard('Matrice des permissions', '72-admin-permissions');
      await adminCard('Matrice des abonnements', '74-admin-plans');
      await adminCard('Licences & Grants',        '70-admin-licenses');
      await adminCard("Journal d'audit",          '76-admin-audit-log');
    }

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 10. OVERLAYS & MODAUX                                                    */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 10. OVERLAYS & MODAUX ══');
  {
    const ctx = await mobileCx(browser);
    const p   = await ctx.newPage();
    await enterDemo(p, 'Supporter');

    // HelpFab — aria-label contenant "aide" — dispatchEvent pour bypasser le guide
    await p.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label')?.toLowerCase().includes('aide'));
      if (el) el.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}));
    });
    // Attendre que la HelpPage s'ouvre (aria-label="Centre d'aide" sur le dialog)
    const helpOpened = await p.waitForSelector('[aria-label="Centre d\'aide"][role="dialog"], [aria-label="Fermer l\'aide"]', {timeout:6000}).catch(()=>null);
    if (helpOpened) {
      await p.waitForTimeout(800);
      // HelpPage s'ouvre sur "Notifications" si unreadCount>0 — forcer l'onglet FAQ
      await clickTab(p, 'FAQ', 600);
      await shot(p, '78-help-faq');
      await scroll(p, 400); await shot(p, '79-help-faq-scroll'); await scrollTop(p);
      // Onglet "Idées"
      await clickTab(p, 'Idées', 1000);
      await shot(p, '80-help-ideas');
      // Onglet "Notifications" (tab conditionnelle — apparaît si notifications.length > 0)
      const notifTabBtn = await p.waitForSelector('button:has-text("Notifications")', {timeout:5000}).catch(()=>null);
      if (notifTabBtn) { await clickEl(notifTabBtn); await p.waitForTimeout(800); await shot(p, '81-help-notifs'); }
      else skip('81-help-notifs','aucune notification en démo');
      // Fermer la HelpPage via le bouton ← ou ESC
      const closeHelp = await p.$('[aria-label="Fermer l\'aide"]');
      if (closeHelp) {
        await clickEl(closeHelp);
        // Attendre que le dialog soit retiré du DOM (animation exit framer-motion)
        await p.waitForSelector('[aria-label="Centre d\'aide"][role="dialog"]', {state:'detached', timeout:3000}).catch(()=>null);
        await p.waitForTimeout(400);
      } else await esc(p);
    } else skip('78-help-faq','HelpPage non ouverte');

    // Club page publique — depuis liste clubs
    await tab(p, 'clubs', 1500);
    // Essayer "Voir la page" (clubs non-gérés) puis "Ma page" (clubs gérés)
    const voirBtn = await p.$('button:has-text("Voir la page"), button:has-text("Ma page")');
    if (voirBtn) {
      await clickEl(voirBtn); await p.waitForTimeout(2000);
      await shot(p, '82-club-page-publique');
      await scroll(p, 400); await shot(p, '83-club-page-publique-scroll'); await scrollTop(p);
      // Onglets internes
      await clickTab(p, 'Actualités', 1000); await shot(p, '84-club-page-actualites');
      await clickTab(p, 'Matchs', 1000);     await shot(p, '85-club-page-matchs');
      await clickTab(p, 'Effectif', 1000);   await shot(p, '86-club-page-effectif');
      await clickTab(p, 'Infos', 1000);      await shot(p, '87-club-page-infos');
      await esc(p);
    } else skip('82-club-page-publique','bouton non trouvé — essai gestionnaire');

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 11. LIGHT MODE                                                           */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 11. LIGHT MODE ══');
  {
    const ctx = await mobileCx(browser, 'light');
    const p   = await ctx.newPage();

    await goto(p, BASE);
    await shot(p, '88-light-visitor-home');
    await tab(p, 'clubs', 1500); await shot(p, '89-light-clubs');
    await tab(p, 'map', 2500);
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1200); await shot(p, '90-light-map');

    await enterDemo(p, 'Coach');
    await shot(p, '91-light-coach-home');
    await tab(p, 'mon-club', 2000); await shot(p, '92-light-mon-club');
    await tab(p, 'clubs', 1500); await shot(p, '93-light-clubs-demo');

    await ctx.close();
  }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  /* 12. DESKTOP 1280×800                                                     */
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  console.log('\n══ 12. DESKTOP 1280×800 ══');
  {
    const ctx = await desktopCx(browser);
    const p   = await ctx.newPage();

    await goto(p, BASE);
    await shot(p, '94-desktop-visitor-home', 1280);
    await tab(p, 'map', 2500); // dispatchEvent — pas de guide ici
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1500); await shot(p, '95-desktop-map', 1280);
    await tab(p, 'clubs', 1200); await shot(p, '96-desktop-clubs', 1280);

    const connBtn = await p.waitForSelector(
      'button:has-text("Connexion"), button:has-text("Se connecter"), a:has-text("Connexion"), button:has-text("S\'inscrire")',
      {timeout: 4000}
    ).catch(() => null);
    if (connBtn) {
      await clickEl(connBtn); await p.waitForTimeout(1200);
      await shot(p, '97-desktop-auth-modal', 1280); await esc(p);
    } else skip('97-desktop-auth-modal','bouton connexion non trouvé');

    // Demo Coach desktop — réutilise enterDemo (single-click dismiss + dispatchEvent pour tout)
    await p.goto(`${BASE}/demo`, {waitUntil:'networkidle',timeout:30000});
    await p.waitForTimeout(1500);
    await p.evaluate(() => {
      const _o = window.location.assign.bind(window.location);
      window.location.assign = (u) => { if (!String(u).includes('register')) _o(u); };
    });
    const profBtn = await p.$('button:has-text("Coach")');
    if (profBtn) { await profBtn.click({force:true}); await p.waitForTimeout(2500); }
    const qb = await p.$('button:has-text("Quitter")');
    if (qb) { await qb.click({force:true}); await p.waitForTimeout(500); }
    await acceptConsent(p);

    await shot(p, '98-desktop-coach-home', 1280);
    await tab(p, 'map', 2500); // dispatchEvent
    await p.waitForSelector('.leaflet-container', {timeout:8000}).catch(()=>null);
    await p.waitForTimeout(1500); await shot(p, '99-desktop-coach-map', 1280);
    await tab(p, 'clubs', 1500); await shot(p, '100-desktop-coach-clubs', 1280);
    await tab(p, 'mon-club', 2000); await shot(p, '101-desktop-mon-club', 1280);

    // Admin desktop — Coach + Super
    await p.goto(`${BASE}/demo`, {waitUntil:'networkidle',timeout:30000});
    await p.waitForTimeout(1500);
    await p.evaluate(() => {
      const _o = window.location.assign.bind(window.location);
      window.location.assign = (u) => { if (!String(u).includes('register')) _o(u); };
    });
    const supBtn = await p.$('button:has-text("Coach")');
    if (supBtn) { await supBtn.click({force:true}); await p.waitForTimeout(2500); }
    const qb2 = await p.$('button:has-text("Quitter")');
    if (qb2) { await qb2.click({force:true}); await p.waitForTimeout(500); }
    await acceptConsent(p);
    await tab(p, 'clubs', 1200); // Header visible → role switcher disponible
    await switchRole(p, 'Super');
    const adminOk = await openAdmin(p);
    if (adminOk) await shot(p, '102-desktop-admin', 1280);
    else skip('102-desktop-admin', 'navigation admin échouée');

    await ctx.close();
  }

  /* ── Rapport ─────────────────────────────────────────────────────────── */
  await browser.close();

  const ok    = results.filter(r=>r.s==='ok').length;
  const wn    = results.filter(r=>r.s==='warn').length;
  const sk    = results.filter(r=>r.s==='skip').length;
  const total = results.length;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Audit complet : ${ok}✓  ${wn}⚠  ${sk}·  / ${total}`);
  if (wn) { console.log('\nWarnings :'); results.filter(r=>r.s==='warn').forEach(r=>console.log(`  • ${r.n} — ${r.note}`)); }
  if (sk) { console.log('\nSkipped :'  ); results.filter(r=>r.s==='skip').forEach(r=>console.log(`  · ${r.n} — ${r.note}`)); }
  console.log(`\nScreenshots → ${OUT}\n`);
  writeFileSync(resolve(OUT,'report.json'), JSON.stringify({date:new Date().toISOString(),ok,warned:wn,skipped:sk,total,results},null,2));
}

run().catch(e=>{ console.error(e); process.exit(1); });
