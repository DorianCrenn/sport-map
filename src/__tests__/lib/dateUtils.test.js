import { describe, it, expect } from 'vitest';
import { timeAgo, formatDate, formatTime, formatLongDate, groupByDate } from '../../lib/dateUtils.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retourne une date ISO décalée de `ms` millisecondes dans le passé. */
function ago(ms) {
  return new Date(Date.now() - ms).toISOString();
}

/** Construit une date ISO à partir d'aujourd'hui + delta jours, à minuit. */
function daysFromNow(delta) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return d.toISOString();
}

// ── timeAgo ───────────────────────────────────────────────────────────────────

describe('timeAgo', () => {
  it("retourne 'à l'instant' pour moins d'1 minute", () => {
    expect(timeAgo(ago(30_000))).toBe("à l'instant");
  });

  it('retourne "il y a X min" pour 5 minutes', () => {
    expect(timeAgo(ago(5 * 60_000))).toBe('il y a 5 min');
  });

  it('retourne "il y a 59 min" juste avant 1h', () => {
    expect(timeAgo(ago(59 * 60_000))).toBe('il y a 59 min');
  });

  it('retourne "il y a 1 h" pour 1 heure', () => {
    expect(timeAgo(ago(60 * 60_000))).toBe('il y a 1 h');
  });

  it('retourne "il y a 3 h" pour 3 heures', () => {
    expect(timeAgo(ago(3 * 3600_000))).toBe('il y a 3 h');
  });

  it('retourne "il y a 1 j" pour 1 jour', () => {
    expect(timeAgo(ago(24 * 3600_000))).toBe('il y a 1 j');
  });

  it('retourne "il y a 6 j" juste avant 7 jours', () => {
    expect(timeAgo(ago(6 * 24 * 3600_000))).toBe('il y a 6 j');
  });

  it('retourne une date courte après 7 jours (pas "il y a X j")', () => {
    const result = timeAgo(ago(8 * 24 * 3600_000));
    expect(result).not.toMatch(/il y a/);
    // doit être une date type "12 juin"
    expect(result).toMatch(/\d{1,2}/);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formate une date YYYY-MM-DD en jour + mois court', () => {
    const result = formatDate('2026-06-12');
    expect(result).toContain('12');
    expect(result.toLowerCase()).toContain('juin');
  });

  it('ajoute l\'année si showYear=true', () => {
    const result = formatDate('2026-06-12', true);
    expect(result).toContain('2026');
  });

  it('n\'ajoute pas l\'année si showYear=false (défaut)', () => {
    const result = formatDate('2026-06-12');
    expect(result).not.toContain('2026');
  });

  it('gère une date ISO complète sans décalage TZ', () => {
    // Avec T00:00 explicite, la date doit rester au 12
    const result = formatDate('2026-06-12T00:00:00.000Z');
    expect(result).toContain('12');
  });
});

// ── formatTime ────────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('extrait l\'heure et les minutes d\'un ISO', () => {
    // On génère un ISO avec une heure fixe pour éviter les TZ
    const d = new Date(2026, 5, 12, 14, 30, 0); // juin 12, 14:30
    const result = formatTime(d.toISOString());
    expect(result).toMatch(/14:30/);
  });
});

// ── formatLongDate ────────────────────────────────────────────────────────────

describe('formatLongDate', () => {
  it('retourne le jour de la semaine + jour + mois', () => {
    // 12 juin 2026 est un vendredi
    const result = formatLongDate('2026-06-12');
    expect(result.toLowerCase()).toContain('juin');
    expect(result).toContain('12');
    // Le jour de la semaine doit être présent (vendredi)
    expect(result.toLowerCase()).toMatch(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/);
  });
});

// ── groupByDate ───────────────────────────────────────────────────────────────

describe('groupByDate', () => {
  it('retourne 5 groupes vides si aucun événement', () => {
    const g = groupByDate([]);
    expect(g.today).toHaveLength(0);
    expect(g.tomorrow).toHaveLength(0);
    expect(g.thisWeek).toHaveLength(0);
    expect(g.later).toHaveLength(0);
    expect(g.past).toHaveLength(0);
  });

  it('classe un événement qui commence maintenant dans today', () => {
    const ev = { id: 1, date: new Date().toISOString() };
    const g = groupByDate([ev]);
    expect(g.today).toHaveLength(1);
  });

  it('classe un événement passé dans past', () => {
    const ev = { id: 2, date: daysFromNow(-1) };
    const g = groupByDate([ev]);
    expect(g.past).toHaveLength(1);
    expect(g.today).toHaveLength(0);
  });

  it('classe un événement demain dans tomorrow', () => {
    const ev = { id: 3, date: daysFromNow(1) };
    const g = groupByDate([ev]);
    expect(g.tomorrow).toHaveLength(1);
  });

  it('classe un événement dans 3 jours dans thisWeek', () => {
    const ev = { id: 4, date: daysFromNow(3) };
    const g = groupByDate([ev]);
    expect(g.thisWeek).toHaveLength(1);
  });

  it('classe un événement dans 10 jours dans later', () => {
    const ev = { id: 5, date: daysFromNow(10) };
    const g = groupByDate([ev]);
    expect(g.later).toHaveLength(1);
  });

  it('gère plusieurs événements dans des groupes différents', () => {
    const events = [
      { id: 1, date: daysFromNow(-2) }, // past
      { id: 2, date: new Date().toISOString() }, // today
      { id: 3, date: daysFromNow(1) }, // tomorrow
    ];
    const g = groupByDate(events);
    expect(g.past).toHaveLength(1);
    expect(g.today).toHaveLength(1);
    expect(g.tomorrow).toHaveLength(1);
  });
});
