import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mock Supabase ─────────────────────────────────────────────────────────────

const mockChallenges = [
  {
    id: 'ch-1',
    challenger_id: 'club-a',
    challenged_id: 'club-b',
    type: 'match',
    message: 'Match amical samedi',
    status: 'pending',
    created_at: '2026-06-01T10:00:00Z',
    responded_at: null,
    challenger: { id: 'club-a', name: 'FC Brest', logo_url: null, sport: 'Football' },
    challenged: { id: 'club-b', name: 'FC Quimper', logo_url: null, sport: 'Football' },
  },
  {
    id: 'ch-2',
    challenger_id: 'club-c',
    challenged_id: 'club-a',
    type: 'tournament',
    message: null,
    status: 'accepted',
    created_at: '2026-06-02T09:00:00Z',
    responded_at: '2026-06-02T14:00:00Z',
    challenger: { id: 'club-c', name: 'AS Landerneau', logo_url: null, sport: 'Football' },
    challenged: { id: 'club-a', name: 'FC Brest', logo_url: null, sport: 'Football' },
  },
];

const mockFrom = {
  select: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: mockChallenges, error: null }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { ...mockChallenges[0], id: 'ch-new' },
    error: null,
  }),
};

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => mockFrom),
  },
}));

import { useClubChallenges } from '../../hooks/useClubChallenges.js';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useClubChallenges — chargement initial', () => {
  it('charge les challenges au montage', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));

    // Initially loading
    await act(async () => {});

    expect(result.current.challenges.length).toBe(2);
    expect(result.current.loading).toBe(false);
  });

  it('ne charge rien si clubId est null', async () => {
    const { result } = renderHook(() => useClubChallenges(null));
    await act(async () => {});
    expect(result.current.challenges).toEqual([]);
  });

  it('sépare les challenges reçus des envoyés', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});

    // club-a a envoyé ch-1 et reçu ch-2
    expect(result.current.sent.some(c => c.id === 'ch-1')).toBe(true);
    expect(result.current.received.some(c => c.id === 'ch-2')).toBe(true);
  });

  it('identifie les défis reçus en attente', async () => {
    // ch-2 a status=accepted donc pendingReceived devrait être vide pour club-a
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});

    const pending = result.current.pendingReceived;
    expect(Array.isArray(pending)).toBe(true);
    // ch-2 est 'accepted' donc pas dans pendingReceived
    expect(pending.every(c => c.status === 'pending')).toBe(true);
  });
});

describe('useClubChallenges — sendChallenge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.limit.mockResolvedValue({ data: mockChallenges, error: null });
    mockFrom.single.mockResolvedValue({
      data: {
        id: 'ch-new', challenger_id: 'club-a', challenged_id: 'club-d',
        type: 'match', message: 'Bonjour !', status: 'pending',
        created_at: new Date().toISOString(), responded_at: null,
        challenger: { id: 'club-a', name: 'FC Brest', logo_url: null, sport: 'Football' },
        challenged: { id: 'club-d', name: 'US Brest', logo_url: null, sport: 'Football' },
      },
      error: null,
    });
  });

  it('ajoute le nouveau challenge en tête de liste', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});
    const initialCount = result.current.challenges.length;

    await act(async () => {
      await result.current.sendChallenge('club-d', 'match', 'Bonjour !');
    });

    expect(result.current.challenges.length).toBe(initialCount + 1);
    expect(result.current.challenges[0].id).toBe('ch-new');
  });

  it('lance une erreur si clubId est null', async () => {
    const { result } = renderHook(() => useClubChallenges(null));
    await act(async () => {});

    await expect(result.current.sendChallenge('club-d', 'match')).rejects.toThrow();
  });
});

describe('useClubChallenges — respond', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.limit.mockResolvedValue({ data: mockChallenges, error: null });
    mockFrom.eq.mockResolvedValue({ data: null, error: null });
  });

  it('met à jour le statut localement après accept', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});

    await act(async () => {
      await result.current.respond('ch-1', 'accepted');
    });

    const updated = result.current.challenges.find(c => c.id === 'ch-1');
    expect(updated?.status).toBe('accepted');
  });

  it('met à jour le statut localement après decline', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});

    await act(async () => {
      await result.current.respond('ch-2', 'declined');
    });

    const updated = result.current.challenges.find(c => c.id === 'ch-2');
    expect(updated?.status).toBe('declined');
  });

  it('cancel appelle respond avec status=cancelled', async () => {
    const { result } = renderHook(() => useClubChallenges('club-a'));
    await act(async () => {});

    const respondSpy = vi.spyOn(result.current, 'respond');

    await act(async () => {
      await result.current.cancel('ch-1');
    });

    // cancel doit mettre status à 'cancelled'
    const updated = result.current.challenges.find(c => c.id === 'ch-1');
    expect(updated?.status).toBe('cancelled');
  });
});
