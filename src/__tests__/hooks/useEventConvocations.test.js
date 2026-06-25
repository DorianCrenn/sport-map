import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  isDemoMode: () => false,
}));

import { makeQuery, makeChannel } from '../../test/mocks/supabase.js';
import { useEventConvocations } from '../../hooks/useEventConvocations.js';

const CONV_ROW = {
  id: 'c-1', status: 'pending', note: null, created_at: '2026-06-12', responded_by: null,
  player: { id: 'p-1', name: 'Jean Dupont', team_id: 't-1', number: 9, photo_url: null, user_id: 'u-1' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [CONV_ROW], error: null }));
  mockChannel.mockReturnValue(makeChannel());
});

describe('useEventConvocations â€” chargement', () => {
  it('démarre avec loading=true si eventId fourni', () => {
    const { result } = renderHook(() => useEventConvocations('evt-1'));
    expect(result.current.loading).toBe(true);
  });

  it('loading=false et convocations=[] si eventId null', async () => {
    const { result } = renderHook(() => useEventConvocations(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convocations).toEqual([]);
  });

  it('charge les convocations depuis Supabase', async () => {
    const { result } = renderHook(() => useEventConvocations('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convocations).toHaveLength(1);
    expect(result.current.convocations[0].id).toBe('c-1');
  });

  it('retourne [] si data est null', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: null }));
    const { result } = renderHook(() => useEventConvocations('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convocations).toEqual([]);
  });
});

describe('useEventConvocations â€” fonctions', () => {
  it('expose sendConvocations, removeConvocation et refetch', async () => {
    const { result } = renderHook(() => useEventConvocations('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.sendConvocations).toBe('function');
    expect(typeof result.current.removeConvocation).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });

  it('sendConvocations avec liste vide retourne sans erreur', async () => {
    const { result } = renderHook(() => useEventConvocations('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const res = await result.current.sendConvocations([]);
    expect(res).toMatchObject({ error: null });
  });
});
