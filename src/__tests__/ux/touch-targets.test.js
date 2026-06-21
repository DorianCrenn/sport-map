/**
 * Régression UX — Cibles tactiles (WCAG 2.5.5)
 *
 * Principe : tout élément interactif doit être tappable sans erreur sur mobile.
 * On scanne statiquement les fichiers JSX pour détecter les <button> et
 * <motion.button> dont le style inline déclare une largeur ou hauteur
 * inférieure au seuil minimal.
 *
 * Seuil : 36 px — en dessous, le tap rate d'erreur sur mobile devient élevé.
 * Les boutons fixés à 36×36 sont au strict minimum acceptable en contexte de
 * liste dense ; les boutons principaux / fermeture doivent atteindre 44 px.
 */

/* global process */
import { readFileSync } from 'fs';
import { resolve, relative } from 'path';
import { describe, it, expect } from 'vitest';

// ── Configuration ──────────────────────────────────────────────────────────────

// process.cwd() = racine du projet (là où vitest.config.js est lancé)
const SRC_DIR   = resolve(process.cwd(), 'src');
const MIN_PX    = 36;   // seuil général : < 36 px = violation
const MIN_PX_44 = 44;   // seuil strict pour les boutons primaires

/**
 * Fichiers à scanner pour les cibles tactiles.
 *
 * On exclut volontairement :
 * - PosterStudio.tsx et components/poster/* → outil de design (contrôles denses
 *   intentionnellement petits : pipettes, sélecteurs de couleur, swatches…)
 * - AdminPage.tsx → interface back-office, pas exposée aux utilisateurs mobiles
 * - components/club/ClubBrandKitEditor.jsx, blocks/* → outils d'édition admin
 * - components/club/ClubDashboard.jsx → tableau de bord admin
 */
const SCAN_FILES = [
  // Pages principales
  'pages/FavorisPage.tsx',
  'pages/ClubsPage.tsx',
  'pages/ActualitesPage.tsx',
  'pages/ProfilPage.tsx',
  'pages/MapPage.tsx',
  'pages/HomePage.tsx',
  // Composants mobiles critiques
  'components/Header.tsx',
  'components/BottomNav.tsx',
  'components/MobileEventSheet.tsx',
  'components/EventCard.tsx',
  'components/PosterShareBtn.tsx',
  'components/AnnouncementsCenter.tsx',
  // Modales
  'components/FollowModal.tsx',
  'components/ConfirmDialog.tsx',
  'components/EventFormModal.tsx',
  'components/BadgeUnlockModal.tsx',
  'components/club/ClubFormModal.tsx',
  'components/club/SendAnnouncementModal.tsx',
  // Covoiturage
  'components/rides/RideCard.tsx',
];

/**
 * Boutons primaires critiques : fermeture de modal, CTA principaux.
 * Ces boutons doivent atteindre 44 px car ils sont la seule façon de
 * quitter un écran ou de déclencher l'action principale.
 *
 * Format : { file: chemin relatif depuis src/, tagLine: string partielle }
 * tagLine est une sous-chaîne unique qui identifie la ligne du bouton.
 */
const PRIMARY_BUTTONS_44 = [
  // PosterStudio — fermeture
  { file: 'components/PosterStudio.tsx',       hint: 'onClick={onClose}' },
  // FollowModal — fermeture
  { file: 'components/FollowModal.tsx',        hint: 'aria-label="Fermer"' },
  // EventFormModal — fermeture
  { file: 'components/EventFormModal.tsx',     hint: 'aria-label="Fermer"' },
  // MobileEventSheet — fermeture
  { file: 'components/MobileEventSheet.tsx',  hint: 'aria-label="Fermer"' },
  // FavorisPage — navigation mois (prev/next) dans l'onglet CalendarTab
  { file: 'pages/favoris/CalendarTab.tsx',     hint: 'onClick={prevMonth}' },
  { file: 'pages/favoris/CalendarTab.tsx',     hint: 'onClick={nextMonth}' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extrait le contenu d'un objet style React (entre {{ et }}) à partir de
 * `objStart` (position juste après le second `{` de `style={{`).
 * Gère correctement les chaînes de caractères (', ", `) et les template
 * literals avec expressions ${...}.
 */
function extractStyleObject(src, objStart) {
  let i = objStart;
  let depth = 0;
  let inStr = false;
  let strCh = '';

  while (i < src.length) {
    const c = src[i];

    if (inStr) {
      if (strCh === '`') {
        if (c === '\\') { i += 2; continue; }
        if (c === '`') { inStr = false; }
        else if (c === '$' && src[i + 1] === '{') {
          // Ignorer l'expression ${...} dans le template literal
          let td = 0;
          i += 2;
          while (i < src.length) {
            if (src[i] === '{') td++;
            else if (src[i] === '}') { if (td === 0) break; td--; }
            i++;
          }
        }
      } else {
        if (c === '\\') { i += 2; continue; }
        if (c === strCh) inStr = false;
      }
    } else {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; }
      else if (c === '{') depth++;
      else if (c === '}') {
        if (depth === 0) return src.slice(objStart, i);
        depth--;
      }
    }
    i++;
  }
  return null;
}

/**
 * Détecte si `style={{` est présent dans les attributs du tag courant
 * (avant le premier `>` non protégé), et retourne le contenu de l'objet
 * style si trouvé.
 * `tagEnd` est la position juste après le nom du tag (ex: après `<button`).
 */
function getButtonStyleObject(src, tagEnd) {
  const SCAN = 1200;
  const slice = src.slice(tagEnd, tagEnd + SCAN);

  // Chercher `style={{` avant tout `>` non protégé
  const styleRe = /\bstyle=\s*\{\{/;
  const styleIdx = slice.search(styleRe);
  if (styleIdx === -1) return null;

  // Vérifier qu'il n'y a pas de `>` (à depth 0) avant style
  let depth = 0;
  for (let i = 0; i < styleIdx; i++) {
    const c = slice[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return null; // style sur un enfant
  }

  // Trouver la position du `{{` (après `style=`)
  const matchArr = slice.slice(styleIdx).match(/\bstyle=\s*\{\{/);
  const objStart = tagEnd + styleIdx + matchArr[0].length;

  return extractStyleObject(src, objStart);
}

/** Parse une valeur entière de propriété CSS inline : ex. `width: 36` → 36. */
function parseIntProp(styleObj, prop) {
  const re = new RegExp(`\\b${prop}:\\s*(\\d+)\\b`);
  const m = styleObj.match(re);
  return m ? +m[1] : null;
}

/**
 * Scanne un fichier JSX et retourne les violations de cibles tactiles :
 * boutons avec `width` ou `height` < minSize définis en inline style.
 */
function scanFile(filepath, minSize) {
  const src = readFileSync(filepath, 'utf8');
  const relPath = relative(SRC_DIR, filepath);
  const violations = [];

  const tagRe = /<(button|motion\.button)\b/g;
  let m;
  while ((m = tagRe.exec(src)) !== null) {
    const styleObj = getButtonStyleObject(src, m.index + m[0].length);
    if (!styleObj) continue;

    const w = parseIntProp(styleObj, 'width');
    const h = parseIntProp(styleObj, 'height');
    const line = src.slice(0, m.index).split('\n').length;

    if (w !== null && w < minSize) {
      violations.push({ file: relPath, line, dim: 'width', val: w, min: minSize });
    }
    if (h !== null && h < minSize) {
      violations.push({ file: relPath, line, dim: 'height', val: h, min: minSize });
    }
  }

  return violations;
}

function formatViolations(vs) {
  return vs.map(v =>
    `  ${v.file}:${v.line} → ${v.dim}: ${v.val}px (minimum ${v.min}px)`
  ).join('\n');
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('UX — Touch targets (WCAG 2.5.5)', () => {

  it(`aucun <button> ou <motion.button> avec width/height < ${MIN_PX}px dans les inline styles`, () => {
    const violations = SCAN_FILES.flatMap(rel => scanFile(resolve(SRC_DIR, rel), MIN_PX));

    expect(
      violations,
      `${violations.length} bouton(s) trop petit(s) :\n${formatViolations(violations)}`
    ).toHaveLength(0);
  });

  it('les boutons primaires (fermeture modale, CTA principal) atteignent 44 px', () => {
    const violations = [];

    for (const { file, hint } of PRIMARY_BUTTONS_44) {
      const fullPath = resolve(SRC_DIR, file);
      const src = readFileSync(fullPath, 'utf8');

      // Trouver l'occurrence du bouton identifiée par hint
      const hintIdx = src.indexOf(hint);
      if (hintIdx === -1) {
        violations.push({ file, msg: `Indice introuvable : "${hint}"` });
        continue;
      }

      // Chercher le <button le plus proche AVANT ce hint (dans les 800 chars précédents)
      const before = src.slice(Math.max(0, hintIdx - 800), hintIdx);
      const lastTagIdx = Math.max(before.lastIndexOf('<button'), before.lastIndexOf('<motion.button'));
      if (lastTagIdx === -1) {
        violations.push({ file, msg: `Pas de <button> avant "${hint}"` });
        continue;
      }

      const tagStartInFile = Math.max(0, hintIdx - 800) + lastTagIdx;
      const tagMatch = src.slice(tagStartInFile).match(/^<(button|motion\.button)\b/);
      if (!tagMatch) continue;

      const styleObj = getButtonStyleObject(src, tagStartInFile + tagMatch[0].length);
      if (!styleObj) continue;

      const w = parseIntProp(styleObj, 'width');
      const h = parseIntProp(styleObj, 'height');

      if (w !== null && w < MIN_PX_44) {
        violations.push({ file, hint, msg: `width: ${w}px < ${MIN_PX_44}px` });
      }
      if (h !== null && h < MIN_PX_44) {
        violations.push({ file, hint, msg: `height: ${h}px < ${MIN_PX_44}px` });
      }
    }

    const msg = violations.map(v =>
      `  ${v.file} [${v.hint ?? ''}] : ${v.msg}`
    ).join('\n');

    expect(
      violations,
      `${violations.length} bouton(s) primaire(s) trop petit(s) :\n${msg}`
    ).toHaveLength(0);
  });

});
