import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuery } from '../../hooks/useQuery.js';

describe('useQuery', () => {
  it('retourne loading=true puis les données', async () => {
    const queryFn = vi.fn().mockResolvedValue(['event1', 'event2']);
    const { result } = renderHook(() => useQuery(queryFn, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(['event1', 'event2']);
    expect(result.current.error).toBeNull();
  });

  it('retourne error si la promesse rejette', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useQuery(queryFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  it('initialData est utilisé comme valeur initiale', () => {
    const queryFn = vi.fn().mockResolvedValue(['new']);
    const { result } = renderHook(() =>
      useQuery(queryFn, [], { initialData: ['cached'] })
    );
    expect(result.current.data).toEqual(['cached']);
  });

  it('enabled=false ne lance pas la requête et loading=false', () => {
    const queryFn = vi.fn();
    const { result } = renderHook(() =>
      useQuery(queryFn, [], { enabled: false })
    );
    expect(result.current.loading).toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('setData permet de modifier les données manuellement', async () => {
    const queryFn = vi.fn().mockResolvedValue(['item1']);
    const { result } = renderHook(() => useQuery(queryFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['item1']);

    act(() => result.current.setData(['item2']));
    expect(result.current.data).toEqual(['item2']);
  });

  it('gère les erreurs string (non-Error)', async () => {
    const queryFn = vi.fn().mockRejectedValue('Erreur inconnue');
    const { result } = renderHook(() => useQuery(queryFn, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erreur inconnue');
  });

  it('re-lance la requête quand les deps changent', async () => {
    let counter = 0;
    const queryFn = vi.fn(() => Promise.resolve(++counter));
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useQuery(queryFn, [id]),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => expect(result.current.data).toBe(1));
    expect(queryFn).toHaveBeenCalledTimes(1);

    rerender({ id: 2 });
    await waitFor(() => expect(result.current.data).toBe(2));
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});
