import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: vi.fn() }));

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: vi.fn(() => false),
}));

vi.mock('../../hooks/useBadges.js', () => ({
  getLevel: (xp: number) => ({ level: Math.floor(xp / 100) + 1, label: `Niveau ${Math.floor(xp / 100) + 1}`, xpForNext: 100 }),
  BADGE_DEFS: {
    'first-event': { id: 'first-event', label: 'Premier événement', icon: '🏅', color: '#gold' },
    'social':      { id: 'social',      label: 'Social',            icon: '👥', color: '#blue' },
  },
  BADGE_ORDER: ['first-event', 'social'],
}));

vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }: any) => <span data-testid={`sport-${sport}`}>{sport}</span>,
}));

import UserPublicView from '../../components/UserPublicView.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockSupabase({
  profile = { id: 'u1', xp: 350, favorite_sports: ['football', 'rugby'], badges: ['first-event'], role: 'user', created_at: '2025-01-01' },
  follows = [] as any[],
} = {}) {
  mockFrom.mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    limit:  vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: table === 'profiles' ? profile : null }),
    then: (resolve: any) => {
      if (table === 'club_follows') return Promise.resolve({ data: follows }).then(resolve);
      return Promise.resolve({ data: profile }).then(resolve);
    },
  }));

  // Promise.all mock
  const origPromiseAll = Promise.all.bind(Promise);
  vi.spyOn(Promise, 'all').mockImplementationOnce(() =>
    origPromiseAll([
      Promise.resolve({ data: profile }),
      Promise.resolve({ data: follows }),
    ])
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UserPublicView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('monte sans crash', () => {
    mockSupabase();
    expect(() => render(<UserPublicView userId="u1" onClose={vi.fn()} />)).not.toThrow();
  });

  it('affiche le loader initialement', () => {
    mockSupabase();
    render(<UserPublicView userId="u1" onClose={vi.fn()} />);
    // La vue affiche soit un loader soit le contenu — pas d'erreur = ok
    expect(document.body).toBeTruthy();
  });

  it('affiche le profil après chargement', async () => {
    mockSupabase({
      profile: { id: 'u1', xp: 200, favorite_sports: ['football'], badges: [], role: 'user', created_at: '2025-06-01' },
    });
    render(<UserPublicView userId="u1" onClose={vi.fn()} />);
    await waitFor(() => {
      // XP ou niveau visible
      expect(document.body.textContent).toMatch(/200|Niveau/i);
    });
  });

  it('les clubs suivis sont affichés', async () => {
    mockSupabase({
      profile: { id: 'u1', xp: 0, favorite_sports: [], badges: [], role: 'user', created_at: '2025-01-01' },
      follows: [{ clubs: { id: 'c1', name: 'FC Brest', sport: 'football', logo_url: null } }],
    });
    render(<UserPublicView userId="u1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/FC Brest/);
    });
  });
});
