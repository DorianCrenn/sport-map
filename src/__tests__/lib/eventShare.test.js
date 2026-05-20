import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateEventDescription,
  openWhatsAppShare,
  openFacebookShare,
  openInstagramShare,
} from '../../lib/eventShare.js';

// ── generateEventDescription ──────────────────────────────────────────────────

const matchEvent = {
  title:     'US Brest vs FC Landivisiau',
  sport:     'Football',
  eventType: 'championship',
  level:     'D1',
  date:      '2026-06-21T15:00:00',
  city:      'Brest',
  venue:     'Stade Francis-Le Blé',
  score:     null,
};

describe('generateEventDescription', () => {
  it('retourne une chaîne vide pour un événement null', () => {
    expect(generateEventDescription(null)).toBe('');
  });

  it('contient le titre de l\'événement', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toContain('US Brest vs FC Landivisiau');
  });

  it('contient le label du type championship', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toContain('Championnat');
  });

  it('contient le label du type cup', () => {
    const desc = generateEventDescription({ ...matchEvent, eventType: 'cup', level: undefined });
    expect(desc).toContain('Coupe');
  });

  it('contient le label du type friendly', () => {
    const desc = generateEventDescription({ ...matchEvent, eventType: 'friendly', level: undefined });
    expect(desc).toContain('amical');
  });

  it('inclut le level dans la ligne compétition', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toContain('D1');
  });

  it('inclut la date formatée', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toMatch(/juin/i);
    expect(desc).toContain('15:00');
  });

  it('inclut le lieu (venue)', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toContain('Stade Francis-Le Blé');
  });

  it('utilise city si venue absent', () => {
    const desc = generateEventDescription({ ...matchEvent, venue: undefined });
    expect(desc).toContain('Brest');
  });

  it('inclut le score si présent', () => {
    const desc = generateEventDescription({ ...matchEvent, score: '2-1' });
    expect(desc).toContain('2-1');
  });

  it('n\'inclut pas de ligne Score si score null', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).not.toContain('Score');
  });

  it('inclut la signature SportLink', () => {
    const desc = generateEventDescription(matchEvent);
    expect(desc).toContain('SportLink');
  });

  it('n\'inclut pas l\'URL si includeUrl = false (défaut)', () => {
    const desc = generateEventDescription(matchEvent, { url: 'https://sportlink.fr/event/123' });
    expect(desc).not.toContain('https://');
  });

  it('inclut l\'URL si includeUrl = true', () => {
    const url = 'https://sportlink.fr/event/123';
    const desc = generateEventDescription(matchEvent, { includeUrl: true, url });
    expect(desc).toContain(url);
  });

  it('inclut le sport sur les matchs amicaux', () => {
    const desc = generateEventDescription({ ...matchEvent, eventType: 'friendly', level: undefined });
    expect(desc).toContain('Football');
  });

  it('fonctionne sans venue ni city', () => {
    const desc = generateEventDescription({ ...matchEvent, venue: undefined, city: undefined });
    expect(desc).not.toContain('📍');
  });
});

// ── openWhatsAppShare ─────────────────────────────────────────────────────────

describe('openWhatsAppShare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre une URL wa.me avec le texte encodé', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openWhatsAppShare('Bonjour match !');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('wa.me'),
      '_blank',
      expect.any(String)
    );
    expect(spy.mock.calls[0][0]).toContain(encodeURIComponent('Bonjour match !'));
  });

  it('encode correctement les caractères spéciaux', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openWhatsAppShare('⚽ Match : Brest vs Landivisiau');
    expect(spy.mock.calls[0][0]).toContain('%E2%9A%BD'); // ⚽ encodé
  });
});

// ── openFacebookShare ─────────────────────────────────────────────────────────

describe('openFacebookShare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre une URL facebook.com/sharer avec l\'URL encodée', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openFacebookShare('https://sportlink.fr/club/123');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      expect.any(String)
    );
    expect(spy.mock.calls[0][0]).toContain(
      encodeURIComponent('https://sportlink.fr/club/123')
    );
  });

  it('ouvre dans un nouvel onglet avec noopener', () => {
    const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openFacebookShare('https://sportlink.fr');
    expect(spy.mock.calls[0][1]).toBe('_blank');
    expect(spy.mock.calls[0][2]).toContain('noopener');
  });
});

// ── openInstagramShare ────────────────────────────────────────────────────────

describe('openInstagramShare', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appelle navigator.share si disponible', () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });

    openInstagramShare('Match ce soir !', 'https://sportlink.fr/evt/1');

    expect(mockShare).toHaveBeenCalledWith({
      text: 'Match ce soir !\nhttps://sportlink.fr/evt/1',
    });
  });

  it('ne joint pas l\'URL si vide', () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });

    openInstagramShare('Texte seul');

    expect(mockShare).toHaveBeenCalledWith({ text: 'Texte seul' });
  });

  it('copie dans le presse-papier si navigator.share absent', () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    const writeSpy = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: writeSpy }, writable: true, configurable: true });

    openInstagramShare('Texte à copier', 'https://url.fr');

    expect(writeSpy).toHaveBeenCalledWith('Texte à copier\nhttps://url.fr');
  });

  it('ne plante pas si share rejette (annulation utilisateur)', () => {
    const mockShare = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    Object.defineProperty(navigator, 'share', { value: mockShare, writable: true, configurable: true });

    expect(() => openInstagramShare('Texte')).not.toThrow();
  });
});
