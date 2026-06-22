/**
 * Audit responsive — overflow + screenshots sur 7 tailles d'écran
 * Usage : npm run dev  puis  node scripts/responsive-audit.js
 * Output : scripts/audit-responsive/
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = resolve(__dir, 'audit-responsive');
const BASE  = process.env.SCREENSHOT_URL ?? 'http://localhost:5173';

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 320, h: 568,  label: '320-xsmall'  },   // iPhone 4 / très petits
  { w: 360, h: 640,  label: '360-small'   },   // Android compact
  { w: 375, h: 667,  label: '375-iphoneSE'},   // iPhone SE
  { w: 390, h: 844,  label: '390-iphone14'},   // iPhone 14 (ref)
  { w: 428, h: 926,  label: '428-iphone14plus'},
  { w: 768, h: 1024, label: '768-ipad'    },   // iPad portrait
  { w: 1280, h: 800, label: '1280-desktop'},   // Desktop
];

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';

const issues = [];

/* ── overflow detector ───────────────────────────────────────────────── */
async function checkOv(page, vw) {
  return page.evaluate(w => {
    function inScroll(el) {
      let n = el.parentElement;
      while (n) {
        const s = getComputedStyle(n);
        if (s.overflowX === 'auto' || s.overflowX === 'scroll') return true;
        n = n.parentElement;
      }
      return false;
    }
    const hits = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.01) return;
      if (s.overflowX === 'auto' || s.overflowX === 'scroll') return;
      if (s.position === 'fixed') return;
      if (inScroll(el)) return;
      const cls = el.className?.toString?.() ?? '';
      if (cls.includes('leaflet-tile') || cls.includes('leaflet-proxy') || cls.includes('leaflet-zoom-animated')) return;
      if (s.transform && s.transform !== 'none' && cls.includes('pointer-events-none')) return;
      const r = el.getBoundingClientRect();
      if (r.right > w + 4 || r.left < -4)
        hits.push({
          tag: el.tagName,
          id: el.id?.slice(0, 30) || '',
          cls: cls.slice(0, 50),
          txt: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
          right: Math.round(r.right),
          left: Math.round(r.left),
          overflow: Math.round(Math.max(0, r.right - w, -r.left)),
        });
    });
    return hits.slice(0, 5);
  }, vw);
}

/* ── helpers ─────────────────────────────────────────────────────────── */
async function shot(page, name, vw, label) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: resolve(OUT, `${name}.png`), clip: vw < 900 ? { x: 0, y: 0, width: vw, height: Math.min(vw * 2.5, 900) } : undefined });
  const ov = await checkOv(page, vw);
  if (ov.length) {
    const msg = ov.map(h => `${h.tag}${h.id ? '#'+h.id : ''}${h.cls ? '.'+h.cls.split(' ')[0] : ''} "${h.txt.slice(0,40)}" +${h.overflow}px`).join(' | ');
    issues.push({ screen: label, shot: name, overflow: msg });
    console.log(`  ⚠ ${name} — ${msg}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

async function goto(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(800);
}

async function enterDemo(page, profileLabel) {
  await goto(page, `${BASE}/demo`);
  await page.evaluate(() => {
    const _o = window.location.assign.bind(window.location);
    window.location.assign = (u) => { if (!String(u).includes('register')) _o(u); };
  });
  await page.waitForTimeout(1500);
  const btn = await page.$(`button:has-text("${profileLabel}")`);
  if (btn) { await btn.click({ force: true }); await page.waitForTimeout(2500); }
  const q = await page.$('button:has-text("Quitter")');
  if (q) { await q.click({ force: true }); await page.waitForTimeout(500); }
  // Consent RGPD
  try {
    await page.waitForSelector('button:has-text("Accepter et continuer")', { timeout: 5000 });
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Accepter et continuer'));
      if (b) b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(400);
  } catch { /* pas de bannière */ }
}

async function clickTab(page, label) {
  await page.evaluate(lbl => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent?.includes(lbl));
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, label);
  await page.waitForTimeout(1000);
}

async function dispatchTab(page, id) {
  await page.evaluate(tabId => {
    const el = document.querySelector(`[data-demo="tab-${tabId}"]`);
    if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }, id);
  await page.waitForTimeout(1200);
}

/* ══════════════════════════════════════════════════════════════════════ */
async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const isDesktop = vp.w >= 768;
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  ${vp.label} (${vp.w}×${vp.h})`);
    console.log('═'.repeat(55));

    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      locale: 'fr-FR',
      colorScheme: 'dark',
      userAgent: isDesktop ? undefined : MOBILE_UA,
    });
    const p = await ctx.newPage();
    const pfx = vp.label;

    /* 1. Visiteur — Home */
    await goto(p, BASE);
    await shot(p, `${pfx}--01-home`, vp.w, vp.label);

    /* 2. Clubs */
    await dispatchTab(p, 'clubs');
    await shot(p, `${pfx}--02-clubs`, vp.w, vp.label);

    /* 3. Auth modal */
    const connBtn = await p.waitForSelector(
      'button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("S\'inscrire")',
      { timeout: 3000 }
    ).catch(() => null);
    if (connBtn) {
      await connBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      await p.waitForTimeout(800);
      await shot(p, `${pfx}--03-auth-modal`, vp.w, vp.label);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
    }

    /* 4. Demo Coach — home */
    await enterDemo(p, 'Coach');
    await shot(p, `${pfx}--04-coach-home`, vp.w, vp.label);

    /* 5. Coach — clubs */
    await dispatchTab(p, 'clubs');
    await shot(p, `${pfx}--05-coach-clubs`, vp.w, vp.label);

    /* 6. Coach — Mon Club */
    await dispatchTab(p, 'mon-club');
    await shot(p, `${pfx}--06-coach-mon-club`, vp.w, vp.label);
    await clickTab(p, 'Matchs');
    await shot(p, `${pfx}--07-coach-mon-club-matchs`, vp.w, vp.label);
    await clickTab(p, 'Effectif');
    await shot(p, `${pfx}--08-coach-mon-club-effectif`, vp.w, vp.label);

    /* 7. Coach — FAB */
    await dispatchTab(p, 'home');
    await p.evaluate(() => {
      const el = document.querySelector('[data-demo="fab-add"]');
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(900);
    await shot(p, `${pfx}--09-coach-fab`, vp.w, vp.label);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);

    /* 8. Communication — PosterStudio */
    await goto(p, `${BASE}/demo`);
    await p.evaluate(() => {
      const _o = window.location.assign.bind(window.location);
      window.location.assign = (u) => { if (!String(u).includes('register')) _o(u); };
    });
    await p.waitForTimeout(1200);
    const commBtn = await p.$('button:has-text("Communication")');
    if (commBtn) {
      await commBtn.click({ force: true }); await p.waitForTimeout(2500);
      const q2 = await p.$('button:has-text("Quitter")');
      if (q2) { await q2.click({ force: true }); await p.waitForTimeout(500); }
      // find poster button
      let posterBtn = null;
      for (let sc = 0; sc < 5; sc++) {
        posterBtn = await p.$('button:has-text("affiche"), button:has-text("Affiche"), button:has-text("Générer")');
        if (posterBtn) break;
        await p.evaluate(() => window.scrollBy(0, 300));
        await p.waitForTimeout(300);
      }
      if (posterBtn) {
        await posterBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await p.waitForTimeout(3000);
        await shot(p, `${pfx}--10-poster-studio`, vp.w, vp.label);
        await p.keyboard.press('Escape');
        await p.waitForTimeout(400);
      }
    }

    /* 9. HelpPage — toutes les tabs */
    await goto(p, BASE);
    await p.waitForTimeout(500);
    const helpFab = await p.$('[aria-label*="aide"], [aria-label*="Aide"], button:has-text("?")');
    if (!helpFab) {
      // try dispatchEvent
      await p.evaluate(() => {
        const el = [...document.querySelectorAll('[aria-label]')].find(e => e.getAttribute('aria-label')?.toLowerCase().includes('aide'));
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    } else {
      await helpFab.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    }
    const helpOpened = await p.waitForSelector('[aria-label="Centre d\'aide"][role="dialog"]', { timeout: 5000 }).catch(() => null);
    if (helpOpened) {
      await p.waitForTimeout(600);
      await clickTab(p, 'FAQ');
      await shot(p, `${pfx}--11-help-faq`, vp.w, vp.label);
      await clickTab(p, 'Idées');
      await shot(p, `${pfx}--12-help-ideas`, vp.w, vp.label);
      const notifTab = await p.$('button:has-text("Notifications")');
      if (notifTab) {
        await notifTab.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await p.waitForTimeout(800);
        await shot(p, `${pfx}--13-help-notifs`, vp.w, vp.label);
      }
      // fermer
      const closeBtn = await p.$('[aria-label="Fermer l\'aide"]');
      if (closeBtn) {
        await closeBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await p.waitForSelector('[aria-label="Centre d\'aide"][role="dialog"]', { state: 'detached', timeout: 3000 }).catch(() => null);
      }
    }

    /* 10. Profil Président — dashboard + annonces + éditeur */
    await goto(p, `${BASE}/demo`);
    await p.evaluate(() => {
      const _o = window.location.assign.bind(window.location);
      window.location.assign = (u) => { if (!String(u).includes('register')) _o(u); };
    });
    await p.waitForTimeout(1200);
    const presBtn = await p.$('button:has-text("Président")');
    if (presBtn) {
      await presBtn.click({ force: true }); await p.waitForTimeout(2500);
      const q3 = await p.$('button:has-text("Quitter")');
      if (q3) { await q3.click({ force: true }); await p.waitForTimeout(500); }
      await shot(p, `${pfx}--14-president-home`, vp.w, vp.label);
      // FAB
      await p.evaluate(() => {
        const el = document.querySelector('[data-demo="fab-add"]');
        if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      await p.waitForTimeout(900);
      await shot(p, `${pfx}--15-president-fab`, vp.w, vp.label);
      // Tableau de bord
      const dashBtn = await p.$('button:has-text("Tableau de bord")');
      if (dashBtn) {
        await dashBtn.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await p.waitForTimeout(2000);
        await shot(p, `${pfx}--16-president-dashboard`, vp.w, vp.label);
        await p.keyboard.press('Escape');
        await p.waitForTimeout(500);
      }
    }

    await ctx.close();
  }

  /* ── Rapport ─────────────────────────────────────────────────────── */
  await browser.close();

  const totalShots = VIEWPORTS.length * 16; // approx
  console.log(`\n${'═'.repeat(55)}`);
  if (issues.length === 0) {
    console.log('✅ Aucun overflow détecté sur toutes les tailles');
  } else {
    console.log(`⚠ ${issues.length} overflow(s) détecté(s) :\n`);
    issues.forEach(i => console.log(`  [${i.screen}] ${i.shot}\n    → ${i.overflow}\n`));
  }
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify({ date: new Date().toISOString(), issues }, null, 2));
  console.log(`\nScreenshots → ${OUT}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
