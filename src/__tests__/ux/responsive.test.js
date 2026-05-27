/**
 * Régression Responsive Design
 *
 * Tests statiques pour détecter les régressions de mise en page responsive.
 *
 * Approche :
 * jsdom n'exécute pas les media queries CSS — on analyse le code source JSX/HTML
 * pour garantir que les structures responsives clés sont en place.
 *
 * Couverture :
 * 1. Viewport meta — correctement configuré (device-width, safe-area)
 * 2. Layout MapPage — séparation mobile (md:hidden) / desktop (hidden md:contents)
 * 3. Navigation BottomNav — présente dans App.jsx
 * 4. Largeurs fixes cassant mobile — pas de width > 375px sur les racines de pages
 */

import { readFileSync } from 'fs';
import { resolve, relative } from 'path';
import { describe, it, expect } from 'vitest';

// ── Configuration ──────────────────────────────────────────────────────────────

const SRC_DIR  = resolve(process.cwd(), 'src');
const ROOT_DIR = resolve(process.cwd());

function readSrc(rel) {
  return readFileSync(resolve(SRC_DIR, rel), 'utf8');
}

// ── 1. Viewport meta ───────────────────────────────────────────────────────────

describe('Responsive — Viewport meta (index.html)', () => {

  it('contient width=device-width', () => {
    const html = readFileSync(resolve(ROOT_DIR, 'index.html'), 'utf8');
    expect(html).toMatch(/name="viewport"/);
    expect(html).toMatch(/width=device-width/);
  });

  it('contient initial-scale=1', () => {
    const html = readFileSync(resolve(ROOT_DIR, 'index.html'), 'utf8');
    expect(html).toMatch(/initial-scale=1/);
  });

  it('contient viewport-fit=cover (iPhone notch + safe-area)', () => {
    const html = readFileSync(resolve(ROOT_DIR, 'index.html'), 'utf8');
    expect(html).toMatch(/viewport-fit=cover/);
  });

});

// ── 2. Layout mobile / desktop ─────────────────────────────────────────────────

describe('Responsive — Séparation mobile / desktop (MapPage)', () => {

  it('la sidebar desktop est masquée sur mobile : "hidden md:contents"', () => {
    const src = readSrc('pages/MapPage.jsx');
    expect(src).toContain('hidden md:contents');
  });

  it('les éléments flottants mobiles sont masqués sur desktop : "md:hidden"', () => {
    const src = readSrc('pages/MapPage.jsx');
    expect(src).toContain('md:hidden');
  });

  it('les deux classes sont dans la même page (cohérence layout)', () => {
    const src = readSrc('pages/MapPage.jsx');
    expect(src).toContain('hidden md:contents');
    expect(src).toContain('md:hidden');
  });

});

// ── 3. Navigation mobile ───────────────────────────────────────────────────────

describe('Responsive — Navigation mobile (App.jsx)', () => {

  it('BottomNav est monté dans App.jsx', () => {
    const src = readFileSync(resolve(SRC_DIR, 'App.jsx'), 'utf8');
    expect(src).toMatch(/<BottomNav\b/);
  });

  it('BottomNav reçoit activeTab et onTabChange', () => {
    const src = readFileSync(resolve(SRC_DIR, 'App.jsx'), 'utf8');
    const idx = src.indexOf('<BottomNav');
    expect(idx).toBeGreaterThan(-1);
    const snippet = src.slice(idx, idx + 300);
    expect(snippet).toContain('activeTab');
    expect(snippet).toContain('onTabChange');
  });

});

// ── 4. Largeurs fixes cassant mobile ──────────────────────────────────────────

describe('Responsive — Pas de largeur fixe cassant mobile dans les pages', () => {

  /**
   * Sur iPhone SE (375 px), un conteneur avec `width: '400px'` ou plus (en style
   * inline React, format string) sans maxWidth crée un dépassement horizontal
   * (overflow) qui casse la mise en page.
   *
   * On scanne les pages principales pour détecter ces cas. On exclut les
   * valeurs numériques (ex: `width: 400` sans quotes) car React les interprète
   * comme des pixels mais elles apparaissent généralement sur des éléments
   * positionnés en absolu (tooltips, popovers) où c'est intentionnel.
   */

  const PAGE_FILES = [
    'pages/HomePage.jsx',
    'pages/FavorisPage.jsx',
    'pages/NewsPage.jsx',
    'pages/ClubsPage.jsx',
    'pages/ProfilPage.jsx',
  ];

  const MOBILE_WIDTH = 375;
  const NEARBY_CHARS = 250;

  it(`aucune page principale n'a width: 'Npx' > ${MOBILE_WIDTH}px sans maxWidth`, () => {
    const violations = [];
    const re = /\bwidth:\s*['"](\d+)px['"]/g;

    for (const rel of PAGE_FILES) {
      const src = readSrc(rel);
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(src)) !== null) {
        const val = +m[1];
        if (val > MOBILE_WIDTH) {
          const nearby = src.slice(Math.max(0, m.index - NEARBY_CHARS), m.index + NEARBY_CHARS);
          if (!nearby.includes('maxWidth') && !nearby.includes('position:') && !nearby.includes("position: '")) {
            const line = src.slice(0, m.index).split('\n').length;
            violations.push(`  ${rel}:${line} → width: '${val}px' (> ${MOBILE_WIDTH}px, pas de maxWidth)`);
          }
        }
      }
    }

    expect(
      violations,
      `${violations.length} conteneur(s) trop large(s) pour mobile :\n${violations.join('\n')}`
    ).toHaveLength(0);
  });

});

// ── 5. Cohérence des breakpoints Tailwind ─────────────────────────────────────

describe('Responsive — Cohérence Tailwind (pas de mélange inline + classes media)', () => {

  /**
   * Un anti-pattern courant : utiliser `display: 'none'` en inline style pour
   * masquer un élément, puis tenter de le ré-afficher via Tailwind (md:block).
   * Tailwind ne peut pas surpasser un inline style car les inline styles ont
   * une spécificité plus élevée que les classes CSS.
   *
   * On vérifie que les éléments mobiles/desktop dans MapPage utilisent
   * exclusivement Tailwind pour le responsive, sans inline display:none.
   */

  it('les conteneurs responsive de MapPage n’utilisent pas display:none en inline style', () => {
    const src = readSrc('pages/MapPage.jsx');

    // Trouver les lignes avec hidden md:contents ou md:hidden
    const lines = src.split('\n');
    const responsiveLines = lines.filter(l =>
      l.includes('hidden md:contents') || (l.includes('md:hidden') && l.includes('className'))
    );

    expect(responsiveLines.length).toBeGreaterThan(0);

    for (const line of responsiveLines) {
      // display:none dans un style inline sur la même ligne serait un conflit
      expect(line).not.toMatch(/style=\{[^}]*display\s*:\s*['"]?none/);
    }
  });

});
