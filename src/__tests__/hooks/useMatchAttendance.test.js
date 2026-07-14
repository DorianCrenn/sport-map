import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:     vi.fn(),
  mockChannel:  vi.fn(),
}));

const fakeChannel = {
  on:          vi.fn().mockReturnThis(),
  subscribe:   vi.fn().mockReturnThis(),
  unsubscribe: vi.fn(),
};

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from:          mockFrom,
    channel:       mockChannel,
    removeChannel: vi.fn(),
  },
}));

import { useMatchAttendance } from '../../hooks/useMatchAttendance.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const RECORDS = [
  { event_id: 'ev-1', user_id: 'u-1', status: 'present', updated_at: new Date().toISOString(), profiles: { name: 'Alice', avatar_url: null } },
  { event_id: 'ev-1', user_id: 'u-2', status: 'absent',  updated_at: new Date().toISOString(), profiles: { name: 'Bob',   avatar_url: null } },
  { event_id: 'ev-1', user_id: 'u-3', status: 'unsure',  updated_at: new Date().toISOString(), profiles: { name: 'Carol', avatar_url: null } },
];

function makeQuery(result = { data: [], error: null }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    in:     vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    then:   (fn) => Promise.resolve(result).then(fn),
  };
}

beforeEach(() => {
  mockChannel.mockReturnValue(fakeChannel);
  fakeChannel.on.mockReturnValue(fakeChannel);
  fakeChannel.subscribe.mockReturnValue(fakeChannel);
});

// ── Tests — sans eventId ──────────────────────────────────────────────────────

describe('useMatchAttendance — sans eventId', () => {
  it('ne fetch rien si eventId est null', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderHook(() => useMatchAttendance(null, 'u-1'));
    await waitFor(() => expect(result.current.attendance).toEqual([]));
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── Tests — chargement ────────────────────────────────────────────────────────

describe('useMatchAttendance — chargement', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeQuery({ data: RECORDS, error: null }));
  });

  it('charge la liste et calcule les compteurs', async () => {
    const { result } = renderHook(() => useMatchAttendance('ev-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    expect(result.current.counts.present).toBe(1);
    expect(result.current.counts.absent).toBe(1);
    expect(result.current.counts.unsure).toBe(1);
  });

  it('détermine myStatus pour userId donné', async () => {
    const { result } = renderHook(() => useMatchAttendance('ev-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    expect(result.current.myStatus).toBe('present');
  });

  it('myStatus = null si userId absent de la liste', async () => {
    const { result } = renderHook(() => useMatchAttendance('ev-1', 'u-99'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));
    expect(result.current.myStatus).toBeNull();
  });

  it('souscrit au channel Realtime', async () => {
    renderHook(() => useMatchAttendance('ev-1', 'u-1'));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledWith(expect.stringContaining('match-att-ev-1')));
    expect(fakeChannel.on).toHaveBeenCalled();
    expect(fakeChannel.subscribe).toHaveBeenCalled();
  });
});

// ── Tests — respond() ─────────────────────────────────────────────────────────

describe('useMatchAttendance — respond()', () => {
  let upsertMock;

  beforeEach(() => {
    upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const q = makeQuery({ data: RECORDS, error: null });
    q.upsert = upsertMock;
    mockFrom.mockReturnValue(q);
  });

  it('optimistic update immédiat du myStatus', async () => {
    const { result } = renderHook(() => useMatchAttendance('ev-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));

    await act(async () => { await result.current.respond('absent'); });

    expect(result.current.myStatus).toBe('absent');
  });

  it('appelle upsert sur match_player_attendance avec le bon conflict', async () => {
    const { result } = renderHook(() => useMatchAttendance('ev-1', 'u-1'));
    await waitFor(() => expect(result.current.attendance).toHaveLength(3));

    await act(async () => { await result.current.respond('present'); });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ event_id: 'ev-1', user_id: 'u-1', status: 'present' }),
      expect.objectContaining({ onConflict: 'event_id,user_id' })
    );
  });
});
