import { describe, it, expect } from 'vitest';
import { isEventPast } from '../../lib/eventTime.js';

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe('isEventPast', () => {
  it('jour passé → true', () => {
    expect(isEventPast({ date: iso(-1) })).toBe(true);
    expect(isEventPast({ date: iso(-30) })).toBe(true);
  });

  it("aujourd'hui → false (l'action reste possible le jour même)", () => {
    expect(isEventPast({ date: iso(0) })).toBe(false);
  });

  it('jour futur → false', () => {
    expect(isEventPast({ date: iso(3) })).toBe(false);
  });

  it('statut final/annulé → true même si date future (score saisi)', () => {
    expect(isEventPast({ date: iso(2), status: 'final' })).toBe(true);
    expect(isEventPast({ date: iso(2), status: 'cancelled' })).toBe(true);
    expect(isEventPast({ date: iso(0), status: 'FINAL' })).toBe(true);
  });

  it('statut en cours / à venir → false si date non passée', () => {
    expect(isEventPast({ date: iso(1), status: 'in_progress' })).toBe(false);
    expect(isEventPast({ date: iso(1), status: 'upcoming' })).toBe(false);
  });

  it('couvre tout le set des statuts terminés (dont français + trim)', () => {
    for (const s of ['finished', 'done', 'post_done', 'canceled', 'terminé', 'termine']) {
      expect(isEventPast({ date: iso(5), status: s })).toBe(true);
    }
    // insensible à la casse + espaces superflus
    expect(isEventPast({ date: iso(5), status: '  Terminé ' })).toBe(true);
  });

  it('lit matchStatus / match_status en repli', () => {
    expect(isEventPast({ date: iso(1), matchStatus: 'final' })).toBe(true);
    expect(isEventPast({ date: iso(1), match_status: 'done' })).toBe(true);
  });

  it('date ISO complète passée → true', () => {
    expect(isEventPast({ date: `${iso(-1)}T15:00:00` })).toBe(true);
  });

  it('sans date ni statut → false (pas de blocage abusif)', () => {
    expect(isEventPast({})).toBe(false);
    expect(isEventPast(null)).toBe(false);
    expect(isEventPast(undefined)).toBe(false);
    expect(isEventPast({ date: 'invalide' })).toBe(false);
  });
});
