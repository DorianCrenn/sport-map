/**
 * Audit visuel — nouveaux flux : popup post-événement, affiche avant-match, formulaire équipe adverse
 * Usage: node scripts/audit-new-features.js
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT  = resolve(__dir, 'audit-new-features');
const BASE = process.env.SCREENSHOT_URL ?? 'http://localhost:5179';
const W = 390, H = 844, SCALE = 2;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const results = [];
const pass = (n, note='') => { results.push({ n, s: 'ok', note });   console.log(`  ✅ ${n}${note ? '  (' + note + ')' : ''}`); };
const warn = (n, note='') => { results.push({ n, s: 'warn', note }); console.log(`  ⚠️  ${n}${note ? '  (' + note + ')' : ''}`); };

let sc = 0;
const shot = async (page, name) => {
  const file = `${OUT}/${String(++sc).padStart(2,'0')}-${name}.png`;
  await page.screenshot({ path: file, fullPage: false });
  console.log(`     📸 ${name}`);
};

async function mobilePage(browser, scheme = 'dark') {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: SCALE,
    locale: 'fr-FR', colorScheme: scheme,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.error('  ❌ JS error:', e.message));
  return { ctx, page };
}

async function launchDemoAndSelect(page, profileLabel) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('sl-launch-demo')));
  await page.waitForTimeout(1200);
  await page.getByText(profileLabel, { exact: true }).first().click({ timeout: 5000 });
  await page.waitForTimeout(1800);
  // Réduire le guide pour dégager le FAB
  const reduireBtn = page.getByText('▼ Réduire').first();
  if (await reduireBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await reduireBtn.click();
    await page.waitForTimeout(500);
  }
  // Scroll en haut de la page
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════');
console.log('  AUDIT VISUEL — NOUVEAUX FLUX SPORTLINK');
console.log('══════════════════════════════════════════\n');

const browser = await chromium.launch({ headless: true });

// ─────────────────────────────────────────────────────────────────────────────
// A. CoachMatchCard (QuickActionsSection) + MatchPlanningCard — Coach
// ─────────────────────────────────────────────────────────────────────────────
console.log('🎯 A. CoachMatchCard + PlanningCard (Coach)');
{
  const { ctx, page } = await mobilePage(browser);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await launchDemoAndSelect(page, 'Coach');

  // Capture du haut de la page (QuickActionsSection)
  await shot(page, 'coach-top-section');

  // Cherche la CoachMatchCard (has convocation-btn data-demo)
  const convocBtnLocator = page.locator('[data-demo="convocation-btn"]').first();
  const hasConvocBtn = await convocBtnLocator.isVisible({ timeout: 2000 }).catch(() => false);

  if (hasConvocBtn) {
    await convocBtnLocator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, 'coach-quickaction-card');
    pass('CoachMatchCard — visible dans QuickActionsSection');
  } else {
    warn('CoachMatchCard convocation-btn', 'non visible en haut de page');
  }

  // Scroll pour trouver "Affiche avant-match" (CoachMatchCard pre_empty/pre_filled)
  const afficheBtn = page.getByText('Affiche avant-match').first();
  const hasAffiche = await afficheBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (hasAffiche) {
    await afficheBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, 'coach-matchcard-poster-btn');
    pass('Bouton "🎨 Affiche avant-match" (CoachMatchCard)');
  } else {
    // Peut-être en état match_day — chercher le bouton Live
    const hasLive = await page.getByText('Lancer le Live').isVisible({ timeout: 1500 }).catch(() => false);
    if (hasLive) {
      warn('Affiche avant-match dans CoachMatchCard', 'match_day aujourd\'hui (Live visible)');
      await shot(page, 'coach-matchday-live-btn');
    } else {
      warn('Affiche avant-match dans CoachMatchCard', 'non trouvé — vérifier fixtures demo');
    }
  }

  // Scroll jusqu'à PlanningTimeline pour voir MatchPlanningCard
  const planningHeader = page.getByText('Planning de la Saison').first();
  if (await planningHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
    await planningHeader.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot(page, 'coach-planning-timeline');
  }

  // Dans MatchPlanningCard pre_match: "Créer l'affiche" orange
  const creerAfficheTimeline = page.getByText('Créer l\'affiche').first();
  if (await creerAfficheTimeline.isVisible({ timeout: 2000 }).catch(() => false)) {
    await creerAfficheTimeline.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, 'coach-planning-card-affiche');
    pass('"Créer l\'affiche" dans MatchPlanningCard (pre_match)');
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// B. Président
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n👑 B. CoachMatchCard + PlanningCard (Président)');
{
  const { ctx, page } = await mobilePage(browser);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await launchDemoAndSelect(page, 'Président');

  await shot(page, 'president-top-section');

  const afficheBtn = page.getByText('Affiche avant-match').first();
  if (await afficheBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await afficheBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await shot(page, 'president-matchcard-poster-btn');
    pass('Bouton "🎨 Affiche avant-match" (Président)');
  } else {
    warn('Affiche avant-match Président', 'non visible');
    await shot(page, 'president-matchcard-state');
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Formulaire événement — step 1, 2, 3, popup succès
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📝 C. Formulaire événement complet');
{
  const { ctx, page } = await mobilePage(browser);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await launchDemoAndSelect(page, 'Coach');
  await page.waitForTimeout(500);

  // Cliquer FAB avec force:true pour passer le guide overlay
  const fab = page.locator('[data-demo="fab-add"]');
  await fab.click({ timeout: 5000 });
  await page.waitForTimeout(600);
  await shot(page, 'form-fab-menu');

  // Cliquer "Créer un événement"
  const fabEvent = page.locator('[data-demo="fab-event"]');
  const fabEventVisible = await fabEvent.isVisible({ timeout: 3000 }).catch(() => false);
  if (fabEventVisible) {
    await fabEvent.click({ force: true });
    await page.waitForTimeout(900);
    await shot(page, 'form-step1-sport');
    pass('Formulaire — Step 1 (type sport)');

    // Étape 2
    const next1 = page.locator('[role="dialog"] button').filter({ hasText: /^Suivant/ }).first();
    if (await next1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await next1.click();
      await page.waitForTimeout(800);
      await shot(page, 'form-step2-teams-top');

      // Scroll pour voir "Équipe adverse"
      await page.evaluate(() => window.scrollBy(0, 250));
      await page.waitForTimeout(400);
      await shot(page, 'form-step2-teams-bottom');

      const hasMonEquipe   = await page.getByText(/mon équipe/i).isVisible({ timeout: 2000 }).catch(() => false);
      const hasAdversaire  = await page.getByText(/équipe adverse/i).isVisible({ timeout: 2000 }).catch(() => false);
      const hasApercu      = await page.getByText(/aperçu/i).isVisible({ timeout: 2000 }).catch(() => false);

      if (hasMonEquipe)  pass('Champ "Mon équipe"');   else warn('Champ "Mon équipe"', 'non visible');
      if (hasAdversaire) pass('Champ "Équipe adverse"'); else warn('Champ "Équipe adverse"', 'non visible');
      if (hasApercu)     pass('Aperçu du titre');         else warn('Aperçu', 'non visible');

      // Remplir adversaire pour générer un titre
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      const adversaireInput = page.locator('input[placeholder*="Quimper"], input[placeholder*="adversaire"], input[placeholder*="Plougastel"]').first();
      if (await adversaireInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await adversaireInput.fill('AS Quimper');
        await page.waitForTimeout(400);
        await shot(page, 'form-step2-filled');
        pass('Champ adversaire rempli → titre généré');
      }

      // Étape 3
      const next2 = page.locator('[role="dialog"] button').filter({ hasText: /^Suivant/ }).first();
      if (await next2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await next2.click();
        await page.waitForTimeout(800);
        await shot(page, 'form-step3-datetime');
        pass('Formulaire — Step 3 (date/heure/lieu)');

        // Remplir la date
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dateInput.fill('2030-09-15');
          await page.waitForTimeout(400);

          // Soumettre
          const submitBtn = page.getByRole('button', { name: /créer l'événement/i }).first();
          if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(1800);
            await shot(page, 'form-success-popup');

            const hasEvenementCree = await page.getByText(/événement créé/i).isVisible({ timeout: 2000 }).catch(() => false);
            const hasEtMaintenant  = await page.getByText('Et maintenant ?').isVisible({ timeout: 2000 }).catch(() => false);
            const hasConvocBtn     = await page.locator('[data-demo="convocation-popup-btn"]').isVisible({ timeout: 2000 }).catch(() => false);
            const hasAfficheBtn    = await page.getByText("Créer l'affiche").isVisible({ timeout: 2000 }).catch(() => false);
            const hasFermer        = await page.getByRole('button', { name: /fermer/i }).isVisible({ timeout: 1500 }).catch(() => false);

            if (hasEvenementCree) pass('Popup — "Événement créé !"'); else warn('Popup succès', '"Événement créé" absent');
            if (hasEtMaintenant)  pass('Popup — label "Et maintenant ?"'); else warn('Popup', '"Et maintenant ?" absent');
            if (hasConvocBtn)     pass('Popup — bouton Convoquer (data-demo="convocation-popup-btn")'); else warn('Popup', 'bouton Convoquer absent');
            if (hasAfficheBtn)    pass('Popup — bouton "Créer l\'affiche"'); else warn('Popup', '"Créer l\'affiche" absent');
            if (hasFermer)        pass('Popup — bouton Fermer'); else warn('Popup', 'bouton Fermer absent');

            // Scroll vers les boutons pour zoom
            if (hasConvocBtn) {
              await page.locator('[data-demo="convocation-popup-btn"]').scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await shot(page, 'form-success-popup-buttons');
            }
          } else {
            warn('Bouton "Créer l\'événement"', 'non visible');
          }
        }
      }
    }
  } else {
    warn('FAB menu fab-event', 'non visible après clic FAB');
    await shot(page, 'form-fab-issue');
  }

  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// D. Communicant — popup sans bouton Convoquer
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n📣 D. Popup Communicant (pas de convoc)');
{
  const { ctx, page } = await mobilePage(browser);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await launchDemoAndSelect(page, 'Communication');
  await page.waitForTimeout(300);

  const fab = page.locator('[data-demo="fab-add"]');
  if (await fab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fab.click({ force: true });
    await page.waitForTimeout(500);
    const fabEvent = page.locator('[data-demo="fab-event"]');
    if (await fabEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fabEvent.click();
      await page.waitForTimeout(700);
      for (let i = 0; i < 2; i++) {
        const next = page.locator('[role="dialog"] button').filter({ hasText: /^Suivant/ }).first();
        if (await next.isVisible({ timeout: 2000 }).catch(() => false)) { await next.click(); await page.waitForTimeout(500); }
      }
      const dateInput = page.locator('input[type="date"]').first();
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill('2030-09-15');
        await page.waitForTimeout(200);
        const submitBtn = page.getByRole('button', { name: /créer l'événement/i }).first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(1500);
          await shot(page, 'communicant-success-popup');
          const hasConvoc = await page.locator('[data-demo="convocation-popup-btn"]').isVisible({ timeout: 1500 }).catch(() => false);
          if (!hasConvoc) pass('Communicant — pas de bouton Convoquer (correct ✓)');
          else warn('Communicant popup', 'bouton Convoquer visible alors qu\'il ne devrait pas');
          const hasAffiche = await page.getByText("Créer l'affiche").isVisible({ timeout: 1500 }).catch(() => false);
          if (hasAffiche) pass('Communicant — bouton "Créer l\'affiche" visible (correct ✓)');
          else warn('Communicant popup', '"Créer l\'affiche" absent');
        }
      }
    }
  }
  await ctx.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// E. Light mode
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n☀️  E. Light mode');
{
  const { ctx, page } = await mobilePage(browser, 'light');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await launchDemoAndSelect(page, 'Coach');
  await shot(page, 'light-coach-home');

  // Ouvrir formulaire en light mode
  const fab = page.locator('[data-demo="fab-add"]');
  await fab.click({ force: true });
  await page.waitForTimeout(500);
  const fabEvent = page.locator('[data-demo="fab-event"]');
  if (await fabEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fabEvent.click({ force: true });
    await page.waitForTimeout(700);
    await shot(page, 'light-form-step1');
    const next = page.locator('[role="dialog"] button').filter({ hasText: /^Suivant/ }).first();
    if (await next.isVisible({ timeout: 2000 }).catch(() => false)) {
      await next.click();
      await page.waitForTimeout(600);
      await shot(page, 'light-form-step2');
      pass('Light mode — formulaire rendu');
    }
  }
  await ctx.close();
}

await browser.close();

// ─────────────────────────────────────────────────────────────────────────────
const ok = results.filter(r => r.s === 'ok').length;
const ko = results.filter(r => r.s === 'warn').length;
console.log('\n══════════════════════════════════════════');
console.log('  RÉSULTAT AUDIT VISUEL');
console.log('══════════════════════════════════════════');
for (const r of results) {
  const icon = r.s === 'ok' ? '✅' : '⚠️ ';
  console.log(`  ${icon} ${r.n}${r.note ? '  (' + r.note + ')' : ''}`);
}
console.log(`\n  Score : ${ok}/${ok + ko} — ${ko === 0 ? '🎉 Tout est parfait' : `${ko} point${ko > 1 ? 's' : ''} à vérifier manuellement`}`);
console.log(`  Screenshots → ${OUT}/\n`);
