import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom: vi.fn(), mockChannel: vi.fn(), mockRemoveChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom, channel: mockChannel, removeChannel: mockRemoveChannel },
  isDemoMode: () => false,
  setDemoMode: () => {},
}));
vi.mock('../../lib/sanitize.js', () => ({ sanitizeText: (s) => s }));

import { useNextTraining } from '../../hooks/useNextTraining.js';

const fakeChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };

const SESSION = { id: 'sess-1', club_id: 'club-1', team_id: null, date: '2026-07-10', time: '18:30', location: 'Gymnase' };
const ATT = [
  { id: 'a-1', user_id: 'u-1', status: 'present' },
  { id: 'a-2', user_id: 'u-2', status: 'absent' },
];

function sessionQuery(session) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), gte: vi.fn(() => q),
    neq: vi.fn(() => q), order: vi.fn(() => q), limit: vi.fn(() => q),
    maybeSingle: vi.fn(() => Promise.resolve({ data: session })),
  };
  return q;
}
function attQuery(list, overrides = {}) {
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    then: (fn) => Promise.resolve({ data: list }).then(fn),
    ...overrides,
  };
  return q;
}

function wire({ session = SESSION, att = ATT, upsert, insert } = {}) {
  mockFrom.mockImplementation((table) => {
    if (table === 'training_sessions') return sessionQuery(session);
    if (table === 'training_attendance') return attQuery(att, upsert ? { upsert } : {});
    if (table === 'training_messages') return { insert: insert ?? vi.fn(() => Promise.resolve({ error: null })) };
    return attQuery([]);
  });
}

beforeEach(() => {
  mockFrom.mockReset();
  mockChannel.mockReturnValue(fakeChannel);
  fakeChannel.on.mockReturnValue(fakeChannel);
  fakeChannel.subscribe.mockReturnValue(fakeChannel);
});

describe('useNextTraining', () => {
  it('sans clubId → loading false, pas de séance', async () => {
    wire();
    const { result } = renderHook(() => useNextTraining(null, 'u-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('charge la prochaine séance', async () => {
    wire();
    const { result } = renderHook(() => useNextTraining('club-1', 'u-1'));
    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session.id).toBe('sess-1');
    expect(result.current.loading).toBe(false);
  });

  it('calcule les compteurs et myStatus', async () => {
    wire();
    const { result } = renderHook(() => useNextTraining('club-1', 'u-1'));
    await waitFor(() => expect(result.current.counts.present).toBe(1));
    expect(result.current.counts.absent).toBe(1);
    expect(result.current.myStatus).toBe('present');
  });

  it('respond() upsert avec le bon conflict', async () => {
    const upsert = vi.fn(() => Promise.resolve({ error: null }));
    wire({ upsert });
    const { result } = renderHook(() => useNextTraining('club-1', 'u-1'));
    await waitFor(() => expect(result.current.session).not.toBeNull());
    await act(async () => { await result.current.respond('unsure'); });
    expect(result.current.myStatus).toBe('unsure');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 'sess-1', user_id: 'u-1', status: 'unsure' }),
      expect.objectContaining({ onConflict: 'session_id,user_id' }),
    );
  });

  it('sendMessage() insert et retourne true', async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    wire({ insert });
    const { result } = renderHook(() => useNextTraining('club-1', 'u-1'));
    await waitFor(() => expect(result.current.session).not.toBeNull());
    let ok;
    await act(async () => { ok = await result.current.sendMessage({ clubId: 'club-1', content: 'Go' }); });
    expect(ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ session_id: 'sess-1', club_id: 'club-1', content: 'Go' }));
  });
});
