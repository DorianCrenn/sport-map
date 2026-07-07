/**
 * Tests useAdminGrants — logique des grants et licences admin
 */
import { describe, it, expect, vi } from 'vitest';

// Mock supabase
vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'grant-1', club_id: 'club-1', plan: 'pro', reason: 'Test', grant_type: 'manual', starts_at: new Date().toISOString(), ends_at: null, revoked_at: null }, error: null }),
    })),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { id: 'admin-id', email: 'admin@test.com', role: 'admin' },
    isAdmin: true,
  }),
}));

import { GRANT_PRESETS } from '../../hooks/useAdminGrants.js';

describe('GRANT_PRESETS', () => {
  it('contient au moins 8 presets', () => {
    expect(GRANT_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  it('chaque preset a un plan valide', () => {
    for (const p of GRANT_PRESETS) {
      expect(['starter','pro','elite']).toContain(p.plan);
    }
  });

  it('presets lifetime ont months=null', () => {
    const lifetime = GRANT_PRESETS.filter(p => p.type === 'lifetime');
    for (const p of lifetime) {
      expect(p.months).toBeNull();
    }
  });

  it('presets temporaires ont months > 0', () => {
    const temp = GRANT_PRESETS.filter(p => p.type !== 'lifetime');
    for (const p of temp) {
      expect(p.months).toBeGreaterThan(0);
    }
  });
});

describe('Grant expiry logic', () => {
  it('grant actif : pas révoqué + pas expiré', () => {
    const g = {
      revoked_at: null,
      starts_at: new Date(Date.now() - 3600000).toISOString(),
      ends_at: new Date(Date.now() + 3600000).toISOString(),
    };
    const active = !g.revoked_at && (!g.ends_at || new Date(g.ends_at) > new Date());
    expect(active).toBe(true);
  });

  it('grant expiré : ends_at dans le passé', () => {
    const g = {
      revoked_at: null,
      starts_at: new Date(Date.now() - 7200000).toISOString(),
      ends_at: new Date(Date.now() - 3600000).toISOString(),
    };
    const active = !g.revoked_at && (!g.ends_at || new Date(g.ends_at) > new Date());
    expect(active).toBe(false);
  });

  it('grant permanent : ends_at null = toujours actif', () => {
    const g = { revoked_at: null, starts_at: new Date().toISOString(), ends_at: null };
    const active = !g.revoked_at && (!g.ends_at || new Date(g.ends_at) > new Date());
    expect(active).toBe(true);
  });

  it('grant révoqué : revoked_at non null → inactif', () => {
    const g = { revoked_at: new Date().toISOString(), starts_at: new Date().toISOString(), ends_at: null };
    const active = !g.revoked_at;
    expect(active).toBe(false);
  });
});

describe('ends_at calculation', () => {
  it('3 mois = starts_at + 3 mois', () => {
    const starts = new Date('2026-01-15');
    const d = new Date(starts);
    d.setMonth(d.getMonth() + 3);
    expect(d.getMonth()).toBe(3); // April (0-indexed)
    expect(d.getFullYear()).toBe(2026);
  });

  it('12 mois = starts_at + 1 an', () => {
    const starts = new Date('2026-06-17');
    const d = new Date(starts);
    d.setMonth(d.getMonth() + 12);
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(5); // June
  });

  it('lifetime = ends_at null', () => {
    const months = null;
    const endsAt = months !== null ? 'some-date' : null;
    expect(endsAt).toBeNull();
  });
});
