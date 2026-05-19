import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredEvents } from '../../hooks/useFilteredEvents.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const inTwoDays = new Date(today); inTwoDays.setDate(today.getDate() + 2);

// Prochain samedi
function nextSaturday() {
  const d = new Date();
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(10, 0, 0, 0);
  return d;
}

function iso(date) { return date.toISOString(); }

const EVENTS = [
  { id: '1', sport: 'Football', city: 'Brest', date: iso(today),    lat: 48.39, lng: -4.49 },
  { id: '2', sport: 'Rugby',    city: 'Quimper', date: iso(tomorrow), lat: 47.99, lng: -4.10 },
  { id: '3', sport: 'Football', city: 'Brest', date: iso(inTwoDays), lat: 48.39, lng: -4.49 },
  { id: '4', sport: 'Basket',   city: 'Morlaix', date: iso(nextSaturday()), lat: 48.58, lng: -3.83 },
];

// ── Helper ────────────────────────────────────────────────────────────────────

function filter(events, opts = {}) {
  const defaults = { sport: null, dateRange: null, departmentId: null, nearbyCoords: null, sportScope: null, cityFilter: null };
  const { result } = renderHook(() => useFilteredEvents(events, { ...defaults, ...opts }));
  return result.current;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFilteredEvents — sans filtre', () => {
  it('retourne tous les événements triés par date', () => {
    const result = filter(EVENTS);
    expect(result).toHaveLength(4);
    expect(result[0].id).toBe('1'); // today
    expect(result[1].id).toBe('2'); // tomorrow
    expect(result[2].id).toBe('3'); // in 2 days
  });

  it('retourne un tableau vide si aucun événement', () => {
    expect(filter([])).toHaveLength(0);
  });
});

describe('useFilteredEvents — filtre par sport', () => {
  it('filtre par sport exact', () => {
    const result = filter(EVENTS, { sport: 'Football' });
    expect(result).toHaveLength(2);
    result.forEach(e => expect(e.sport).toBe('Football'));
  });

  it('retourne rien si sport inexistant', () => {
    expect(filter(EVENTS, { sport: 'Tennis' })).toHaveLength(0);
  });

  it('filtre par sportScope (tableau de sports)', () => {
    const result = filter(EVENTS, { sportScope: ['Football', 'Rugby'] });
    expect(result).toHaveLength(3);
    result.forEach(e => expect(['Football', 'Rugby']).toContain(e.sport));
  });

  it('sport exact a priorité sur sportScope', () => {
    const result = filter(EVENTS, { sport: 'Rugby', sportScope: ['Football'] });
    expect(result).toHaveLength(1);
    expect(result[0].sport).toBe('Rugby');
  });

  it('sportScope vide ne filtre pas', () => {
    expect(filter(EVENTS, { sportScope: [] })).toHaveLength(4);
  });
});

describe('useFilteredEvents — filtre par ville', () => {
  it('filtre insensible à la casse', () => {
    const result = filter(EVENTS, { cityFilter: 'brest' });
    expect(result).toHaveLength(2);
    result.forEach(e => expect(e.city).toBe('Brest'));
  });

  it('filtre partiel (contains)', () => {
    const result = filter(EVENTS, { cityFilter: 'uim' });
    expect(result).toHaveLength(1);
    expect(result[0].city).toBe('Quimper');
  });

  it('retourne rien si ville inconnue', () => {
    expect(filter(EVENTS, { cityFilter: 'Paris' })).toHaveLength(0);
  });
});

describe('useFilteredEvents — filtre par date', () => {
  it('"today" retourne les événements du jour', () => {
    const result = filter(EVENTS, { dateRange: 'today' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('"weekend" retourne le samedi prochain', () => {
    const result = filter(EVENTS, { dateRange: 'weekend' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('"week" retourne les 7 prochains jours', () => {
    const result = filter(EVENTS, { dateRange: 'week' });
    // today + tomorrow + inTwoDays sont dans la semaine
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('date précise (YYYY-MM-DD) filtre le bon jour', () => {
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const result = filter(EVENTS, { dateRange: dateStr });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('date sans match retourne tableau vide', () => {
    expect(filter(EVENTS, { dateRange: '2000-01-01' })).toHaveLength(0);
  });
});

describe('useFilteredEvents — filtre par proximité (haversine)', () => {
  // Centre de Brest : 48.39, -4.49
  // Quimper (47.99, -4.10) est à ~55 km → hors du rayon 20km
  // Brest (48.39, -4.49) est à 0 km → dans le rayon

  it('inclut les événements dans le rayon de 20 km', () => {
    const result = filter(EVENTS, { nearbyCoords: { lat: 48.39, lng: -4.49 } });
    result.forEach(e => expect(e.city).toBe('Brest'));
  });

  it('exclut les événements au-delà de 20 km', () => {
    const result = filter(EVENTS, { nearbyCoords: { lat: 48.39, lng: -4.49 } });
    expect(result.some(e => e.city === 'Quimper')).toBe(false);
    expect(result.some(e => e.city === 'Morlaix')).toBe(false);
  });
});

describe('useFilteredEvents — filtres combinés', () => {
  it('sport + ville combinés', () => {
    const result = filter(EVENTS, { sport: 'Football', cityFilter: 'Brest' });
    expect(result).toHaveLength(2);
  });

  it('sport + date combinés', () => {
    const result = filter(EVENTS, { sport: 'Football', dateRange: 'today' });
    expect(result).toHaveLength(1);
    expect(result[0].sport).toBe('Football');
  });

  it('filtre strict → 0 résultat', () => {
    const result = filter(EVENTS, { sport: 'Tennis', cityFilter: 'Brest' });
    expect(result).toHaveLength(0);
  });
});

describe('useFilteredEvents — tri final', () => {
  it('résultats toujours triés par date croissante', () => {
    const result = filter(EVENTS);
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i].date).getTime())
        .toBeGreaterThanOrEqual(new Date(result[i - 1].date).getTime());
    }
  });
});
