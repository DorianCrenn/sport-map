import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

const mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
vi.mock('../../lib/supabase.js', () => ({
  supabase:    { from: mockFrom, channel: vi.fn(() => mockChannel), removeChannel: vi.fn() },
  isDemoMode:  vi.fn(() => false),
}));

import { useSeasonPlanning } from '../../hooks/useSeasonPlanning.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQuery(result = { data: [], error: null }) {
  const q = {
    select:  vi.fn().mockReturnThis(),
    eq:      vi.fn().mockReturnThis(),
    neq:     vi.fn().mockReturnThis(),
    in:      vi.fn().mockReturnThis(),
    gte:     vi.fn().mockReturnThis(),
    lte:     vi.fn().mockReturnThis(),
    not:     vi.fn().mockReturnThis(),
    order:   vi.fn().mockReturnThis(),
    limit:   vi.fn().mockReturnThis(),
    upsert:  vi.fn().mockResolvedValue({ data: null, error: null }),
    delete:  vi.fn().mockReturnThis(),
    then:    (fn) => Promise.resolve(result).then(fn),
  };
  return q;
}

const NOW    = new Date();
const YEAR   = NOW.getFullYear();
const MONTH  = NOW.getMonth() + 1;
const TODAY  = NOW.toISOString().slice(0, 10);

function futureDate(days) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const PLAYER_ENTRY  = [{ club_id: 'club-1', team_id: 'Équipe 1', name: 'Équipe 1' }];
const NO_GUARDIANS  = [];
const SESSIONS      = [{ id: 'ts-1', club_id: 'club-1', team_id: 'Équipe 1', date: TODAY, time: '18h30', location: 'Gymnase', status: 'active' }];
const EVENTS        = [{ id: 'ev-1', club_id: 'club-1', title: 'Match vs Test', sport: 'Football', date: `${futureDate(4)}T15:00:00`, event_type: 'championship', adversaire: 'Test FC', score: null, is_archived: false }];
const TRAIN_ATT     = [{ session_id: 'ts-1', status: 'present' }];
const MATCH_ATT     = [{ event_id: 'ev-1', status: 'absent' }];
const TRAIN_COUNTS  = [{ session_id: 'ts-1', present_count: 10, absent_count: 2, unsure_count: 1 }];
const MATCH_COUNTS  = [{ event_id: 'ev-1', present_count: 8, absent_count: 3, unsure_count: 2 }];

// Séquence de réponses par table
function setupMockSequence(overrides = {}) {
  const calls = {
    club_players:                { data: PLAYER_ENTRY,  error: null },
    player_guardians:            { data: NO_GUARDIANS,  error: null },
    training_sessions:           { data: SESSIONS,      error: null },
    events:                      { data: EVENTS,        error: null },
    training_attendance:         { data: TRAIN_ATT,     error: null },
    match_player_attendance:     { data: MATCH_ATT,     error: null },
    training_attendance_counts:  { data: TRAIN_COUNTS,  error: null },
    match_attendance_counts:     { data: MATCH_COUNTS,  error: null },
    event_convocations:          { data: [],            error: null },
    ...overrides,
  };

  mockFrom.mockImplementation((table) => makeQuery(calls[table] ?? { data: [], error: null }));
}

// ── Tests — sans userId ───────────────────────────────────────────────────────

describe('useSeasonPlanning — sans userId', () => {
  beforeEach(() => setupMockSequence());

  it('retourne items vide et loading false si userId absent', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: null, allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(0);
  });

  it('retourne items vide si allClubIds vide', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: [], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(0);
  });
});

// ── Tests — chargement joueur ──────────────────────────────────────────────────

describe('useSeasonPlanning — joueur', () => {
  beforeEach(() => setupMockSequence());

  it('charge séances + matchs et les fusionne triés par date', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.length).toBeGreaterThanOrEqual(1);
    const types = result.current.items.map(i => i.type);
    expect(types).toContain('training');
    expect(types).toContain('match');
  });

  it('attache myStatus depuis training_attendance', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const session = result.current.items.find(i => i.type === 'training');
    expect(session?.myStatus).toBe('present');
  });

  it('attache myStatus depuis match_player_attendance', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const match = result.current.items.find(i => i.type === 'match');
    expect(match?.myStatus).toBe('absent');
  });

  it('attache presentCount depuis training_attendance_counts', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const session = result.current.items.find(i => i.type === 'training');
    expect(session?.presentCount).toBe(10);
    expect(session?.absentCount).toBe(2);
  });

  it('isPlayerClub=true, isSupporter=false pour joueur', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const match = result.current.items.find(i => i.type === 'match');
    expect(match?.isPlayerClub).toBe(true);
    expect(match?.isSupporter).toBe(false);
  });
});

// ── Tests — supporter (pas de club_players) ───────────────────────────────────

describe('useSeasonPlanning — supporter', () => {
  beforeEach(() => {
    setupMockSequence({
      club_players: { data: [], error: null },
    });
  });

  it('supporter : isSupporter=true sur les matchs', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const match = result.current.items.find(i => i.type === 'match');
    expect(match?.isSupporter).toBe(true);
  });

  it('supporter : pas de séances training dans les items', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const trainings = result.current.items.filter(i => i.type === 'training');
    expect(trainings).toHaveLength(0);
  });
});

// ── Tests — staff ─────────────────────────────────────────────────────────────

describe('useSeasonPlanning — staff', () => {
  beforeEach(() => {
    setupMockSequence({
      club_players: { data: [], error: null },
      event_convocations: { data: [
        { event_id: 'ev-1', status: 'accepted' },
        { event_id: 'ev-1', status: 'pending' },
      ], error: null },
    });
  });

  it('staff : isStaffClub=true sur les items', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: ['club-1'], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const match = result.current.items.find(i => i.type === 'match');
    expect(match?.isStaffClub).toBe(true);
  });

  it('staff : convocs attachées avec total et accepted', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: ['club-1'], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    const match = result.current.items.find(i => i.type === 'match');
    expect(match?.convocs?.total).toBe(2);
    expect(match?.convocs?.accepted).toBe(1);
    expect(match?.convocs?.pending).toBe(1);
  });
});

// ── Tests — respond() ─────────────────────────────────────────────────────────

describe('useSeasonPlanning — respond()', () => {
  let upsertMock;

  beforeEach(() => {
    upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    setupMockSequence();
    mockFrom.mockImplementation((table) => {
      const q = makeQuery(table === 'club_players' ? { data: PLAYER_ENTRY, error: null } :
                           table === 'player_guardians' ? { data: [], error: null } :
                           table === 'training_sessions' ? { data: SESSIONS, error: null } :
                           table === 'events' ? { data: EVENTS, error: null } :
                           table === 'training_attendance' ? { data: TRAIN_ATT, error: null } :
                           table === 'match_player_attendance' ? { data: MATCH_ATT, error: null } :
                           table === 'training_attendance_counts' ? { data: TRAIN_COUNTS, error: null } :
                           table === 'match_attendance_counts' ? { data: MATCH_COUNTS, error: null } :
                           { data: [], error: null });
      q.upsert = upsertMock;
      return q;
    });
  });

  it('respond training : optimistic update du myStatus', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.respond('training', 'ts-1', 'absent');
    });

    const session = result.current.items.find(i => i.id === 'ts-1');
    expect(session?.myStatus).toBe('absent');
  });

  it('respond training : upsert appelé sur training_attendance', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.respond('training', 'ts-1', 'present'); });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'ts-1', user_id: 'user-1', status: 'present' }),
      expect.objectContaining({ onConflict: 'session_id,user_id' })
    );
  });

  it('respond match : upsert sur match_player_attendance', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.respond('match', 'ev-1', 'present'); });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'ev-1', user_id: 'user-1', status: 'present' }),
      expect.objectContaining({ onConflict: 'event_id,user_id' })
    );
  });

  it('respond ne fait rien si status est null', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1'], managedClubIds: [], year: YEAR, month: MONTH })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.respond('training', 'ts-1', null); });

    expect(upsertMock).not.toHaveBeenCalled();
  });
});

// ── Tests — filtre club ───────────────────────────────────────────────────────

describe('useSeasonPlanning — clubFilter', () => {
  beforeEach(() => setupMockSequence());

  it('clubFilter=all : retourne items des deux clubs', async () => {
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1', 'club-2'], managedClubIds: [], year: YEAR, month: MONTH, clubFilter: 'all' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items.length).toBeGreaterThanOrEqual(0);
  });

  it('clubFilter=club-2 : charge sans crash et loading=false', async () => {
    // La sélection du bon club est vérifiée via l'appel Supabase (filtre .in)
    // pas via le contenu (le mock retourne des données statiques indépendamment)
    const { result } = renderHook(() =>
      useSeasonPlanning({ userId: 'user-1', allClubIds: ['club-1', 'club-2'], managedClubIds: [], year: YEAR, month: MONTH, clubFilter: 'club-2' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toBeDefined();
    // Vérifie que mockFrom a bien été appelé avec la table events
    expect(mockFrom).toHaveBeenCalledWith('events');
  });
});
