/**
 * Tests useCommunes — chargement des communes par département depuis geo.api.gouv.fr
 *
 * NOTE : useCommunes utilise un cache module-level (TTL 1h).
 * Les tests utilisent des codes de département DIFFÉRENTS par groupe pour éviter
 * que le cache d'un test pollue un autre.
 *   'finistere'       → '29'  (groupe A : success single)
 *   'cotes-armor'     → '22'  (groupe B : success multi + sort)
 *   'ille-et-vilaine' → '35'  (groupe B : success multi)
 *   'morbihan'        → '56'  (groupe C : errors)
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { useCommunes } from '../../hooks/useCommunes.js';

// ── Setup global fetch mock ───────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ── Groupe A — sans département ───────────────────────────────────────────────

describe('useCommunes — sans département', () => {
  it('communes est vide si departmentIds est vide', () => {
    const { result } = renderHook(() => useCommunes([]));
    expect(result.current.communes).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('communes est vide si departmentIds contient des slugs inconnus', () => {
    const { result } = renderHook(() => useCommunes(['dept-inconnu']));
    expect(result.current.communes).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

// ── Groupe A — chargement réussi (finistere = code 29) ───────────────────────

describe('useCommunes — chargement réussi (Finistère)', () => {
  it('charge les communes du Finistère', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ nom: 'Brest' }, { nom: 'Quimper' }, { nom: 'Morlaix' }],
    });

    const { result } = renderHook(() => useCommunes(['finistere']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.communes).toContain('Brest');
    expect(result.current.communes).toContain('Quimper');
    expect(result.current.communes).toContain('Morlaix');
    expect(result.current.error).toBeNull();
  });
});

// ── Groupe B — fusion (cotes-armor + ille-et-vilaine) ───────────────────────

describe("useCommunes — fusion et tri (Côtes-d'Armor + Ille-et-Vilaine)", () => {
  it('fusionne et déduplique les communes de plusieurs départements', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ nom: 'Saint-Brieuc' }, { nom: 'Lannion' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ nom: 'Rennes' }, { nom: 'Fougères' }] });

    const { result } = renderHook(() => useCommunes(['cotes-armor', 'ille-et-vilaine']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.communes).toContain('Saint-Brieuc');
    expect(result.current.communes).toContain('Rennes');
    expect(result.current.communes).toHaveLength(4);
  });

  it('les communes sont triées alphabétiquement', async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ nom: 'Rennes' }, { nom: 'Fougères' }] })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useCommunes(['ille-et-vilaine', 'cotes-armor']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sorted = [...result.current.communes];
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b, 'fr')));
  });
});

// ── Groupe C — gestion d'erreur (morbihan = code 56) ─────────────────────────

describe('useCommunes — erreur réseau (Morbihan)', () => {
  it('retourne error (string) si fetch est rejeté', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCommunes(['morbihan']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.error).toBe('string');
    expect(result.current.error.toLowerCase()).toContain('network error');
    expect(result.current.communes).toEqual([]);
  });

  it('loading passe à false même si HTTP retourne une erreur', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useCommunes(['morbihan']));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loading).toBe(false);
  });
});

// ── Groupe D — état loading ───────────────────────────────────────────────────

describe('useCommunes — loading state', () => {
  it('loading passe à false après résolution du fetch', async () => {
    let resolvePromise;
    globalThis.fetch = vi.fn().mockReturnValue(
      new Promise(res => { resolvePromise = res; })
    );

    const { result } = renderHook(() => useCommunes(['finistere']));

    if (resolvePromise) {
      resolvePromise({ ok: true, json: async () => [] });
    }
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
