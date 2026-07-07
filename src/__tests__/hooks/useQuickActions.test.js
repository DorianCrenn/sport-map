import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom: vi.fn(), mockChannel: vi.fn(), mockRemoveChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));

import { useQuickActions } from '../../hooks/useQuickActions.js';

const fakeChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };

const TODAY = new Date().toISOString().slice(0, 10);
const TRAINING = { id: 't-1', club_id: 'club-1', team_id: null, time: '18:30', location: 'Gymnase', status: 'active' };
const EVENT = { id: 'ev-1', title: 'Match', date: TODAY, adversaire: 'FC X', home_or_away: 'home', team_name: 'Seniors', club_id: 'club-1', score: null, event_type: 'match' };
const SCORE = { event_id: 'ev-1', score_home: 1, score_away: 0, status: 'final' };
const CONVOCS = [
  { event_id: 'ev-1', status: 'accepted' },
  { event_id: 'ev-1', status: 'accepted' },
  { event_id: 'ev-1', status: 'pending' },
];

function trainingQuery() {
  const q = { select: () => q, in: () => q, eq: () => q, limit: () => q, maybeSingle: () => Promise.resolve({ data: TRAINING }) };
  return q;
}
function eventsQuery() {
  let isLive = false;
  const q = {
    select: () => q,
    in: (col) => { if (col === 'id') isLive = true; return q; },
    gte: () => q, lte: () => q, order: () => q,
    then: (fn) => Promise.resolve({ data: isLive ? [] : [EVENT] }).then(fn),
  };
  return q;
}
function scoresQuery() {
  let isInProgress = false;
  const q = {
    select: () => q,
    eq: (col) => { if (col === 'status') isInProgress = true; return q; },
    in: () => q,
    then: (fn) => Promise.resolve({ data: isInProgress ? [] : [SCORE] }).then(fn),
  };
  return q;
}
function convocQuery() {
  const q = { select: () => q, in: () => q, then: (fn) => Promise.resolve({ data: CONVOCS }).then(fn) };
  return q;
}

function wireCoach() {
  mockFrom.mockImplementation((table) => {
    if (table === 'training_sessions')   return trainingQuery();
    if (table === 'events')              return eventsQuery();
    if (table === 'match_scores')        return scoresQuery();
    if (table === 'event_convocations')  return convocQuery();
    return { select: () => ({ then: (fn) => Promise.resolve({ data: [] }).then(fn) }) };
  });
}

const COACH_OPTS = {
  currentUser: { id: 'u-1' },
  managedClubs: [{ id: 'club-1', name: 'Mon Club', logo_url: null }],
  followedClubIds: [],
  isCoachOrManager: true,
  isCommunicant: false,
};

beforeEach(() => {
  mockFrom.mockReset();
  mockChannel.mockReturnValue(fakeChannel);
  fakeChannel.on.mockReturnValue(fakeChannel);
  fakeChannel.subscribe.mockReturnValue(fakeChannel);
});

describe('useQuickActions', () => {
  it('sans utilisateur connecté → tout vide, loading false, aucune requête', async () => {
    mockFrom.mockImplementation(() => ({}));
    // Robustesse : tableaux INLINE (nouvelle ref à chaque rendu). Avant le fix
    // de stabilité par contenu, ça bouclait à l'infini (re-fetch en boucle).
    const { result } = renderHook(() => useQuickActions({
      currentUser: null, managedClubs: [], followedClubIds: [], isCoachOrManager: false, isCommunicant: false,
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.coachMatches).toEqual([]);
    expect(result.current.liveMatches).toEqual([]);
    expect(result.current.todayTraining).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('coach → agrège events + score + comptes de convocations', async () => {
    wireCoach();
    const { result } = renderHook(() => useQuickActions(COACH_OPTS));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.todayTraining).toMatchObject({ id: 't-1' });
    expect(result.current.coachMatches).toHaveLength(1);
    const m = result.current.coachMatches[0];
    expect(m.event.id).toBe('ev-1');
    expect(m.matchScore).toMatchObject({ score_home: 1, score_away: 0 });
    expect(m.convocationCounts).toMatchObject({ accepted: 2, pending: 1, total: 3 });
  });
});
