import { describe, it, expect } from 'vitest';
import { inferCategory, generateRecurring, toFormValues } from '../../lib/eventFormHelpers.js';

// ── inferCategory ─────────────────────────────────────────────────────────────

describe('inferCategory', () => {
  it('reconnaît "U18 A" → "U18"', () => {
    expect(inferCategory('U18 A')).toBe('U18');
  });

  it('reconnaît "u18 b" (minuscules) → "U18"', () => {
    expect(inferCategory('u18 b')).toBe('U18');
  });

  it('reconnaît "Seniors 1" → "Senior"', () => {
    expect(inferCategory('Seniors 1')).toBe('Senior');
  });

  it('reconnaît "Féminines A" → "Féminine"', () => {
    expect(inferCategory('Féminines A')).toBe('Féminine');
  });

  it('reconnaît "Vétérans" → "Vétéran"', () => {
    expect(inferCategory('Vétérans')).toBe('Vétéran');
  });

  it('reconnaît "Espoirs" → "Espoir"', () => {
    expect(inferCategory('Espoirs')).toBe('Espoir');
  });

  it('reconnaît "Élite" → "Élite"', () => {
    expect(inferCategory('Élite')).toBe('Élite');
  });

  it('retourne "" si aucun pattern ne correspond', () => {
    expect(inferCategory('Équipe fanion')).toBe('');
  });

  it('retourne "" si teamName est null', () => {
    expect(inferCategory(null)).toBe('');
  });

  it('retourne "" si teamName est undefined', () => {
    expect(inferCategory(undefined)).toBe('');
  });

  it('retourne "" pour une chaîne vide', () => {
    expect(inferCategory('')).toBe('');
  });
});

// ── generateRecurring ─────────────────────────────────────────────────────────

describe('generateRecurring', () => {
  const base = {
    title: 'Match',
    sport: 'Football',
    date: '2026-01-05T15:00:00+01:00', // lundi
  };

  it('génère des événements hebdomadaires (intervalle 7 jours)', () => {
    const events = generateRecurring(base, 'weekly', '2026-01-26');
    expect(events).toHaveLength(4); // 5, 12, 19, 26 jan
    // Vérifie que les dates sont espacées de 7 jours
    const d0 = new Date(events[0].date);
    const d1 = new Date(events[1].date);
    expect(d1 - d0).toBe(7 * 24 * 3600_000);
  });

  it('génère des événements bihebdomadaires (intervalle 14 jours)', () => {
    const events = generateRecurring(base, 'biweekly', '2026-02-02');
    expect(events).toHaveLength(3); // 5, 19 jan, 2 fev
    const d0 = new Date(events[0].date);
    const d1 = new Date(events[1].date);
    expect(d1 - d0).toBe(14 * 24 * 3600_000);
  });

  it('ne dépasse pas 52 occurrences', () => {
    const events = generateRecurring(base, 'weekly', '2030-01-01');
    expect(events.length).toBeLessThanOrEqual(52);
  });

  it('tous les événements partagent le même seriesId', () => {
    const events = generateRecurring(base, 'weekly', '2026-01-26');
    const ids = new Set(events.map(e => e.seriesId));
    expect(ids.size).toBe(1);
    expect(events[0].seriesId).toMatch(/^series_/);
  });

  it('s\'arrête avant ou au jour de la date until', () => {
    const events = generateRecurring(base, 'weekly', '2026-01-19');
    const last = new Date(events.at(-1).date);
    const until = new Date('2026-01-19T23:59:59');
    expect(last.getTime()).toBeLessThanOrEqual(until.getTime());
  });

  it('propage les champs de base dans chaque occurrence', () => {
    const events = generateRecurring(base, 'weekly', '2026-01-12');
    events.forEach(e => {
      expect(e.title).toBe('Match');
      expect(e.sport).toBe('Football');
    });
  });
});

// ── toFormValues ──────────────────────────────────────────────────────────────

describe('toFormValues — nouveau événement', () => {
  it('retourne un formulaire vide avec les defaults si event=null', () => {
    const form = toFormValues(null);
    expect(form).toBeDefined();
    expect(form.date).toBe('');
  });

  it('propage sport depuis defaults', () => {
    const form = toFormValues(null, { sport: 'Handball' });
    expect(form.sport).toBe('Handball');
  });

  it('propage teamName depuis defaults', () => {
    const form = toFormValues(null, { teamName: 'Seniors A' });
    expect(form.teamName).toBe('Seniors A');
  });
});

describe('toFormValues — duplication (_isDuplicate)', () => {
  const existingEvent = {
    _isNew: true,
    _isDuplicate: true,
    title: 'Match aller',
    sport: 'Football',
    date: '2026-03-15T14:00:00+01:00',
    city: 'Brest',
    venue: 'Stade Francis-Le Blé',
    teamName: 'Seniors A',
    adversaire: 'Quimper FC',
  };

  it('copie le titre, sport, venue depuis l\'événement source', () => {
    const form = toFormValues(existingEvent);
    expect(form.title).toBe('Match aller');
    expect(form.sport).toBe('Football');
    expect(form.venue).toBe('Stade Francis-Le Blé');
  });

  it('remet la date à vide pour le duplicate', () => {
    const form = toFormValues(existingEvent);
    expect(form.date).toBe('');
  });

  it('copie l\'adversaire', () => {
    const form = toFormValues(existingEvent);
    expect(form.adversaire).toBe('Quimper FC');
  });
});
