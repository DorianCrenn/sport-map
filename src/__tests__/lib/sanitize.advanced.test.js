/**
 * Tests avancés sanitize.js — vecteurs XSS non-standards et cas limites
 */
import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeRich, sanitizeFilename } from '../../lib/sanitize.js';

describe('sanitizeText — vecteurs XSS avancés', () => {
  it('neutralise l\'injection SVG (vecteur via image)', () => {
    const payload = '<svg onload="alert(1)"><image href="x"/></svg>';
    const result = sanitizeText(payload);
    expect(result).not.toContain('<svg');
    expect(result).not.toContain('onload');
  });

  it('neutralise le DOM clobbering', () => {
    const payload = '<form id="foo"><input name="nodeName"/></form>';
    expect(sanitizeText(payload)).not.toContain('<form');
  });

  it('neutralise les entités HTML encodées malicieusement', () => {
    const payload = '&lt;script&gt;alert(1)&lt;/script&gt;';
    // DOMPurify laisse les entités HTML encodées (elles ne sont pas des balises)
    const result = sanitizeText(payload);
    expect(result).not.toContain('<script>');
  });

  it('gère une très longue chaîne sans exploser la mémoire', () => {
    const long = 'A'.repeat(100_000);
    expect(() => sanitizeText(long)).not.toThrow();
    expect(sanitizeText(long)).toHaveLength(100_000);
  });

  it('retourne une chaîne vide pour un tableau', () => {
    expect(sanitizeText([])).toBe('');
  });

  it('retourne une chaîne vide pour un booléen', () => {
    expect(sanitizeText(true)).toBe('');
    expect(sanitizeText(false)).toBe('');
  });

  it('neutralise mhtml: protocol', () => {
    const payload = '<a href="mhtml:file://C:/evil">click</a>';
    const result = sanitizeText(payload);
    expect(result).not.toContain('mhtml:');
  });

  it('préserve les emojis et caractères unicode', () => {
    const payload = '🎉 Victoire! Résultat: 3-0 🏆';
    expect(sanitizeText(payload)).toBe(payload);
  });

  it('neutralise le nesting de balises malicieuses (retire les balises, texte inoffensif reste)', () => {
    // DOMPurify extrait et retire la balise <script> imbriquée. Le texte "alert" reste
    // mais est inoffensif car ce n'est plus du code exécutable — il n'y a plus de balise.
    const payload = '<sc<script>ript>alert(1)</sc</script>ript>';
    const result = sanitizeText(payload);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('onerror');
    // "alert" comme texte brut est inoffensif — acceptable
  });
});

describe('sanitizeRich — vecteurs XSS sur HTML permis', () => {
  it('retire href javascript: des liens', () => {
    const payload = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeRich(payload);
    expect(result).not.toContain('javascript:');
  });

  it('retire les data: URIs des liens', () => {
    const payload = '<a href="data:text/html,<script>alert(1)</script>">x</a>';
    const result = sanitizeRich(payload);
    expect(result).not.toContain('data:text/html');
  });

  it('retire les event handlers de toutes les balises permises', () => {
    const permis = ['<b onmouseover="alert(1)">x</b>', '<i onclick="x()">y</i>', '<p onfocus="z()">z</p>'];
    for (const p of permis) {
      const r = sanitizeRich(p);
      expect(r).not.toMatch(/on[a-z]+=/i);
    }
  });

  it('conserve le texte brut à l\'intérieur des balises permises', () => {
    expect(sanitizeRich('<b>Texte <em>important</em></b>')).toContain('Texte');
  });
});

describe('sanitizeFilename — cas limites', () => {
  it('retourne "export" si uniquement des caractères spéciaux', () => {
    expect(sanitizeFilename('!@#$%^&*()')).toBe('export');
  });

  it('gère les noms avec plusieurs espaces consécutifs', () => {
    expect(sanitizeFilename('club   brest')).toBe('club-brest');
  });

  it('limite à 60 chars par défaut', () => {
    const r = sanitizeFilename('a'.repeat(100));
    expect(r.length).toBeLessThanOrEqual(60);
  });

  it('accepte une limite custom', () => {
    const r = sanitizeFilename('mon-super-affiche', { maxLen: 5 });
    expect(r.length).toBeLessThanOrEqual(5);
  });

  it('ne commence pas par un tiret (trailing space en entrée)', () => {
    const r = sanitizeFilename('  FC Brest');
    expect(r).not.toMatch(/^-/);
  });

  it('gère un nom avec uniquement des chiffres', () => {
    expect(sanitizeFilename('2026')).toBe('2026');
  });

  it('gère null et undefined sans crash', () => {
    expect(sanitizeFilename(null)).toBe('export');
    expect(sanitizeFilename(undefined)).toBe('export');
  });
});
