import { describe, it, expect } from 'vitest';
import { computeEarned, BADGE_DEFS, BADGE_ORDER } from '../../hooks/useBadges.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvent(id, sport = 'Football', clubId = 'club-1') {
  return { id: String(id), sport, clubId };
}

// ── Tests — computeEarned ─────────────────────────────────────────────────────

describe('computeEarned — aucune participation', () => {
  it('retourne [] quand attending est vide', () => {
    expect(computeEarned(new Set(), [])).toEqual([]);
  });

  it('retourne [] quand attending est null', () => {
    expect(computeEarned(null, [])).toEqual([]);
  });

  it('retourne [] quand attending est undefined', () => {
    expect(computeEarned(undefined, [])).toEqual([]);
  });
});

describe('computeEarned — badge "first_step" (1 participation)', () => {
  it('débloque first_step à 1 participation', () => {
    const events = [makeEvent('1')];
    const earned = computeEarned(new Set(['1']), events);
    expect(earned).toContain('first_step');
  });

  it('first_step absent avant 1 participation', () => {
    const earned = computeEarned(new Set(), [makeEvent('1')]);
    expect(earned).not.toContain('first_step');
  });
});

describe('computeEarned — badge "explorer" (3 sports différents)', () => {
  it('débloque explorer avec 3 sports différents', () => {
    const events = [
      makeEvent('1', 'Football'),
      makeEvent('2', 'Rugby'),
      makeEvent('3', 'Basket'),
    ];
    const earned = computeEarned(new Set(['1', '2', '3']), events);
    expect(earned).toContain('explorer');
  });

  it("n'octroie pas explorer avec 2 sports", () => {
    const events = [makeEvent('1', 'Football'), makeEvent('2', 'Rugby')];
    const earned = computeEarned(new Set(['1', '2']), events);
    expect(earned).not.toContain('explorer');
  });

  it('ignore les sports null ou undefined', () => {
    const events = [
      makeEvent('1', undefined),
      makeEvent('2', null),
      makeEvent('3', 'Football'),
    ];
    const earned = computeEarned(new Set(['1', '2', '3']), events);
    expect(earned).not.toContain('explorer');
  });
});

describe('computeEarned — badge "loyal_fan" (5× même club)', () => {
  it('débloque loyal_fan avec 5 participations au même club', () => {
    const events = Array.from({ length: 5 }, (_, i) => makeEvent(String(i), 'Football', 'club-1'));
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    expect(earned).toContain('loyal_fan');
  });

  it("n'octroie pas loyal_fan avec 4 participations dans le même club", () => {
    const events = Array.from({ length: 4 }, (_, i) => makeEvent(String(i), 'Football', 'club-1'));
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    expect(earned).not.toContain('loyal_fan');
  });

  it("n'octroie pas loyal_fan si 5 clubs différents (1 visite chacun)", () => {
    const events = Array.from({ length: 5 }, (_, i) => makeEvent(String(i), 'Football', `club-${i}`));
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    expect(earned).not.toContain('loyal_fan');
  });

  it("ignore les événements sans clubId", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({ id: String(i), sport: 'Football', clubId: null }));
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    expect(earned).not.toContain('loyal_fan');
  });
});

describe('computeEarned — badge "veteran" (10 participations)', () => {
  it('débloque veteran à 10 participations', () => {
    const events = Array.from({ length: 10 }, (_, i) => makeEvent(String(i)));
    const ids = new Set(events.map(e => e.id));
    expect(computeEarned(ids, events)).toContain('veteran');
  });

  it("n'octroie pas veteran à 9", () => {
    const events = Array.from({ length: 9 }, (_, i) => makeEvent(String(i)));
    const ids = new Set(events.map(e => e.id));
    expect(computeEarned(ids, events)).not.toContain('veteran');
  });
});

describe('computeEarned — badge "champion" (25 participations)', () => {
  it('débloque champion à 25 participations', () => {
    const events = Array.from({ length: 25 }, (_, i) => makeEvent(String(i)));
    const ids = new Set(events.map(e => e.id));
    expect(computeEarned(ids, events)).toContain('champion');
  });

  it("n'octroie pas champion à 24", () => {
    const events = Array.from({ length: 24 }, (_, i) => makeEvent(String(i)));
    const ids = new Set(events.map(e => e.id));
    expect(computeEarned(ids, events)).not.toContain('champion');
  });
});

describe('computeEarned — cumul de badges', () => {
  it('débloque tous les badges avec 25 participations dans 3 sports et 5× le même club', () => {
    const events = [
      ...Array.from({ length: 5 }, (_, i) => makeEvent(String(i), 'Football', 'club-1')),
      ...Array.from({ length: 5 }, (_, i) => makeEvent(String(i + 5), 'Rugby', 'club-2')),
      ...Array.from({ length: 15 }, (_, i) => makeEvent(String(i + 10), 'Basket', 'club-3')),
    ];
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    expect(earned).toContain('first_step');
    expect(earned).toContain('explorer');
    expect(earned).toContain('loyal_fan');
    expect(earned).toContain('veteran');
    expect(earned).toContain('champion');
  });

  it('retourne les badges dans le bon ordre', () => {
    const events = Array.from({ length: 25 }, (_, i) => makeEvent(String(i)));
    const ids = new Set(events.map(e => e.id));
    const earned = computeEarned(ids, events);
    const ordered = BADGE_ORDER.filter(b => earned.includes(b));
    expect(earned).toEqual(ordered);
  });
});

describe('computeEarned — coerce IDs en string', () => {
  it('fonctionne quand attending contient des nombres (IDs Supabase)', () => {
    const events = [{ id: '42', sport: 'Football', clubId: 'club-1' }];
    // attending contient 42 (number) mais event.id est '42' (string)
    const earned = computeEarned(new Set([42]), events);
    expect(earned).toContain('first_step');
  });
});

describe('BADGE_DEFS — structure', () => {
  it('chaque badge a les champs requis', () => {
    for (const def of Object.values(BADGE_DEFS)) {
      expect(def).toHaveProperty('id');
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('icon');
      expect(def).toHaveProperty('color');
    }
  });

  it('BADGE_ORDER contient exactement 5 badges', () => {
    expect(BADGE_ORDER).toHaveLength(5);
  });

  it('BADGE_ORDER correspond aux clés de BADGE_DEFS', () => {
    BADGE_ORDER.forEach(id => expect(BADGE_DEFS).toHaveProperty(id));
  });
});
