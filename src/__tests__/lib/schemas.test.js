import { describe, it, expect } from 'vitest';
import { eventFormSchema, announcementSchema, clubSchema, validate } from '../../lib/schemas.js';

// ── helper ────────────────────────────────────────────────────────────────────

const validEvent = () => ({
  date:  '2026-06-15T15:00:00.000Z',
  sport: 'Football',
});

const validAnnouncement = () => ({
  type:    'info',
  message: 'Rappel : entraînement ce soir.',
});

const validClub = () => ({
  name:  'FC Brest',
  sport: 'Football',
  city:  'Brest',
  email: 'contact@fcbrest.fr',
});

// ── eventFormSchema ───────────────────────────────────────────────────────────

describe('eventFormSchema', () => {
  it('valide un événement minimal valide', () => {
    const r = eventFormSchema.safeParse(validEvent());
    expect(r.success).toBe(true);
  });

  it('échoue si date absente', () => {
    const r = eventFormSchema.safeParse({ sport: 'Football' });
    expect(r.success).toBe(false);
    const fields = r.error.issues.map(i => i.path[0]);
    expect(fields).toContain('date');
  });

  it('échoue si sport absent', () => {
    const r = eventFormSchema.safeParse({ date: '2026-06-15T15:00:00.000Z', sport: '' });
    expect(r.success).toBe(false);
  });

  it('accepte une description optionnelle longue (≤2000)', () => {
    const r = eventFormSchema.safeParse({ ...validEvent(), description: 'x'.repeat(2000) });
    expect(r.success).toBe(true);
  });

  it('rejette une description trop longue (>2000)', () => {
    const r = eventFormSchema.safeParse({ ...validEvent(), description: 'x'.repeat(2001) });
    expect(r.success).toBe(false);
  });

  it('accepte city, venue, teamName optionnels vides', () => {
    const r = eventFormSchema.safeParse({ ...validEvent(), city: '', venue: '', teamName: '' });
    expect(r.success).toBe(true);
  });
});

// ── announcementSchema ────────────────────────────────────────────────────────

describe('announcementSchema', () => {
  it('valide une annonce valide', () => {
    const r = announcementSchema.safeParse(validAnnouncement());
    expect(r.success).toBe(true);
  });

  it('échoue si message vide', () => {
    const r = announcementSchema.safeParse({ type: 'info', message: '' });
    expect(r.success).toBe(false);
  });

  it('échoue si message d\'un seul caractère', () => {
    const r = announcementSchema.safeParse({ type: 'info', message: 'x' });
    expect(r.success).toBe(false);
  });

  it('échoue si message > 280 caractères', () => {
    const r = announcementSchema.safeParse({ type: 'info', message: 'x'.repeat(281) });
    expect(r.success).toBe(false);
  });

  it('accepte exactement 280 caractères', () => {
    const r = announcementSchema.safeParse({ type: 'info', message: 'x'.repeat(280) });
    expect(r.success).toBe(true);
  });

  it('échoue si type invalide', () => {
    const r = announcementSchema.safeParse({ type: 'hack', message: 'test valide' });
    expect(r.success).toBe(false);
  });

  it('accepte tous les types valides', () => {
    for (const type of ['urgent', 'info', 'result', 'event']) {
      const r = announcementSchema.safeParse({ type, message: 'msg ok' });
      expect(r.success).toBe(true);
    }
  });
});

// ── clubSchema ────────────────────────────────────────────────────────────────

describe('clubSchema', () => {
  it('valide un club valide', () => {
    const r = clubSchema.safeParse(validClub());
    expect(r.success).toBe(true);
  });

  it('échoue si nom trop court (< 2 caractères)', () => {
    const r = clubSchema.safeParse({ ...validClub(), name: 'A' });
    expect(r.success).toBe(false);
  });

  it('échoue si nom trop long (> 100)', () => {
    const r = clubSchema.safeParse({ ...validClub(), name: 'A'.repeat(101) });
    expect(r.success).toBe(false);
  });

  it('échoue si email invalide', () => {
    const r = clubSchema.safeParse({ ...validClub(), email: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('échoue si sport absent', () => {
    const r = clubSchema.safeParse({ ...validClub(), sport: '' });
    expect(r.success).toBe(false);
  });

  it('échoue si ville absente', () => {
    const r = clubSchema.safeParse({ ...validClub(), city: '' });
    expect(r.success).toBe(false);
  });

  it('accepte website et phone optionnels', () => {
    const r = clubSchema.safeParse({ ...validClub(), website: 'https://fcbrest.fr', phone: '0298000000' });
    expect(r.success).toBe(true);
  });
});

// ── validate() helper ─────────────────────────────────────────────────────────

describe('validate()', () => {
  it('retourne ok:true + data sur données valides', () => {
    const result = validate(announcementSchema, validAnnouncement());
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject(validAnnouncement());
  });

  it('retourne ok:false + errors sur données invalides', () => {
    const result = validate(announcementSchema, { type: 'info', message: '' });
    expect(result.ok).toBe(false);
    expect(result.errors).toBeDefined();
    expect(typeof result.errors.message).toBe('string');
  });

  it('errors contient le premier message d\'erreur par champ', () => {
    const result = validate(clubSchema, { name: '', sport: '', city: '', email: 'bad' });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });
});
