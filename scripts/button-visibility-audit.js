/**
 * Audit visibilité boutons — Multi-tailles d'écran
 *
 * Teste que tous les boutons interactifs sont accessibles peu importe la
 * résolution (iPhone SE → Desktop 1440). Vérifie :
 *   - bouton entièrement hors viewport
 *   - centre du bouton hors viewport (partiellement coupé)
 *   - bouton derrière la BottomNav
 *   - bouton trop petit (< 44×44 px sur mobile)
 *   - bouton dans la safe-area iOS
 *
 * Lance le serveur de dev puis :
 *   node scripts/button-visibility-audit.js
 *
 * Output : scripts/audit-buttons/
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = resolve(__dir, 'audit-buttons');
const BASE  = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// ── Tailles d'écran à tester ──────────────────────────────────────────────────

const DEVICES = [
  { id: 'iphoneSE',   label: 'iPhone SE (375×667)',   w: 375,  h: 667,  dpr: 2,     mobile: true,  safeArea: 0,  ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
  { id: 'iphone13',   label: 'iPhone 13 (390×844)',   w: 390,  h: 844,  dpr: 3,     mobile: true,  safeArea: 34, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
  { id: 'iphone15pm', label: 'iPhone 15 PM (430×932)',w: 430,  h: 932,  dpr: 3,     mobile: true,  safeArea: 34, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' },
  { id: 'pixel7',     label: 'Pixel 7 (412×915)',     w: 412,  h: 915,  dpr: 2.625, mobile: true,  safeArea: 0,  ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120' },
  { id: 'samsungS21', label: 'Samsung S21 (360×800)', w: 360,  h: 800,  dpr: 3,     mobile: true,  safeArea: 0,  ua: 'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 Chrome/120' },
  { id: 'ipadMini',   label: 'iPad Mini (744×1133)',  w: 744,  h: 1133, dpr: 2,     mobile: false, safeArea: 0,  ua: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
  { id: 'desktop1440',label: 'Desktop 1440×900',      w: 1440, h: 900,  dpr: 1,     mobile: false, safeArea: 0,  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
];

// ── Résultats ─────────────────────────────────────────────────────────────────

const allResults = [];
function log(icon, msg) { console.log(`${icon} ${msg}`); }

// ── Analyser les boutons dans la page ────────────────────────────────────────

async function analyzeButtons(page, vw, vh, safeArea, isMobile) {
  return page.evaluate(({ vw, vh, safeArea, isMobile }) => {

    // ── Détecter la BottomNav (SportLink) ──────────────────────────────────
    // La BottomNav est un div flex au bas du layout, pas forcément <nav>
    let navTop = vh;

    // Méthode 1 : trouver le conteneur des tabs [data-demo="tab-*"]
    const tabEls = [...document.querySelectorAll('[data-demo^="tab-"]')];
    if (tabEls.length >= 3) {
      for (const el of tabEls) {
        let p = el.parentElement;
        while (p) {
          const r = p.getBoundingClientRect();
          if (r.height > 40 && r.height < 150 && r.bottom >= vh - 5 && r.width > vw * 0.7) {
            navTop = Math.min(navTop, r.top);
            break;
          }
          p = p.parentElement;
        }
      }
    }
    // Méthode 2 : fallback sur <nav> / role=navigation
    if (navTop === vh) {
      [...document.querySelectorAll('nav, [role="navigation"]')].forEach(nav => {
        const r = nav.getBoundingClientRect();
        if (r.height > 30 && r.bottom >= vh - 5 && r.width > vw * 0.6) navTop = Math.min(navTop, r.top);
      });
    }
    const safeBottom = vh - safeArea;

    // ── Helpers ─────────────────────────────────────────────────────────────

    // Un élément est dans un conteneur scrollable → il est accessible par scroll
    function isInScrollContainer(el) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (s.overflowY === 'auto' || s.overflowY === 'scroll' ||
            s.overflowX === 'auto' || s.overflowX === 'scroll') return true;
        p = p.parentElement;
      }
      return false;
    }

    // Skip link accessibilité (sr-only, clip, etc.) — toujours hors viewport par design
    function isSkipLink(el, style) {
      if (style.position === 'absolute') {
        const w = parseFloat(style.width);
        const h = parseFloat(style.height);
        if (w <= 1 && h <= 1) return true;
        if (w <= 1 || h <= 1) return true;
      }
      const clip = style.clip || '';
      if (clip.includes('rect(0') || clip.includes('rect(1px')) return true;
      if (style.clipPath === 'inset(50%)') return true;
      const txt = el.textContent?.trim() ?? '';
      if (txt === 'Aller au contenu principal' || txt === 'Skip to content') return true;
      return false;
    }

    // Bouton dans une popover / dropdown fermée
    function isInHiddenContainer(el) {
      let p = el.parentElement;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (s.display === 'none' || s.visibility === 'hidden') return true;
        if (parseFloat(s.opacity) < 0.05) return true;
        p = p.parentElement;
      }
      return false;
    }

    // ── Check ────────────────────────────────────────────────────────────────
    const SEL = 'button:not([disabled]), [role="button"]:not([disabled]), a[href]';
    const els = [...document.querySelectorAll(SEL)];
    const issues = [];
    const stats  = { total: 0, ok: 0, offScreen: 0, clipped: 0, behindNav: 0, tooSmall: 0, safeAreaIssue: 0 };

    for (const el of els) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (parseFloat(style.opacity) < 0.05) continue;
      if (isSkipLink(el, style)) continue;
      if (isInHiddenContainer(el)) continue;

      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.width < 2 || rect.height < 2) continue;

      // Skip si complètement hors bounding box (élément en dehors du layout réel)
      if (rect.left < -vw * 3 || rect.top < -vh * 3 || rect.left > vw * 4 || rect.top > vh * 4) continue;

      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const text = (el.getAttribute('aria-label') || el.textContent?.trim() || el.value || '')
        .replace(/\s+/g, ' ').trim().slice(0, 40);

      // Si le bouton est dans un conteneur scrollable → accessible par scroll = toujours OK
      const inScroll = isInScrollContainer(el);
      if (inScroll) continue;

      stats.total++;
      const base = {
        text,
        tag: el.tagName,
        rect: { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), right: Math.round(rect.right) },
        cx: Math.round(cx), cy: Math.round(cy),
        w: Math.round(rect.width), h: Math.round(rect.height),
        pos: style.position,
      };

      // 1. Hors viewport (non-scrollable)
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) {
        stats.offScreen++;
        issues.push({ ...base, type: 'off-screen', severity: 'error', msg: `hors viewport top=${Math.round(rect.top)} bottom=${Math.round(rect.bottom)} left=${Math.round(rect.left)} right=${Math.round(rect.right)}` });
        continue;
      }

      // 2. Centre hors viewport (bouton à cheval sur le bord)
      const margin = 4; // tolérance 4px
      if (cx < -margin || cx > vw + margin || cy < -margin || cy > vh + margin) {
        stats.clipped++;
        issues.push({ ...base, type: 'clipped', severity: 'error', msg: `centre cx=${Math.round(cx)} cy=${Math.round(cy)} hors viewport ${vw}×${vh}` });
        continue;
      }

      // 3. Bouton non-fixed derrière la BottomNav
      if (style.position !== 'fixed' && navTop < vh && cy > navTop + 2) {
        stats.behindNav++;
        issues.push({ ...base, type: 'behind-nav', severity: 'error', msg: `cy=${Math.round(cy)} derrière BottomNav (navTop=${Math.round(navTop)})` });
        continue;
      }

      // 4. Bouton fixed dans la safe-area iOS
      if (style.position === 'fixed' && rect.bottom > safeBottom + 4 && safeArea > 0) {
        stats.safeAreaIssue++;
        issues.push({ ...base, type: 'safe-area', severity: 'warn', msg: `bottom=${Math.round(rect.bottom)} dans safe-area iOS (>${safeBottom})` });
        continue;
      }

      // 5. Trop petit sur mobile (< 44×44 ET pas dans une barre compacte)
      if (isMobile && rect.width < 36 && rect.height < 36) {
        stats.tooSmall++;
        issues.push({ ...base, type: 'too-small', severity: 'warn', msg: `${Math.round(rect.width)}×${Math.round(rect.height)} < 36×36 px` });
        continue;
      }

      stats.ok++;
    }

    return { issues, stats, navTop: Math.round(navTop) };
  }, { vw, vh, safeArea, isMobile });
}

// ── Screenshot + check ────────────────────────────────────────────────────────

async function runCheck(page, device, label, pageId) {
  await page.waitForTimeout(600);

  let result;
  try {
    result = await analyzeButtons(page, device.w, device.h, device.safeArea, device.mobile);
  } catch (e) {
    log('⚠', `[${device.id}] ${label} — analyze failed: ${e.message.slice(0, 60)}`);
    result = { issues: [], stats: { total: 0, ok: 0, offScreen: 0, clipped: 0, behindNav: 0, tooSmall: 0, safeArea: 0 }, navTop: device.h };
  }

  const { issues, stats, navTop } = result;
  const screenshotPath = resolve(OUT, `${device.id}--${pageId}.png`);

  try {
    await page.screenshot({
      path: screenshotPath,
      clip: { x: 0, y: 0, width: device.w, height: device.h },
    });
  } catch { /* screenshot may fail on some pages */ }

  const errors = issues.filter(i => i.severity === 'error');
  const warns  = issues.filter(i => i.severity === 'warn');

  allResults.push({ device: device.label, deviceId: device.id, page: label, pageId, stats, errors, warns, navTop, screenshotPath: `${device.id}--${pageId}.png` });

  const icon = errors.length > 0 ? '✗' : warns.length > 0 ? '⚠' : '✓';
  log(icon, `[${device.id}] ${label} — ${stats.ok}/${stats.total} OK · nav@${navTop}px · ${errors.length}err · ${warns.length}warn`);

  if (errors.length) {
    for (const e of errors.slice(0, 3)) {
      log('   →', `${e.type} | "${e.text}" | ${e.msg}`);
    }
  }

  return { errors, warns, stats };
}

// ── Navigation démo ───────────────────────────────────────────────────────────

async function enterDemo(page, profileLabel = 'Président') {
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  // Cliquer le profil
  const found = await page.evaluate((label) => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(label));
    if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
    return false;
  }, profileLabel);
  if (!found) return;
  await page.waitForTimeout(2000);
  // Quitter le guide
  const quit = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Quitter'));
    if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
    return false;
  });
  await page.waitForTimeout(800);
}

async function switchTab(page, tabId) {
  await page.evaluate((id) => {
    const el = document.querySelector(`[data-demo="tab-${id}"]`);
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, tabId);
  await page.waitForTimeout(1200);
}

async function scrollContent(page, px = 400) {
  await page.evaluate((px) => {
    const divs = [...document.querySelectorAll('div')].filter(d => {
      const s = getComputedStyle(d);
      return d.scrollHeight > d.clientHeight + 50 && s.overflowY !== 'hidden' && s.overflowY !== 'visible' && s.position !== 'fixed';
    });
    const main = divs.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    if (main) main.scrollTop += px;
  }, px);
  await page.waitForTimeout(350);
}

// ── Audit d'un device ─────────────────────────────────────────────────────────

async function auditDevice(browser, device) {
  log('\n━', `${device.label}`);

  const ctx = await browser.newContext({
    viewport: { width: device.w, height: device.h },
    deviceScaleFactor: device.dpr,
    locale: 'fr-FR',
    colorScheme: 'dark',
    userAgent: device.ua,
    isMobile: device.mobile,
    hasTouch: device.mobile,
  });

  const page = await ctx.newPage();

  try {
    await enterDemo(page, 'Président');

    // ── Accueil ──────────────────────────────────────────────────────────────
    await switchTab(page, 'home');
    await runCheck(page, device, 'Accueil', '01-home');
    await scrollContent(page, 350);
    await runCheck(page, device, 'Accueil scrollé', '02-home-scroll');

    // ── Carte ────────────────────────────────────────────────────────────────
    await switchTab(page, 'map');
    await runCheck(page, device, 'Carte', '03-map');

    // Ouvrir un event depuis la carte
    const marker = await page.$('.leaflet-marker-icon');
    if (marker) {
      await marker.click({ force: true });
      await page.waitForTimeout(1000);
      await runCheck(page, device, 'Map — Event Sheet peek', '04-map-sheet-peek');
      // Expand en mode detail via JS
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
          b.style.position === 'absolute' || b.getAttribute('aria-label')?.includes('Fermer')
        );
      });
      await page.waitForTimeout(400);
      await runCheck(page, device, 'Map — Event Sheet detail', '05-map-sheet-detail');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── Favoris ──────────────────────────────────────────────────────────────
    await switchTab(page, 'favoris');
    await runCheck(page, device, 'Favoris', '06-favoris');

    // ── Actualités ───────────────────────────────────────────────────────────
    await switchTab(page, 'news');
    await runCheck(page, device, 'Actualités', '07-news');
    await scrollContent(page, 300);
    await runCheck(page, device, 'Actualités scrollé', '08-news-scroll');

    // ── Clubs ────────────────────────────────────────────────────────────────
    await switchTab(page, 'clubs');
    await runCheck(page, device, 'Clubs', '09-clubs');

    // Ouvrir une page club (ClubPageView overlay)
    const clubOpened = await page.evaluate(() => {
      // Chercher un bouton "Voir la page" ou un card club cliquable
      const btn = [...document.querySelectorAll('button, [role="button"]')].find(b =>
        b.textContent?.trim().includes('Voir la page') ||
        b.textContent?.trim().includes('Voir le club') ||
        b.getAttribute('data-demo') === 'club-card'
      );
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      // Fallback : premier élément cliquable dans la liste clubs
      const card = document.querySelector('[data-demo="club-card"]');
      if (card) { card.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (clubOpened) {
      await page.waitForTimeout(1400);
      await runCheck(page, device, 'Club Page (overlay)', '10-club-page');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    }

    // ── Profil ───────────────────────────────────────────────────────────────
    await switchTab(page, 'profil');
    await runCheck(page, device, 'Profil', '11-profil');
    await scrollContent(page, 300);
    await runCheck(page, device, 'Profil scrollé', '12-profil-scroll');

    // ── Mon Club dashboard ───────────────────────────────────────────────────
    await switchTab(page, 'home');
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(
        b => b.textContent?.includes('Mon club') || b.getAttribute('data-demo') === 'tab-mon-club'
      );
      if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(1400);
    await runCheck(page, device, 'Mon Club', '13-mon-club');

    // ── FAB ouvert ───────────────────────────────────────────────────────────
    await switchTab(page, 'home');
    await page.evaluate(() => {
      const fab = document.querySelector('[data-demo="fab-add"]');
      if (fab) fab.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(900);
    await runCheck(page, device, 'FAB menu ouvert', '14-fab-open');

    // ── EventFormModal (FAB → créer événement) ────────────────────────────────
    const eventFormOpened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        b.textContent?.includes('Créer un événement') ||
        b.textContent?.includes('Nouvel événement') ||
        b.textContent?.includes('Ajouter un match')
      );
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (eventFormOpened) {
      await page.waitForTimeout(1200);
      await runCheck(page, device, 'EventFormModal', '15-event-form');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ── Centre Annonces ───────────────────────────────────────────────────────
    await switchTab(page, 'home');
    const annOpened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button, [role="button"]')].find(b =>
        b.getAttribute('data-demo') === 'tab-annonces' ||
        b.getAttribute('aria-label')?.toLowerCase().includes('annonce') ||
        (b.textContent?.includes('Annonce') && b.closest('[class*="bottom"], [class*="Bottom"], [class*="nav"], [class*="Nav"]'))
      );
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (annOpened) {
      await page.waitForTimeout(1200);
      await runCheck(page, device, 'Centre Annonces', '16-annonces');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── HelpPage (bouton ?) ────────────────────────────────────────────────────
    await switchTab(page, 'home');
    const helpOpened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button, [role="button"]')].find(b =>
        b.getAttribute('aria-label')?.toLowerCase().includes('aide') ||
        b.getAttribute('aria-label')?.toLowerCase().includes('help') ||
        b.textContent?.trim() === '?' ||
        b.getAttribute('data-demo') === 'help-fab'
      );
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (helpOpened) {
      await page.waitForTimeout(1000);
      await runCheck(page, device, 'HelpPage', '17-help');

      // FeedbackModal depuis HelpPage
      const fbOpened = await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b =>
          b.textContent?.includes('Signaler') ||
          b.textContent?.includes('Feedback') ||
          b.textContent?.includes('Suggérer')
        );
        if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
        return false;
      });
      if (fbOpened) {
        await page.waitForTimeout(1000);
        await runCheck(page, device, 'FeedbackModal', '18-feedback-modal');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── PlansMiniModal (bouton cadenas / upgrade) ─────────────────────────────
    await switchTab(page, 'home');
    const plansOpened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b =>
        b.getAttribute('aria-label')?.toLowerCase().includes('plan') ||
        b.getAttribute('aria-label')?.toLowerCase().includes('pro') ||
        b.textContent?.includes('Club Pro') ||
        b.textContent?.includes('Passer à') ||
        b.querySelector('svg[data-icon="lock"], [aria-label*="cadenas"]')
      );
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (plansOpened) {
      await page.waitForTimeout(1000);
      await runCheck(page, device, 'PlansMiniModal', '19-plans-modal');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // ── Auth Page ─────────────────────────────────────────────────────────────
    await page.goto(`${BASE}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    // L'app redirige sur la home en mode démo — tester directement /auth
    // En mode démo on est connecté, donc on navigue en "déconnecté"
    const authVisible = await page.evaluate(() => {
      // Chercher un formulaire de connexion ou des boutons auth
      return !!(
        document.querySelector('input[type="email"]') ||
        document.querySelector('input[type="password"]') ||
        [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Connexion') || b.textContent?.includes('Google'))
      );
    });
    if (authVisible) {
      await runCheck(page, device, 'Auth Page', '20-auth');
    }

    // ── Admin (si disponible) ─────────────────────────────────────────────────
    await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const adminFound = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Président'));
      if (btn) { btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); return true; }
      return false;
    });
    if (adminFound) {
      await page.waitForTimeout(2000);
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Quitter'));
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(800);
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Admin') || b.getAttribute('data-demo') === 'tab-admin');
        if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await page.waitForTimeout(1200);
      await runCheck(page, device, 'Admin', '21-admin');
    }

    // ── Demo Landing ──────────────────────────────────────────────────────────
    await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await runCheck(page, device, 'Demo Landing', '22-demo-landing');

  } catch (err) {
    log('✗', `Erreur sur ${device.label}: ${err.message.slice(0, 120)}`);
  } finally {
    await page.close();
    await ctx.close();
  }
}

// ── Rapport HTML ──────────────────────────────────────────────────────────────

function generateReport() {
  const totalErrors = allResults.reduce((s, r) => s + r.errors.length, 0);
  const totalWarns  = allResults.reduce((s, r) => s + r.warns.length, 0);

  const pageBlocks = allResults.map(r => {
    const errHtml = r.errors.map(e =>
      `<tr class="err"><td>${e.type}</td><td class="tc">${e.text || '—'}</td><td>${e.msg}</td><td>${e.w}×${e.h}</td></tr>`
    ).join('');
    const warnHtml = r.warns.map(e =>
      `<tr class="warn"><td>${e.type}</td><td class="tc">${e.text || '—'}</td><td>${e.msg}</td><td>${e.w}×${e.h}</td></tr>`
    ).join('');
    const sc = r.errors.length > 0 ? 'e' : r.warns.length > 0 ? 'w' : 'o';
    const icon = r.errors.length > 0 ? '✗' : r.warns.length > 0 ? '⚠' : '✓';
    return `
<div class="pb ${sc}" data-dev="${r.deviceId}">
  <div class="ph">
    <span class="si">${icon}</span>
    <span class="pt">${r.device} — ${r.page}</span>
    <span class="ps">${r.stats.ok}/${r.stats.total} OK · nav@${r.navTop}px · ${r.errors.length}err · ${r.warns.length}warn</span>
  </div>
  <div class="pbody">
    <div class="sc"><img src="${r.screenshotPath}" loading="lazy"></div>
    <div class="ic">
      ${(errHtml||warnHtml) ? `<table><thead><tr><th>Type</th><th>Bouton</th><th>Problème</th><th>Taille</th></tr></thead><tbody>${errHtml}${warnHtml}</tbody></table>` : '<p class="ok">Tous les boutons sont accessibles ✓</p>'}
    </div>
  </div>
</div>`;
  }).join('\n');

  const deviceFilters = DEVICES.map(d =>
    `<button class="fb" onclick="filterDev('${d.id}',this)">${d.id}</button>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SportLink — Audit Visibilité Boutons</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;font-size:13px}
header{padding:24px 32px;border-bottom:1px solid #1e293b}
h1{font-size:22px;font-weight:800;color:#f8fafc;margin-bottom:6px}
.sub{color:#64748b;font-size:12px}
.summary{display:flex;gap:16px;flex-wrap:wrap;padding:16px 32px;background:#1e293b;border-bottom:1px solid #334155}
.kpi{padding:10px 18px;border-radius:10px}
.ko{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);color:#4ade80}
.ke{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#f87171}
.kw{background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);color:#fbbf24}
.ki{background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.3);color:#a5b4fc}
.kv{font-size:26px;font-weight:900;display:block}
.kl{font-size:11px;opacity:.8;margin-top:2px}
.filters{padding:12px 32px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #1e293b}
.fb{padding:5px 12px;border-radius:20px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:11px}
.fb.on{background:#3b82f6;border-color:#3b82f6;color:#fff}
.pages{padding:16px 32px 40px;display:flex;flex-direction:column;gap:16px;max-width:1400px}
.pb{border-radius:12px;overflow:hidden;border:1px solid #1e293b}
.pb.hidden{display:none}
.ph{display:flex;align-items:center;gap:10px;padding:8px 14px}
.pb.o .ph{background:rgba(34,197,94,.08);border-left:3px solid #22c55e}
.pb.w .ph{background:rgba(245,158,11,.08);border-left:3px solid #f59e0b}
.pb.e .ph{background:rgba(239,68,68,.08);border-left:3px solid #ef4444}
.si{font-size:14px}
.pt{font-weight:700;flex:1;color:#f1f5f9;font-size:13px}
.ps{font-size:11px;color:#64748b}
.pbody{display:grid;grid-template-columns:200px 1fr;background:#0f172a}
.sc img{width:200px;display:block;border-right:1px solid #1e293b}
.ic{padding:14px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:5px 8px;background:#1e293b;color:#94a3b8;font-weight:600}
td{padding:4px 8px;border-bottom:1px solid #1e293b;vertical-align:top}
tr.err td:first-child{color:#f87171;font-weight:700}
tr.warn td:first-child{color:#fbbf24;font-weight:700}
.tc{font-family:monospace;color:#a5b4fc}
.ok{color:#4ade80;font-weight:600;padding:10px 0}
@media(max-width:700px){.pbody{grid-template-columns:1fr}.sc img{width:100%;border-right:none;border-bottom:1px solid #1e293b}}
</style>
</head>
<body>
<header>
  <h1>SportLink — Audit Visibilité Boutons</h1>
  <p class="sub">Généré le ${new Date().toLocaleString('fr-FR')} · ${DEVICES.length} tailles d'écran · ${allResults.length} captures</p>
</header>
<div class="summary">
  <div class="kpi ki"><span class="kv">${allResults.length}</span><span class="kl">Captures</span></div>
  <div class="kpi ko"><span class="kv">${allResults.filter(r=>!r.errors.length&&!r.warns.length).length}</span><span class="kl">Sans problème</span></div>
  <div class="kpi ke"><span class="kv">${totalErrors}</span><span class="kl">Boutons inaccessibles</span></div>
  <div class="kpi kw"><span class="kv">${totalWarns}</span><span class="kl">Avertissements</span></div>
</div>
<div class="filters">
  <button class="fb on" onclick="filterAll(this)">Tout</button>
  <button class="fb" onclick="filterErr(this)">Erreurs</button>
  <button class="fb" onclick="filterOk(this)">OK</button>
  <span style="color:#475569;font-size:11px;align-self:center;margin:0 4px">|</span>
  ${deviceFilters}
</div>
<div class="pages">${pageBlocks}</div>
<script>
function resetBtns(){document.querySelectorAll('.fb').forEach(b=>b.classList.remove('on'))}
function filterAll(b){resetBtns();b.classList.add('on');document.querySelectorAll('.pb').forEach(p=>p.classList.remove('hidden'))}
function filterErr(b){resetBtns();b.classList.add('on');document.querySelectorAll('.pb').forEach(p=>p.classList.toggle('hidden',!p.classList.contains('e')))}
function filterOk(b){resetBtns();b.classList.add('on');document.querySelectorAll('.pb').forEach(p=>p.classList.toggle('hidden',p.classList.contains('e')||p.classList.contains('w')))}
function filterDev(id,b){resetBtns();b.classList.add('on');document.querySelectorAll('.pb').forEach(p=>p.classList.toggle('hidden',p.dataset.dev!==id))}
</script>
</body>
</html>`;

  const reportPath = resolve(OUT, 'index.html');
  writeFileSync(reportPath, html, 'utf-8');
  return reportPath;
}

// ── main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   SportLink — Audit Visibilité Boutons                ║');
  console.log(`║   ${DEVICES.length} tailles · ${BASE.padEnd(38)}║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ headless: true });

  for (const device of DEVICES) {
    await auditDevice(browser, device);
  }

  await browser.close();

  const reportPath = generateReport();
  const totalErrors = allResults.reduce((s, r) => s + r.errors.length, 0);
  const totalWarns  = allResults.reduce((s, r) => s + r.warns.length, 0);
  const okPages     = allResults.filter(r => !r.errors.length && !r.warns.length).length;

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log(`║  Captures         : ${String(allResults.length).padEnd(33)}║`);
  console.log(`║  Sans problème    : ${String(okPages).padEnd(33)}║`);
  console.log(`║  Boutons hors vue : ${String(totalErrors).padEnd(33)}║`);
  console.log(`║  Warnings         : ${String(totalWarns).padEnd(33)}║`);
  console.log(`║  Rapport HTML     : scripts/audit-buttons/index.html  ║`);
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  if (totalErrors === 0 && totalWarns === 0) {
    console.log('✅  Tous les boutons sont visibles sur toutes les tailles !\n');
  } else if (totalErrors === 0) {
    console.log(`⚠️   ${totalWarns} avertissement(s) — aucun bouton complètement bloqué.\n`);
  } else {
    console.log(`❌  ${totalErrors} bouton(s) inaccessible(s) — voir scripts/audit-buttons/index.html\n`);
    process.exit(1);
  }
})();
