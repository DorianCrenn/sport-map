import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom:          vi.fn(),
  mockChannel:       vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));
vi.mock('../../lib/sanitize.js', () => ({ sanitizeText: (s) => s }));

import { useTrainingAttendance } from '../../hooks/useTrainingAttendance.js';

const fakeChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };

const ATT_ROWS = [
  { id: 'a-1', user_id: 'u-1', player_id: null, status: 'present', updated_at: '2026-07-01T10:00:00Z' },
  { id: 'a-2', user_id: 'u-2', player_id: null, status: 'absent',  updated_at: '2026-07-01T10:00:00Z' },
  { id: 'a-3', user_id: 'u-3', player_id: null, status: 'unsure',  updated_at: '2026-07-01T10:00:00Z' },
];
const PROFILES = [
  { id: 'u-1', name: 'Alice', avatar_url: null },
  { id: 'u-2', name: 'Bob',   avatar_url: null },
  { id: 'u-3', name: 'Carol', avatar_url: null },
];
const MSG_ROWS = [
  { id: 'm-1', content: 'Rendez-vous 18h', type: 'info', created_at: '2026-07-01T09:00:00Z', author_id: 'u-1' },
];

function makeQuery(result, overrides = {}) {
  const q = {
    select: vi.fn(() => q),
    eq:     vi.fn(() => q),
    in:     vi.fn(() => q),
    order:  vi.fn(() => q),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
    then:   (fn) => Promise.resolve(result).then(fn),
    ...overrides,
  };
  return q;
}

function wireDefaultTables(extra = {}) {
  mockFrom.mockImplementation((table) => {
    if (table === 'training_attendance') return extra.attendance ?? makeQuery({ data: ATT_ROWS, error: null });
    if (table === 'public_profiles')     return makeQuery({ data: PROFILES, error: null });
    if (table === 'training_messages')   return extra.messages ?? makeQuery({ data: MSG_ROWS, error: null });
    return makeQuery({ data: [], error: null });
  });
}

beforeEach(() => {
  mockFrom.mockReset();
  mockChannel.mockReturnValue(fakeChannel);
  fakeChannel.on.mockReturnValue(fakeChannel);
  fakeChannel.subscribe.mockReturnValue(fakeChannel);
});

describe('useTrainingAttendance — sans sessionId', () => {
  it('ne fetch rien si sessionId est null', () => {
    wireDefaultTables();
    const { result } = renderHook(() => useTrainingAttendance(null, 'u-1'));
    expect(result.current.attendance).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('useTrainingAttendance — chargement', () => {
  beforeEach(() => wireDefaultTables());

  it('charge les présences et calcule les compteurs', async () => {
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    expect(result.current.counts).toEqual({ present: 1, absent: 1, unsure: 1 });
  });

  it('détermine myStatus pour le userId donné', async () => {
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.myStatus).toBe('present'));
  });

  it('myStatus null si userId absent', async () => {
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-99'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    expect(result.current.myStatus).toBeNull();
  });

  it('charge les messages de la séance', async () => {
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].content).toBe('Rendez-vous 18h');
  });

  it('souscrit au channel Realtime de la séance', async () => {
    renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledWith(expect.stringContaining('training-s-1')));
    expect(fakeChannel.subscribe).toHaveBeenCalled();
  });
});

describe('useTrainingAttendance — respond()', () => {
  it('upsert avec le bon conflict + optimistic myStatus', async () => {
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    wireDefaultTables({ attendance: makeQuery({ data: ATT_ROWS, error: null }, { upsert }) });
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));

    await act(async () => { await result.current.respond('absent'); });

    expect(result.current.myStatus).toBe('absent');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 's-1', user_id: 'u-1', status: 'absent' }),
      expect.objectContaining({ onConflict: 'session_id,user_id' }),
    );
  });
});

describe('useTrainingAttendance — sendMessage()', () => {
  it('insert le message et retourne true', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    wireDefaultTables({ messages: makeQuery({ data: MSG_ROWS, error: null }, { insert }) });
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    let ok;
    await act(async () => { ok = await result.current.sendMessage({ clubId: 'c-1', content: 'Salut' }); });

    expect(ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ session_id: 's-1', club_id: 'c-1', author_id: 'u-1', content: 'Salut' }));
  });

  it('retourne false si le contenu est vide', async () => {
    wireDefaultTables();
    const { result } = renderHook(() => useTrainingAttendance('s-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    let ok;
    await act(async () => { ok = await result.current.sendMessage({ clubId: 'c-1', content: '   ' }); });
    expect(ok).toBe(false);
  });
});
