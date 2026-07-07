import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks hoistés ─────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const { mockChannel, mockFrom, mockSubscribe, mockOn, mockRemoveChannel, capturedHandler } = vi.hoisted(() => {
  let _handler = null;
  const mockSubscribe = vi.fn().mockReturnThis();
  const mockOn = vi.fn((event, filter, handler) => {
    _handler = handler;
    return { subscribe: mockSubscribe };
  });
  const mockChannel = vi.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = vi.fn();
  const mockFrom = vi.fn();

  return {
    mockChannel,
    mockFrom,
    mockSubscribe,
    mockOn,
    mockRemoveChannel,
    capturedHandler: { current: null, get fn() { return _handler; } },
  };
});

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  },
}));

import { AttendeeCountProvider, useAttendeeCount } from '../../contexts/AttendeeCountContext.jsx';

function makeQuery(data = [], error = null) {
  return {
    select: vi.fn().mockResolvedValue({ data, error }),
  };
}

const wrapper = ({ children }) => <AttendeeCountProvider>{children}</AttendeeCountProvider>;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AttendeeCountContext — chargement initial', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue(makeQuery([
      { event_id: 'evt-1', count: 5 },
      { event_id: 'evt-2', count: 12 },
    ]));
  });

  it('retourne 0 par défaut pour un eventId inconnu', async () => {
    const { result } = renderHook(() => useAttendeeCount('evt-99'), { wrapper });
    expect(result.current).toBe(0);
  });

  it('charge les counts depuis la vue event_attendee_counts', async () => {
    const { result } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(5));
  });

  it('charge plusieurs events simultanément', async () => {
    const { result: r1 } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    const { result: r2 } = renderHook(() => useAttendeeCount('evt-2'), { wrapper });
    await waitFor(() => {
      expect(r1.current).toBe(5);
      expect(r2.current).toBe(12);
    });
  });
});

describe('AttendeeCountContext — mises à jour Realtime partielles (PERF-004)', () => {
  beforeEach(() => {
    // Vider les appels accumulés pour que calls[0] soit bien le handler du test courant
    mockOn.mockClear();
    mockChannel.mockClear();
    mockFrom.mockClear();
    mockFrom.mockReturnValue(makeQuery([
      { event_id: 'evt-1', count: 3 },
    ]));
  });

  it('incrémente le count sur INSERT sans recharger tous les counts', async () => {
    const { result } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));

    // Simule un event Realtime INSERT
    act(() => {
      mockOn.mock.calls[0][2]({
        eventType: 'INSERT',
        new: { event_id: 'evt-1' },
      });
    });

    expect(result.current).toBe(4);
    // La vue n'a pas été rechargée (from toujours appelé 1 seule fois)
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('décrémente le count sur DELETE sans recharger', async () => {
    const { result } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));

    act(() => {
      mockOn.mock.calls[0][2]({
        eventType: 'DELETE',
        old: { event_id: 'evt-1' },
      });
    });

    expect(result.current).toBe(2);
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it('ne descend pas en dessous de 0 sur DELETE', async () => {
    mockFrom.mockReturnValue(makeQuery([{ event_id: 'evt-1', count: 0 }]));
    const { result } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(0));

    act(() => {
      mockOn.mock.calls[0][2]({
        eventType: 'DELETE',
        old: { event_id: 'evt-1' },
      });
    });

    expect(result.current).toBe(0);
  });

  it('fait un reload complet si event_id absent du payload', async () => {
    mockFrom.mockReturnValue(makeQuery([{ event_id: 'evt-1', count: 3 }]));
    const { result } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(result.current).toBe(3));

    const callsBefore = mockFrom.mock.calls.length;

    // Payload sans event_id → fallback reload
    mockFrom.mockReturnValue(makeQuery([{ event_id: 'evt-1', count: 10 }]));
    act(() => {
      mockOn.mock.calls[0][2]({ eventType: 'INSERT', new: {} });
    });

    await waitFor(() => expect(result.current).toBe(10));
    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('souscrit au bon channel Realtime', async () => {
    renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(mockChannel).toHaveBeenCalledWith('attendee-count-changes'));
  });

  it('nettoie le channel au démontage', async () => {
    const { unmount } = renderHook(() => useAttendeeCount('evt-1'), { wrapper });
    await waitFor(() => expect(mockChannel).toHaveBeenCalled());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
