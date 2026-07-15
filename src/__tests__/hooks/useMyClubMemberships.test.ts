import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseAuth    = vi.hoisted(() => vi.fn());
const mockFrom       = vi.hoisted(() => vi.fn());
const mockIsDemoMode = vi.hoisted(() => vi.fn(() => false));

vi.mock('../../contexts/AuthContext.js', () => ({ useAuth: mockUseAuth }));
vi.mock('../../lib/supabase.js', () => ({ supabase: { from: mockFrom }, isDemoMode: mockIsDemoMode }));
vi.mock('../../demo/data/club.js', () => ({ DEMO_CLUB_ID: 'demo-club-1' }));

// sessionStorage mock
const sessionStore: Record<string, string> = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem:    (k: string) => sessionStore[k] ?? null,
    setItem:    (k: string, v: string) => { sessionStore[k] = v; },
    removeItem: (k: string) => { delete sessionStore[k]; },
    clear:      () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); },
  },
  writable: true,
});

import { useMyClubMemberships } from '../../hooks/useMyClubMemberships.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Chaîne supabase thenable : .select/.eq/.in renvoient la chaîne, awaitable → { data }
function chainResolving(data: unknown) {
  const p = Promise.resolve({ data });
  const chain: any = {
    select: () => chain,
    eq:     () => chain,
    in:     () => chain,
    then:   (res: any, rej: any) => p.then(res, rej),
  };
  return chain;
}

// club_players est interrogé 2× : d'abord les lignes du user, puis les enfants (via .in)
function setupRealMocks({ players = [] as any[], managers = [] as any[], guardians = [] as any[], children = [] as any[] }) {
  let clubPlayersCall = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === 'club_players')     { clubPlayersCall++; return chainResolving(clubPlayersCall === 1 ? players : children); }
    if (table === 'club_managers')    return chainResolving(managers);
    if (table === 'player_guardians') return chainResolving(guardians);
    return chainResolving([]);
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useMyClubMemberships', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockIsDemoMode.mockReturnValue(false);
  });

  it('ensemble vide si pas d\'utilisateur connecté', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { result } = renderHook(() => useMyClubMemberships());
    expect(result.current.size).toBe(0);
  });

  it('démo : un profil non-supporter appartient au club de démo', async () => {
    mockIsDemoMode.mockReturnValue(true);
    sessionStorage.setItem('sl-demo-profile', 'coach');
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.has('demo-club-1')).toBe(true));
  });

  it('démo : un supporter n\'appartient à aucun club (pas de covoiturage)', async () => {
    mockIsDemoMode.mockReturnValue(true);
    sessionStorage.setItem('sl-demo-profile', 'supporter');
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.size).toBe(0));
  });

  it('démo sans profil : ensemble vide', async () => {
    mockIsDemoMode.mockReturnValue(true);
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.size).toBe(0));
  });

  it('réel : agrège les clubs où l\'user est joueur ET manager', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    setupRealMocks({ players: [{ club_id: 'club-A' }], managers: [{ club_id: 'club-B' }] });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.has('club-A')).toBe(true);
    expect(result.current.has('club-B')).toBe(true);
  });

  it('réel : un parent hérite du club de son enfant (guardians → children)', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    setupRealMocks({ guardians: [{ player_id: 'p1' }], children: [{ club_id: 'club-C' }] });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.has('club-C')).toBe(true));
  });

  it('réel : ids dédupliqués (même club via 2 sources)', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' } });
    setupRealMocks({ players: [{ club_id: 'club-A' }], managers: [{ club_id: 'club-A' }] });
    const { result } = renderHook(() => useMyClubMemberships());
    await waitFor(() => expect(result.current.size).toBe(1));
  });
});
