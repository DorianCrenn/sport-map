import { describe, it, expect } from 'vitest';
import { sanitizeText, sanitizeRich, sanitizeFilename } from '../../lib/sanitize.js';

// ── sanitizeText ──────────────────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('retourne une chaîne vide si l\'input n\'est pas une string', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(42)).toBe('');
    expect(sanitizeText({})).toBe('');
  });

  it('retourne le texte brut inchangé si pas de HTML', () => {
    expect(sanitizeText('Bonjour le monde')).toBe('Bonjour le monde');
  });

  it('supprime toutes les balises HTML', () => {
    expect(sanitizeText('<b>Gras</b>')).toBe('Gras');
    expect(sanitizeText('<script>alert(1)</script>')).toBe('');
    expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
    expect(sanitizeText('<p>Para</p>')).toBe('Para');
  });

  it('neutralise les tentatives XSS classiques', () => {
    expect(sanitizeText('<script>document.cookie</script>')).toBe('');
    expect(sanitizeText('"><img src=x onerror=alert(1)>')).toBe('"&gt;');
    expect(sanitizeText('javascript:alert(1)')).toBe('javascript:alert(1)'); // texte brut — ok
  });

  it('trim les espaces en début/fin', () => {
    expect(sanitizeText('  FC Brest  ')).toBe('FC Brest');
  });

  it('préserve les caractères accentués', () => {
    expect(sanitizeText('Événement à Brest')).toBe('Événement à Brest');
  });
});

// ── sanitizeRich ──────────────────────────────────────────────────────────────

describe('sanitizeRich', () => {
  it('autorise b, i, em, strong, br, p', () => {
    const input = '<b>Gras</b> et <i>italic</i> et <br> et <p>para</p>';
    const result = sanitizeRich(input);
    expect(result).toContain('<b>');
    expect(result).toContain('<i>');
    expect(result).toContain('<br>');
    expect(result).toContain('<p>');
  });

  it('supprime les balises script et handlers', () => {
    expect(sanitizeRich('<script>alert(1)</script>')).toBe('');
    expect(sanitizeRich('<b onclick="alert(1)">clic</b>')).toBe('<b>clic</b>');
  });

  it('retourne une chaîne vide si l\'input n\'est pas une string', () => {
    expect(sanitizeRich(null)).toBe('');
    expect(sanitizeRich(42)).toBe('');
  });
});

// ── sanitizeFilename ──────────────────────────────────────────────────────────

describe('sanitizeFilename', () => {
  it('retourne "export" si input vide', () => {
    expect(sanitizeFilename('')).toBe('export');
    expect(sanitizeFilename('   ')).toBe('export');
    expect(sanitizeFilename(null)).toBe('export');
    expect(sanitizeFilename(undefined)).toBe('export');
  });

  it('convertit en minuscules et remplace les espaces par des tirets', () => {
    expect(sanitizeFilename('FC Brest 2026')).toBe('fc-brest-2026');
  });

  it('supprime les caractères dangereux (path traversal)', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('../secret')).toBe('secret');
    expect(sanitizeFilename('file<>name')).toBe('filename');
  });

  it('supprime les accents', () => {
    expect(sanitizeFilename('événement-été')).toBe('evenement-ete');
  });

  it('respecte la limite maxLen', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeFilename(long, { maxLen: 60 })).toHaveLength(60);
  });

  it('conserve les tirets et underscores', () => {
    expect(sanitizeFilename('affiche_match-2026')).toBe('affiche_match-2026');
  });

  it('supprime les guillemets, slashes, backslashes', () => {
    expect(sanitizeFilename('"evil"/path\\file')).toBe('evilpathfile');
  });
});
