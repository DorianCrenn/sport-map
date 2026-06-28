/**
 * full-audit.js — Audit complet SportLink v3
 *
 * Phase 1 : 7 rôles × 3 écrans × pages spécifiques au rôle (135 combos)
 *   - anonymous  : home, actualites, planning, map, clubs, profil
 *   - president  : actualites, planning, map, clubs, profil, favoris, mon-club
 *   - coach      : actualites, planning, map, clubs, profil, favoris, mon-club
 *   - communication : actualites, planning, map, clubs, profil, favoris, mon-club
 *   - parent     : actualites, planning, map, clubs, profil, favoris
 *   - player     : actualites, planning, map, clubs, profil, favoris
 *   - supporter  : actualites, planning, map, clubs, profil, favoris
 *
 * Phase 2 : URLs admin (anonymous desktop) — vérifie qu'elles ne crashent pas (6 URLs)
 *
 * Phase 3 : Interactions (coach desktop) — onglets, modales, formulaires (12 tests)
 *
 * Usage : node scripts/full-audit.js
 * Prérequis : vite preview sur localhost:4173
 */

import { chromium, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL  = process.env.PREVIEW_URL ?? 'http://localhost:4173';
const OUT_DIR   = 'e2e/audit-full';
const SHOTS_DIR = `${OUT_DIR}/screenshots`;
const REPORT_MD = `${OUT_DIR}/report.md`;

fs.mkdirSync(SHOTS_DIR, { recursive: true });

// ─── Appareils ────────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'iphone-se',     width: 375,  height: 667,  isMobile: true,  userAgent: devices['iPhone SE'].userAgent },
  { name: 'iphone-15-pro', width: 393,  height: 852,  isMobile: true,  userAgent: devices['iPhone 15 Pro'].userAgent },
  { name: 'desktop-1440',  width: 1440, height: 900,  isMobile: false, userAgent: devices['Desktop Chrome'].userAgent },
];

// ─── Rôles ────────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'anonymous',     label: 'Anonyme',            profile: null },
  { id: 'president',     label: 'Président',           profile: 'Président' },
  { id: 'coach',         label: 'Coach',               profile: 'Coach' },
  { id: 'communication', label: 'Communication',       profile: 'Communication' },
  { id: 'parent',        label: 'Parent',              profile: 'Parent' },
  { id: 'player',        label: 'Joueur',              profile: 'Joueur' },
  { id: 'supporter',     label: 'Supporter',           profile: 'Supporter' },
];

// ─── Pages ────────────────────────────────────────────────────────────────────
const PAGES_ANONYMOUS = [
  { id: 'home',       label: 'Accueil (landing)',    hash: '' },
  { id: 'actualites', label: 'Actualités',           hash: '#actualites' },
  { id: 'planning',   label: 'Planning',             hash: '#planning' },
  { id: 'map',        label: 'Carte',                hash: '#map' },
  { id: 'clubs',      label: 'Clubs',                hash: '#clubs' },
  { id: 'profil',     label: 'Profil (auth)',        hash: '#profil' },
];

const PAGES_CLUB_MANAGER = [
  { id: 'actualites', label: 'Actualités',           hash: '#actualites' },
  { id: 'planning',   label: 'Planning',             hash: '#planning' },
  { id: 'map',        label: 'Carte',                hash: '#map' },
  { id: 'clubs',      label: 'Clubs',                hash: '#clubs' },
  { id: 'profil',     label: 'Profil',               hash: '#profil' },
  { id: 'favoris',    label: 'Favoris',              hash: '#favoris' },
  { id: 'mon-club',   label: 'Mon Club',             hash: '#mon-club' },
];

const PAGES_USER = [
  { id: 'actualites', label: 'Actualités',           hash: '#actualites' },
  { id: 'planning',   label: 'Planning',             hash: '#planning' },
  { id: 'map',        label: 'Carte',                hash: '#map' },
  { id: 'clubs',      label: 'Clubs',                hash: '#clubs' },
  { id: 'profil',     label: 'Profil',               hash: '#profil' },
  { id: 'favoris',    label: 'Favoris',              hash: '#favoris' },
];

const ADMIN_URLS = [
  { id: 'admin',             label: 'Admin — Dashboard',   hash: '#admin' },
  { id: 'admin-feedback',    label: 'Admin — Feedback',    hash: '#admin-feedback' },
  { id: 'admin-analytics',   label: 'Admin — Analytics',  hash: '#admin-analytics' },
  { id: 'admin-plans',       label: 'Admin — Plans',       hash: '#admin-plans' },
  { id: 'admin-permissions', label: 'Admin — Permissions', hash: '#admin-permissions' },
  { id: 'admin-audit',       label: 'Admin — Audit Log',   hash: '#admin-audit' },
];

function getPagesForRole(role) {
  if (!role.profile) return PAGES_ANONYMOUS;
  if (['president', 'coach', 'communication'].includes(role.id)) return PAGES_CLUB_MANAGER;
  return PAGES_USER;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

async function setupAnonymous(page) {
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1200);
}

async function setupDemo(page, profileName) {
  await page.goto(BASE_URL + '/demo', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);

  const profileCard = page.locator('[data-profile]').filter({ hasText: new RegExp(profileName, 'i') }).first();
  const found = await profileCard.isVisible({ timeout: 4000 }).catch(() => false);
  if (found) {
    await profileCard.click();
    await page.waitForTimeout(2000);
  } else {
    const textBtn = page.getByText(profileName, { exact: false }).first();
    if (await textBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Ne pas fermer le guide ici — Phase 1 teste avec le guide ouvert (expérience réelle)
  // Phase 3 le ferme avant chaque interaction via closeGuide()
}

async function closeGuide(page) {
  // D'abord essayer via title (DemoGuide plein)
  for (const sel of [
    'button[title="Réduire en bulle"]',
    'button[title*="Réduire" i]',
  ]) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 600 }).catch(() => false)) {
      await btn.click(); await page.waitForTimeout(500); return;
    }
  }
  // Fallback : texte du bouton
  const byText = page.getByText(/▼\s*Réduire/);
  if (await byText.isVisible({ timeout: 600 }).catch(() => false)) {
    await byText.click(); await page.waitForTimeout(500); return;
  }
}

async function navigateTo(page, role, hash) {
  const base = role.profile ? BASE_URL + '/demo' : BASE_URL + '/';
  const url  = hash ? base + hash : base;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
}

// ─── Checks ───────────────────────────────────────────────────────────────────

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const docW = document.documentElement.scrollWidth;
    const bodW = document.body.scrollWidth;
    const winW = window.innerWidth;
    const issues = [];
    if (docW > winW + 8) issues.push(`Overflow horizontal : ${docW}px > ${winW}px`);
    else if (bodW > winW + 8) issues.push(`Overflow horizontal body : ${bodW}px > ${winW}px`);
    return issues;
  });
}

async function checkButtons(page, isMobile) {
  return await page.evaluate((mobile) => {
    const btns = Array.from(document.querySelectorAll('button:not([disabled]),[role="button"]:not([disabled]),a[href]'));
    let noLabel = 0, smallTarget = 0;
    for (const btn of btns) {
      const rect = btn.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) continue;
      if (!(btn.getAttribute('aria-label') || btn.textContent?.trim())) noLabel++;
      if (mobile && (rect.height < 36 || rect.width < 36)) smallTarget++;
    }
    const issues = [];
    if (noLabel > 2)     issues.push(`${noLabel} bouton(s) sans aria-label ni texte`);
    if (smallTarget > 3) issues.push(`${smallTarget} bouton(s) avec cible tactile < 36px`);
    return issues;
  }, isMobile);
}

async function checkConsoleErrors(errors) {
  return errors.filter(e =>
    !e.includes('favicon') && !e.includes('Manifest') && !e.includes('sw.js') &&
    !e.includes('workbox') && !e.includes('preload') && !e.includes('mock') &&
    !e.includes('supabase.co') && !e.includes('ResizeObserver') &&
    !e.includes('Failed to fetch') && !e.includes('fetch failed') &&
    e.length < 300,
  ).slice(0, 3);
}

async function checkTextTruncation(page) {
  return await page.evaluate(() => {
    const issues = [];
    for (const el of document.querySelectorAll('h1,h2,h3')) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.bottom < 0 || rect.top > window.innerHeight) continue;
      if (el.scrollWidth > el.clientWidth + 10) {
        issues.push(`Titre tronqué: <${el.tagName.toLowerCase()}> "${el.textContent?.slice(0,40).trim()}"`);
        if (issues.length >= 2) break;
      }
    }
    return issues;
  });
}

async function checkPageLoad(page) {
  return await page.evaluate(() => {
    const hasContent    = (document.body.textContent?.trim().length ?? 0) > 100;
    const spinnerOnly   = !!(document.querySelector('[data-loading="true"],.loading-spinner') &&
                             !document.querySelector('button,a[href],h1,h2'));
    if (!hasContent)   return ['Page vide ou non chargée'];
    if (spinnerOnly)   return ['Spinner de chargement uniquement'];
    return [];
  });
}

// ─── auditPage avec retry ─────────────────────────────────────────────────────

async function auditPage(page, viewport, role, pageConfig, consoleErrors, attempt = 1) {
  const result = {
    role: role.id, roleLabel: role.label,
    viewport: viewport.name,
    page: pageConfig.id, pageLabel: pageConfig.label,
    issues: [], warnings: [], screenshot: null, passed: true,
  };
  try {
    await navigateTo(page, role, pageConfig.hash);
    await page.waitForTimeout(attempt === 1 ? 400 : 900); // attente + longue au retry

    const shotName = `${role.id}__${viewport.name}__${pageConfig.id}.png`;
    await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: false });
    result.screenshot = shotName;

    const overflow   = await checkOverflow(page);
    const buttons    = await checkButtons(page, viewport.isMobile);
    const truncs     = await checkTextTruncation(page);
    const consolErrs = await checkConsoleErrors(consoleErrors);
    const loadIssues = await checkPageLoad(page);

    result.issues.push(...overflow.map(i   => `🔴 ${i}`));
    result.issues.push(...consolErrs.map(e => `🔴 Console: ${e}`));
    result.issues.push(...loadIssues.map(i => `🔴 Chargement: ${i}`));
    result.warnings.push(...buttons.map(i  => `🟡 A11Y: ${i}`));
    result.warnings.push(...truncs.map(i   => `🟡 ${i}`));
    result.passed = result.issues.length === 0;

  } catch (err) {
    const msg = err.message.slice(0, 120);
    // Retry une fois sur les erreurs de timing Playwright connues
    const isFlaky = msg.includes('Execution context was destroyed') ||
                    msg.includes('context was destroyed') ||
                    msg.includes('Target closed') ||
                    (msg.includes('Navigation to') && msg.includes('interrupted by another navigation'));
    if (isFlaky && attempt === 1) {
      await page.waitForTimeout(1500);
      return auditPage(page, viewport, role, pageConfig, consoleErrors, 2);
    }
    result.issues.push(`🔴 Erreur: ${msg}`);
    result.passed = false;
  }
  return result;
}

// ─── Phase 2 : Admin URLs ────────────────────────────────────────────────────

async function runAdminAudit(browser) {
  console.log('\n📋 Phase 2 — URLs Admin (anonymous, desktop)\n');
  const results = [];
  const viewport = VIEWPORTS.find(v => v.name === 'desktop-1440');

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.userAgent,
    locale: 'fr-FR', timezoneId: 'Europe/Paris',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await setupAnonymous(page);
  let done = 0;

  for (const adminPage of ADMIN_URLS) {
    consoleErrors.length = 0;
    const result = {
      role: 'anonymous', roleLabel: 'Anonyme (admin URL)', viewport: 'desktop-1440',
      page: adminPage.id, pageLabel: adminPage.label,
      issues: [], warnings: [], screenshot: null, passed: true, phase: 'admin',
    };
    try {
      await page.goto(BASE_URL + '/' + adminPage.hash, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1500); // admin guard → auth check peut prendre 1s+

      const shotName = `admin__desktop__${adminPage.id}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: false });
      result.screenshot = shotName;

      const overflow   = await checkOverflow(page);
      const consolErrs = await checkConsoleErrors(consoleErrors);
      const loadIssues = await checkPageLoad(page);

      result.issues.push(...overflow.map(i   => `🔴 ${i}`));
      result.issues.push(...consolErrs.map(e => `🔴 Console: ${e}`));
      // #admin sans auth → comportement attendu (redirection/empty), pas un bug
      if (adminPage.id === 'admin' && loadIssues.length > 0) {
        result.warnings.push(...loadIssues.map(i => `🟡 Attendu (guard): ${i}`));
      } else {
        result.issues.push(...loadIssues.map(i => `🔴 Chargement: ${i}`));
      }
      result.passed = result.issues.length === 0;
    } catch (err) {
      result.issues.push(`🔴 Erreur: ${err.message.slice(0, 120)}`);
      result.passed = false;
    }
    results.push(result);
    done++;
    const adminIcon = result.passed ? (result.warnings.length ? '⚠️' : '✅') : '❌';
    console.log(`${adminIcon} [admin-${done}] ${adminPage.id}`);
  }

  await context.close();
  return results;
}

// ─── Phase 3 : Interactions ───────────────────────────────────────────────────

const INTERACTION_TESTS = [
  {
    id: 'tab-feed-matchs',
    label: 'Actualités — filtre Matchs (PlanningTimeline)',
    page: '#actualites',
    action: async (page) => {
      // PlanningTimeline est intégrée dans la page Actualités avec des FilterPill "Tout"/"Matchs"/"Entraînements"
      // force:true car le guide peut intercepter les pointer events même sans le couvrir physiquement
      const tab = page.getByRole('button', { name: /^matchs$/i }).first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click({ force: true }); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash filtre Matchs dans PlanningTimeline (Actualités)'] : [];
    },
  },
  {
    id: 'tab-feed-competitions',
    label: 'Actualités — onglet Compétitions',
    page: '#actualites',
    action: async (page) => {
      const tab = page.getByRole('button', { name: /comp[eé]titions?/i }).first();
      if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tab.click(); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash après changement d\'onglet Compétitions'] : [];
    },
  },
  {
    id: 'tab-planning-matchs',
    label: 'Planning — filtre Matchs',
    page: '#planning',
    action: async (page) => {
      const btn = page.getByRole('button', { name: /^matchs$/i }).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click({ force: true }); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash filtre Matchs dans Planning'] : [];
    },
  },
  {
    id: 'tab-planning-training',
    label: 'Planning — filtre Entraînements',
    page: '#planning',
    action: async (page) => {
      const btn = page.getByRole('button', { name: /entra[îi]nements/i }).first();
      if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await btn.click({ force: true }); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash filtre Entraînements dans Planning'] : [];
    },
  },
  {
    id: 'mon-club-sections',
    label: 'Mon Club — navigation onglets internes',
    page: '#mon-club',
    action: async (page) => {
      // ClubPageView a des tabs role="tab" : Accueil / Actualités / Matchs / Effectif / Infos
      for (const label of ['Actualités', 'Matchs', 'Effectif', 'Infos']) {
        const tab = page.getByRole('tab', { name: new RegExp(label, 'i') }).first();
        if (await tab.isVisible({ timeout: 1500 }).catch(() => false)) {
          await tab.click(); await page.waitForTimeout(400);
        }
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash navigation onglets Mon Club'] : [];
    },
  },
  {
    id: 'clubs-open-detail',
    label: 'Clubs — ouvrir fiche club',
    page: '#clubs',
    action: async (page) => {
      // Cliquer sur le premier club dans la liste
      const clubCard = page.locator('[data-club-id],[data-testid*="club"],[class*="club-card"]').first();
      const simpleCard = page.locator('article,li').filter({ hasText: /fc|sport|club|équipe/i }).first();
      const target = (await clubCard.isVisible({ timeout: 2000 }).catch(() => false)) ? clubCard : simpleCard;
      if (await target.isVisible({ timeout: 2000 }).catch(() => false)) {
        await target.click(); await page.waitForTimeout(800);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash ouverture fiche club'] : [];
    },
  },
  {
    id: 'open-event-form',
    label: 'Créer un événement (FAB +)',
    page: '#planning',
    action: async (page) => {
      // Chercher le bouton FAB d'ajout d'événement
      const fab = page.locator('button[aria-label*="ajout" i],button[aria-label*="créer" i],button[aria-label*="event" i],[data-fab]').first();
      const plusBtn = page.locator('button').filter({ hasText: /^\+$/ }).first();
      const target = (await fab.isVisible({ timeout: 1500 }).catch(() => false)) ? fab : plusBtn;
      if (await target.isVisible({ timeout: 1500 }).catch(() => false)) {
        await target.click(); await page.waitForTimeout(800);
      }
    },
    check: async (page) => {
      // Vérifier que la modale de création s'est ouverte
      const hasModal = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"],[data-modal],[class*="modal"],[class*="sheet"]');
      });
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      if (crashed) return ['Crash ouverture formulaire événement'];
      if (!hasModal) return ['Formulaire événement non ouvert (FAB introuvable ou non fonctionnel)'];
      return [];
    },
    isWarning: true, // pas bloquant si FAB non trouvé en mode démo
  },
  {
    id: 'close-event-form',
    label: 'Fermer la modale événement',
    page: '#planning',
    action: async (page) => {
      const closeBtn = page.locator('[aria-label*="fermer" i],[aria-label*="close" i],[aria-label*="annuler" i]').first();
      const escBtn = page.keyboard.press('Escape');
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click(); await page.waitForTimeout(400);
      } else {
        await escBtn; await page.waitForTimeout(400);
      }
    },
    check: async (page) => {
      const hasModal = await page.evaluate(() => !!document.querySelector('[role="dialog"]'));
      return hasModal ? ['Modale événement non fermée'] : [];
    },
    isWarning: true,
  },
  {
    id: 'open-help',
    label: 'Ouvrir la page Aide (HelpFab)',
    page: '#actualites',
    action: async (page) => {
      // HelpFab flottant — aria-label="Centre d'aide" (fixe)
      const helpFab = page.locator('[aria-label*="Centre" i],[aria-label*="aide" i],[data-help-fab]').first();
      if (await helpFab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await helpFab.click({ force: true }); await page.waitForTimeout(600);
      }
    },
    check: async (page) => {
      const hasHelp = await page.evaluate(() => {
        const text = document.body.textContent ?? '';
        return text.includes('FAQ') || text.includes('Aide') || text.includes('Idées') || text.includes('Question fréquente');
      });
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      if (crashed) return ['Crash ouverture HelpPage'];
      if (!hasHelp) return ['HelpPage non ouverte (FAB non trouvé)'];
      return [];
    },
    isWarning: true,
  },
  {
    id: 'favoris-tabs',
    label: 'Favoris — navigation onglets',
    page: '#favoris',
    action: async (page) => {
      // FavorisPage utilise role="tab" dans un role="tablist"
      for (const label of ['Matchs', 'Clubs']) {
        const tab = page.getByRole('tab', { name: new RegExp(label, 'i') }).first();
        if (await tab.isVisible({ timeout: 1500 }).catch(() => false)) {
          await tab.click(); await page.waitForTimeout(400);
        }
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash navigation onglets Favoris'] : [];
    },
  },
  {
    id: 'map-search',
    label: 'Carte — ouvrir recherche / filtres',
    page: '#map',
    action: async (page) => {
      const searchBtn = page.locator('button[aria-label*="recherche" i],button[aria-label*="filtre" i],[data-search]').first();
      if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchBtn.click(); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash ouverture recherche sur la carte'] : [];
    },
    isWarning: true,
  },
  {
    id: 'profil-menu',
    label: 'Profil — ouvrir menu paramètres',
    page: '#profil',
    action: async (page) => {
      const menuBtn = page.locator('button[aria-label*="param" i],button[aria-label*="réglage" i],[data-settings]').first();
      if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuBtn.click(); await page.waitForTimeout(500);
      }
    },
    check: async (page) => {
      const crashed = await page.evaluate(() => document.body.textContent?.includes('Something went wrong'));
      return crashed ? ['Crash ouverture paramètres profil'] : [];
    },
    isWarning: true,
  },
];

async function runInteractionAudit(browser) {
  console.log('\n🖱️  Phase 3 — Tests d\'interaction (coach, desktop)\n');
  const results = [];
  const viewport = VIEWPORTS.find(v => v.name === 'desktop-1440');
  const role = ROLES.find(r => r.id === 'coach');

  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent: viewport.userAgent,
    locale: 'fr-FR', timezoneId: 'Europe/Paris',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await setupDemo(page, role.profile);
  let done = 0;

  for (const test of INTERACTION_TESTS) {
    consoleErrors.length = 0;
    const result = {
      role: 'coach', roleLabel: 'Coach (interaction)',
      viewport: 'desktop-1440',
      page: test.id, pageLabel: test.label,
      issues: [], warnings: [], screenshot: null, passed: true, phase: 'interaction',
    };
    try {
      await navigateTo(page, role, test.page);
      await page.waitForTimeout(500);

      // Fermer le guide si encore présent après navigation
      await closeGuide(page);

      await test.action(page);
      await page.waitForTimeout(300);

      const shotName = `interaction__${test.id}.png`;
      await page.screenshot({ path: path.join(SHOTS_DIR, shotName), fullPage: false });
      result.screenshot = shotName;

      const checkIssues = await test.check(page);
      const consolErrs  = await checkConsoleErrors(consoleErrors);
      const overflow    = await checkOverflow(page);

      if (test.isWarning) {
        result.warnings.push(...checkIssues.map(i => `🟡 ${i}`));
      } else {
        result.issues.push(...checkIssues.map(i => `🔴 ${i}`));
      }
      result.issues.push(...consolErrs.map(e => `🔴 Console: ${e}`));
      result.issues.push(...overflow.map(i   => `🔴 ${i}`));
      result.passed = result.issues.length === 0;

    } catch (err) {
      result.issues.push(`🔴 Erreur: ${err.message.slice(0, 120)}`);
      result.passed = false;
    }
    results.push(result);
    done++;
    const icon = result.passed ? (result.warnings.length ? '⚠️' : '✅') : '❌';
    console.log(`${icon} [interaction-${done}] ${test.label}`);
  }

  await context.close();
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🔍 Audit complet SportLink v3\n');
  const browser = await chromium.launch({ headless: true });
  const allResults = [];

  // ── Phase 1 : Pages ──────────────────────────────────────────────────────────
  console.log('📄 Phase 1 — Audit pages (7 rôles × 3 écrans)\n');
  let done = 0;
  const totalPhase1 = ROLES.reduce((acc, role) => acc + getPagesForRole(role).length, 0) * VIEWPORTS.length;

  for (const viewport of VIEWPORTS) {
    for (const role of ROLES) {
      const pages = getPagesForRole(role);

      const context = await browser.newContext({
        viewport:  { width: viewport.width, height: viewport.height },
        userAgent: viewport.userAgent ?? undefined,
        isMobile:  viewport.isMobile,
        locale:    'fr-FR', timezoneId: 'Europe/Paris',
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      page.on('pageerror', err => consoleErrors.push(err.message));

      if (role.profile) await setupDemo(page, role.profile);
      else              await setupAnonymous(page);

      for (const pageConfig of pages) {
        consoleErrors.length = 0;
        const result = await auditPage(page, viewport, role, pageConfig, consoleErrors);
        result.phase = 'pages';
        allResults.push(result);
        done++;
        const icon = result.passed ? (result.warnings.length ? '⚠️' : '✅') : '❌';
        const wTxt = result.warnings.length ? ` (${result.warnings.length}w)` : '';
        console.log(`${icon} [${done}/${totalPhase1}] ${role.id} | ${viewport.name} | ${pageConfig.id}${wTxt}`);
      }
      await context.close();
    }
  }

  // ── Phase 2 : Admin URLs ──────────────────────────────────────────────────────
  const adminResults = await runAdminAudit(browser);
  adminResults.forEach(r => allResults.push(r));

  // ── Phase 3 : Interactions ────────────────────────────────────────────────────
  const interactionResults = await runInteractionAudit(browser);
  interactionResults.forEach(r => allResults.push(r));

  await browser.close();

  generateReport(allResults);
  console.log(`\n📄 Rapport : ${REPORT_MD}`);
  console.log(`📸 Screenshots : ${SHOTS_DIR}/`);
  console.log(`📊 JSON : ${OUT_DIR}/results.json`);
}

// ─── Rapport ──────────────────────────────────────────────────────────────────

function generateReport(results) {
  const phase1 = results.filter(r => r.phase === 'pages');
  const phase2 = results.filter(r => r.phase === 'admin');
  const phase3 = results.filter(r => r.phase === 'interaction');

  const scoreSection = (items, label) => {
    const total  = items.length;
    const passed = items.filter(r => r.passed && r.warnings.length === 0).length;
    const warned = items.filter(r => r.passed && r.warnings.length > 0).length;
    const failed = items.filter(r => !r.passed).length;
    const score  = total > 0 ? Math.round((passed + warned * 0.8) / total * 100) : 100;
    return { total, passed, warned, failed, score, label };
  };

  const s1 = scoreSection(phase1, 'Pages');
  const s2 = scoreSection(phase2, 'Admin URLs');
  const s3 = scoreSection(phase3, 'Interactions');
  const global = scoreSection(results, 'Global');

  let md = `# 🔍 Audit Complet SportLink v3 — Rapport\n\n`;
  md += `> Généré le ${new Date().toLocaleString('fr-FR')}\n`;
  md += `> **${results.length} tests** — Phase 1 : ${phase1.length} | Phase 2 : ${phase2.length} | Phase 3 : ${phase3.length}\n\n`;

  md += `## Score global : ${global.score}/100\n\n`;
  md += `| Phase | Tests | ✅ | ⚠️ | ❌ | Score |\n|---|---|---|---|---|---|\n`;
  for (const s of [s1, s2, s3, global]) {
    md += `| ${s.label} | ${s.total} | ${s.passed} | ${s.warned} | ${s.failed} | **${s.score}/100** |\n`;
  }

  // Phase 1 par rôle
  md += `\n## Phase 1 — Par rôle\n\n`;
  md += `| Rôle | ✅ | ⚠️ | ❌ | Pages testées |\n|---|---|---|---|---|\n`;
  const byRole = groupBy(phase1, 'role');
  for (const [rid, items] of Object.entries(byRole)) {
    const ok = items.filter(r => r.passed && r.warnings.length === 0).length;
    const wn = items.filter(r => r.passed && r.warnings.length > 0).length;
    const fa = items.filter(r => !r.passed).length;
    const pages = [...new Set(items.map(r => r.page))].join(', ');
    md += `| ${items[0]?.roleLabel ?? rid} | ${ok} | ${wn} | ${fa} | ${pages} |\n`;
  }

  // Phase 1 par page
  md += `\n## Phase 1 — Par page\n\n`;
  md += `| Page | ✅ | ⚠️ | ❌ |\n|---|---|---|---|\n`;
  const byPage = groupBy(phase1, 'page');
  for (const [pid, items] of Object.entries(byPage)) {
    const ok = items.filter(r => r.passed && r.warnings.length === 0).length;
    const wn = items.filter(r => r.passed && r.warnings.length > 0).length;
    const fa = items.filter(r => !r.passed).length;
    md += `| ${items[0]?.pageLabel ?? pid} | ${ok} | ${wn} | ${fa} |\n`;
  }

  // Phase 2
  md += `\n## Phase 2 — URLs Admin (anonymous)\n\n`;
  md += `| URL | Statut | Notes |\n|---|---|---|\n`;
  for (const r of phase2) {
    const icon = r.passed ? '✅' : '❌';
    const notes = [...r.issues, ...r.warnings].join('; ') || '—';
    md += `| ${r.pageLabel} | ${icon} | ${notes} |\n`;
  }

  // Phase 3
  md += `\n## Phase 3 — Interactions\n\n`;
  md += `| Test | Statut | Notes |\n|---|---|---|\n`;
  for (const r of phase3) {
    const icon = !r.passed ? '❌' : r.warnings.length ? '⚠️' : '✅';
    const notes = [...r.issues, ...r.warnings].join('; ') || '—';
    md += `| ${r.pageLabel} | ${icon} | ${notes} |\n`;
  }

  // Problèmes détaillés
  const problems = results.filter(r => !r.passed || r.warnings.length > 0);
  if (problems.length > 0) {
    md += `\n## Problèmes détaillés\n\n`;
    for (const r of problems) {
      const icon = !r.passed ? '❌' : '⚠️';
      md += `### ${icon} [${r.phase?.toUpperCase()}] ${r.roleLabel} — ${r.viewport} — ${r.pageLabel}\n\n`;
      r.issues.forEach(i   => { md += `- ${i}\n`; });
      r.warnings.forEach(w => { md += `- ${w}\n`; });
      if (r.screenshot) md += `\n📸 \`screenshots/${r.screenshot}\`\n`;
      md += '\n';
    }
  }

  // Recommandations
  md += `\n## Recommandations\n\n`;
  const allIssues = results.flatMap(r => r.issues);
  const allWarns  = results.flatMap(r => r.warnings);
  const overflows = allIssues.filter(i => i.includes('Overflow'));
  const consoles  = allIssues.filter(i => i.includes('Console'));
  const crashes   = allIssues.filter(i => i.includes('Erreur') || i.includes('Crash'));
  const a11y      = allWarns.filter(w => w.includes('A11Y'));

  if (overflows.length) md += `- 🔴 **${overflows.length} overflow(s)** détectés\n`;
  if (consoles.length)  md += `- 🔴 **${consoles.length} erreur(s) console** — voir détails\n`;
  if (crashes.length)   md += `- 🔴 **${crashes.length} crash(es)** — voir détails\n`;
  if (a11y.length)      md += `- 🟡 **${a11y.length} problème(s) a11y** (cibles tactiles)\n`;
  if (!overflows.length && !consoles.length && !crashes.length) {
    md += `- ✅ Aucun problème critique — layout, console et navigation sains\n`;
  }
  if (!a11y.length) md += `- ✅ Accessibilité tactile OK sur tous les écrans testés\n`;

  fs.writeFileSync(REPORT_MD, md);
  fs.writeFileSync(`${OUT_DIR}/results.json`, JSON.stringify(results, null, 2));
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

run().catch(err => { console.error('❌ Audit échoué:', err); process.exit(1); });
