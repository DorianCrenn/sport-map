import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  isDemoMode: () => false,
}));

import { makeQuery, makeChannel } from '../../test/mocks/supabase.js';
import { useMyConvocations } from '../../hooks/useMyConvocations.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
  mockChannel.mockReturnValue(makeChannel());
});

describe('useMyConvocations — sans userId', () => {
  it('retourne convocations=[] et loading=false si userId null', async () => {
    const { result } = renderHook(() => useMyConvocations(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convocations).toEqual([]);
  });
});

describe('useMyConvocations — avec userId', () => {
  it('démarre avec loading=true', () => {
    const { result } = renderHook(() => useMyConvocations('u-1'));
    expect(result.current.loading).toBe(true);
  });

  it('retourne convocations=[] si joueur sans lien (directPlayers vide)', async () => {
    // Toutes les requêtes retournent []
    mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
    const { result } = renderHook(() => useMyConvocations('u-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.convocations).toEqual([]);
  });

  it('expose respond et refetch', async () => {
    const { result } = renderHook(() => useMyConvocations('u-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.respond).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });
});
