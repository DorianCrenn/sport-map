import { vi } from 'vitest';

/**
 * Crée un query-builder Supabase chaînable et configurable.
 * Usage dans les tests :
 *   mockFrom.mockReturnValue(makeQuery({ data: [...], error: null }));
 */
export function makeQuery(resolved = { data: null, error: null }) {
  const q = {
    select:      vi.fn().mockReturnThis(),
    insert:      vi.fn().mockReturnThis(),
    update:      vi.fn().mockReturnThis(),
    delete:      vi.fn().mockReturnThis(),
    upsert:      vi.fn().mockReturnThis(),
    eq:          vi.fn().mockReturnThis(),
    neq:         vi.fn().mockReturnThis(),
    in:          vi.fn().mockReturnThis(),
    order:       vi.fn().mockReturnThis(),
    limit:       vi.fn().mockReturnThis(),
    single:      vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    // Permet d'écrire : await supabase.from('x').select().order()
    then: (fn, rej) => Promise.resolve(resolved).then(fn, rej),
  };
  return q;
}

/** Mock du channel Realtime (ne fait rien, ne lève pas d'erreur). */
export function makeChannel() {
  const ch = {
    on:        vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };
  return ch;
}

/**
 * Instance mock de supabase — à réimporter avec vi.mock dans chaque fichier.
 * Les tests peuvent reconfigurer `mockFrom` avant chaque it().
 */
export const mockFrom          = vi.fn(() => makeQuery());
export const mockChannel       = vi.fn(() => makeChannel());
export const mockRemoveChannel = vi.fn().mockResolvedValue(undefined);

export const supabase = {
  from:          mockFrom,
  channel:       mockChannel,
  removeChannel: mockRemoveChannel,
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getSession:             vi.fn().mockResolvedValue({ data: { session: null } }),
    signInWithPassword:     vi.fn().mockResolvedValue({ data: null, error: null }),
    signUp:                 vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut:                vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail:  vi.fn().mockResolvedValue({ error: null }),
    signInWithOAuth:        vi.fn().mockResolvedValue({ data: { url: 'https://mock-oauth.com' }, error: null }),
  },
};
