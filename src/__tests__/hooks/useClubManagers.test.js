import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../../lib/supabase.js', () => ({ supabase: { from: mockFrom } }));
vi.mock('../../lib/errorBus.js',  () => ({ dispatchError: vi.fn() }));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useClubManagers } from '../../hooks/useClubManagers.js';

function managerRow(overrides = {}) {
  return { email: 'admin@test.fr', name: 'Admin', role: 'manager', added_at: '2026-01-01', ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockFrom.mockReturnValue(makeQuery({ data: [managerRow()], error: null }));
});

describe('useClubManagers â€” chargement', () => {
  it('retourne managers=[] initialement', () => {
    const { result } = renderHook(() => useClubManagers('c-1'));
    expect(result.current.managers).toEqual([]);
  });

  it('charge les managers depuis Supabase', async () => {
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => expect(result.current.managers.length).toBeGreaterThan(0));
    expect(result.current.managers[0].email).toBe('admin@test.fr');
  });

  it('mappe role (dÃ©faut "manager")', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: [managerRow({ role: null })], error: null }));
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => expect(result.current.managers.length).toBeGreaterThan(0));
    expect(result.current.managers[0].role).toBe('manager');
  });

  it('isManager(email) retourne true pour un manager connu', async () => {
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => expect(result.current.managers.length).toBeGreaterThan(0));
    expect(result.current.isManager('admin@test.fr')).toBe(true);
  });

  it('isManager(email) retourne false pour un email inconnu', async () => {
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => expect(result.current.managers.length).toBeGreaterThan(0));
    expect(result.current.isManager('inconnu@test.fr')).toBe(false);
  });

  it('fallback localStorage si Supabase renvoie une erreur', async () => {
    localStorage.setItem('club-managers-c-1', JSON.stringify([{ email: 'local@test.fr', name: 'Local', role: 'manager' }]));
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'RLS' } }));
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => expect(result.current.managers.length).toBeGreaterThan(0));
    expect(result.current.managers[0].email).toBe('local@test.fr');
  });
});

describe('useClubManagers â€” fonctions exposÃ©es', () => {
  it('expose addManager, removeManager, updateManagerRole', async () => {
    const { result } = renderHook(() => useClubManagers('c-1'));
    await waitFor(() => {});
    expect(typeof result.current.addManager).toBe('function');
    expect(typeof result.current.removeManager).toBe('function');
    expect(typeof result.current.updateManagerRole).toBe('function');
  });
});
