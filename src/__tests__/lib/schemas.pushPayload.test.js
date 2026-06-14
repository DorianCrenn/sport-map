/**
 * Tests pushPayloadSchema — validation des payloads push notification
 */
import { describe, it, expect } from 'vitest';
import { pushPayloadSchema, validate } from '../../lib/schemas.js';

const validPayload = () => ({
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  title:   'Nouveau match',
  body:    'FC Brest joue ce soir',
  url:     '/',
  tag:     'match-event',
});

describe('pushPayloadSchema', () => {
  it('valide un payload complet valide', () => {
    expect(pushPayloadSchema.safeParse(validPayload()).success).toBe(true);
  });

  it('valide sans body, url, tag (optionnels)', () => {
    const { user_id, title } = validPayload();
    expect(pushPayloadSchema.safeParse({ user_id, title }).success).toBe(true);
  });

  it('échoue si user_id n\'est pas un UUID', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), user_id: 'not-a-uuid' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toContain('user_id');
  });

  it('échoue si title est vide', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), title: '' });
    expect(r.success).toBe(false);
  });

  it('échoue si title dépasse 120 caractères', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), title: 'x'.repeat(121) });
    expect(r.success).toBe(false);
  });

  it('accepte title de 120 caractères exactement', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), title: 'x'.repeat(120) });
    expect(r.success).toBe(true);
  });

  it('échoue si body dépasse 300 caractères', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), body: 'x'.repeat(301) });
    expect(r.success).toBe(false);
  });

  it('accepte "/" comme url valide', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), url: '/' });
    expect(r.success).toBe(true);
  });

  it('accepte une URL HTTPS valide', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), url: 'https://sportlink.app/events/123' });
    expect(r.success).toBe(true);
  });

  it('échoue si tag dépasse 60 caractères', () => {
    const r = pushPayloadSchema.safeParse({ ...validPayload(), tag: 'a'.repeat(61) });
    expect(r.success).toBe(false);
  });
});

describe('validate() avec pushPayloadSchema', () => {
  it('retourne ok:true sur un payload valide', () => {
    const { ok, data } = validate(pushPayloadSchema, validPayload());
    expect(ok).toBe(true);
    expect(data.user_id).toBe(validPayload().user_id);
  });

  it('retourne ok:false + errors.user_id sur UUID invalide', () => {
    const { ok, errors } = validate(pushPayloadSchema, { ...validPayload(), user_id: 'bad' });
    expect(ok).toBe(false);
    expect(errors.user_id).toBeTruthy();
  });
});
