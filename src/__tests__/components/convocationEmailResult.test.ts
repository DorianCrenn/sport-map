import { describe, it, expect } from 'vitest';
import { convocationEmailResult } from '../../components/event/convocationEmailResult.js';

describe('convocationEmailResult', () => {
  it('succès total → severity success', () => {
    const r = convocationEmailResult({ sent: 5, total: 5 });
    expect(r.severity).toBe('success');
    expect(r.message).toContain('5 emails envoyés');
  });

  it('un seul email → singulier', () => {
    expect(convocationEmailResult({ sent: 1, total: 1 }).message).toBe('1 email envoyé avec succès !');
  });

  it('échec total → severity error (JAMAIS un faux succès)', () => {
    const r = convocationEmailResult({ sent: 0, total: 5 });
    expect(r.severity).toBe('error');
    expect(r.message).toMatch(/Aucun email envoyé/);
  });

  it('envoi partiel → severity warning avec compte exact', () => {
    const r = convocationEmailResult({ sent: 3, total: 5 });
    expect(r.severity).toBe('warning');
    expect(r.message).toBe('3/5 emails envoyés — 2 en échec.');
  });

  it('aucun destinataire (total 0) → severity neutral', () => {
    expect(convocationEmailResult({ sent: 0, total: 0 }).severity).toBe('neutral');
  });
});
