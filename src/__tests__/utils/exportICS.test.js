/* global global */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadICS, downloadClubICS } from '../../utils/exportICS.js';

// ── Mock Blob en tant que classe (new Blob() requis) ──────────────────────────

function captureICSContent() {
  let captured = '';
  const OriginalBlob = global.Blob;

  class MockBlob {
    constructor(parts) { captured = parts[0]; }
  }
  global.Blob = MockBlob;

  // URL.createObjectURL/revokeObjectURL ne fonctionnent pas avec MockBlob dans jsdom
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

  const link = { href: '', download: '', click: vi.fn() };
  vi.spyOn(document, 'createElement').mockReturnValue(link);

  return {
    getContent: () => captured,
    link,
    restore: () => { global.Blob = OriginalBlob; },
  };
}

const baseEvent = {
  id: 'evt-1',
  title: 'Match de foot',
  date: '2026-06-15T14:30:00',
  city: 'Brest',
  venue: 'Stade Francis-Le Blé',
  description: 'Derby breton',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exportICS — downloadICS', () => {
  let ctx;
  beforeEach(() => {
    vi.restoreAllMocks();
    ctx = captureICSContent();
  });

  it('génère un fichier VCALENDAR valide', () => {
    downloadICS(baseEvent);
    const c = ctx.getContent();
    expect(c).toContain('BEGIN:VCALENDAR');
    expect(c).toContain('END:VCALENDAR');
    expect(c).toContain('BEGIN:VEVENT');
    expect(c).toContain('END:VEVENT');
    expect(c).toContain('VERSION:2.0');
    expect(c).toContain('CALSCALE:GREGORIAN');
  });

  it('contient le SUMMARY avec le titre', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('SUMMARY:Match de foot');
  });

  it('contient le UID unique', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('UID:evt-1@sportlink.fr');
  });

  it('contient LOCATION avec venue + city', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('LOCATION:Stade Francis-Le Blé\\, Brest');
  });

  it('contient LOCATION avec city seule quand pas de venue', () => {
    downloadICS({ ...baseEvent, venue: undefined });
    expect(ctx.getContent()).toContain('LOCATION:Brest');
  });

  it('omet LOCATION si ni venue ni city', () => {
    downloadICS({ ...baseEvent, venue: undefined, city: undefined });
    expect(ctx.getContent()).not.toContain('LOCATION:');
  });

  it('contient DESCRIPTION', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('DESCRIPTION:Derby breton');
  });

  it('omet DESCRIPTION si absente', () => {
    downloadICS({ ...baseEvent, description: undefined });
    expect(ctx.getContent()).not.toContain('DESCRIPTION:');
  });

  it('DTSTART correspond à la date de l\'événement', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('DTSTART:20260615T143000');
  });

  it('DTEND est 90 minutes après DTSTART', () => {
    downloadICS(baseEvent);
    expect(ctx.getContent()).toContain('DTEND:20260615T160000');
  });

  it('nomme le fichier avec le titre sanitisé', () => {
    downloadICS(baseEvent);
    expect(ctx.link.download).toBe('Match_de_foot.ics');
  });

  it('échappe les virgules dans le titre', () => {
    downloadICS({ ...baseEvent, title: 'Foot, Brest' });
    expect(ctx.getContent()).toContain('SUMMARY:Foot\\, Brest');
  });

  it('échappe les points-virgules', () => {
    downloadICS({ ...baseEvent, description: 'Infos; détails' });
    expect(ctx.getContent()).toContain('DESCRIPTION:Infos\\; détails');
  });

  it('échappe les sauts de ligne dans description', () => {
    downloadICS({ ...baseEvent, description: 'Ligne1\nLigne2' });
    expect(ctx.getContent()).toContain('DESCRIPTION:Ligne1\\nLigne2');
  });
});

describe('exportICS — downloadClubICS', () => {
  let ctx;
  beforeEach(() => {
    vi.restoreAllMocks();
    ctx = captureICSContent();
  });

  const events = [
    { ...baseEvent, id: 'evt-1', title: 'Match 1', date: '2026-06-10T10:00:00' },
    { ...baseEvent, id: 'evt-2', title: 'Match 2', date: '2026-06-17T14:00:00' },
  ];

  it('contient autant de VEVENT que d\'événements', () => {
    downloadClubICS(events, 'Stade Brestois');
    const count = (ctx.getContent().match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(2);
  });

  it('contient le PRODID avec le nom du club', () => {
    downloadClubICS(events, 'Stade Brestois');
    expect(ctx.getContent()).toContain('PRODID:-//SportLink//Stade Brestois//FR');
  });

  it('nomme le fichier avec le club sanitisé', () => {
    downloadClubICS(events, 'Stade Brestois');
    expect(ctx.link.download).toBe('Stade_Brestois_calendrier.ics');
  });

  it('génère un calendrier vide si aucun événement', () => {
    downloadClubICS([], 'Club Test');
    const c = ctx.getContent();
    expect(c).toContain('BEGIN:VCALENDAR');
    expect(c).not.toContain('BEGIN:VEVENT');
  });
});
