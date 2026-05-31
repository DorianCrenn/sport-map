import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockUseAuth, mockUseClubs } = vi.hoisted(() => ({
  mockFrom:     vi.fn(),
  mockUseAuth:  vi.fn(),
  mockUseClubs: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: mockUseClubs,
}));

import { useManagedClubs } from '../../hooks/useManagedClubs.js';

// ── Chainable query builder ───────────────────────────────────────────────────

let capturedFilters = [];

function q(terminal) {
  const obj = {
    then:   (fn, rej) => Promise.resolve(terminal).then(fn, rej),
    select: vi.fn(() => obj),
    eq:     vi.fn((col, val) => { capturedFilters.push({ col, val }); return obj; }),
    in:     vi.fn(() => obj),
    limit:  vi.fn(() => obj),
  };
  return obj;
}

const SAMPLE_CLUBS = [
  { id: 'c1', name: 'FC Brest', userId: 'u1' },
  { id: 'c2', name: 'HB Brest', userId: 'u2' },
];

beforeEach(() => {
  vi.clearAllMocks();
  capturedFilters = [];
  mockUseClubs.mockReturnValue({ userClubs: SAMPLE_CLUBS, loading: false });
});

// ── Utilisateur non connecté ──────────────────────────────────────────────────

describe('useManagedClubs — utilisateur non connecté', () => {
  it('retourne [] si currentUser est null', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });

    const { result } = renderHook(() => useManagedClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.managedClubs).toEqual([]);
  });

  it('ne fait pas de requête Supabase si pas d\'email', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });

    renderHook(() => useManagedClubs());
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

// ── Structure de la query club_managers ──────────────────────────────────────

describe('useManagedClubs — query club_managers', () => {
  it('filtre par email de l\'utilisateur', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1', email: 'coach@brest.fr', clubId: null } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useManagedClubs());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    const emailFilter = capturedFilters.find(f => f.col === 'email');
    expect(emailFilter).toBeDefined();
    expect(emailFilter.val).toBe('coach@brest.fr');
  });

  it('filtre par status=active', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1', email: 'coach@brest.fr', clubId: null } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useManagedClubs());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    const statusFilter = capturedFilters.find(f => f.col === 'status');
    expect(statusFilter).toBeDefined();
    expect(statusFilter.val).toBe('active');
  });

  it('appelle .from("club_managers")', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1', email: 'test@test.com', clubId: null } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    renderHook(() => useManagedClubs());
    await waitFor(() => expect(mockFrom).toHaveBeenCalled());

    expect(mockFrom).toHaveBeenCalledWith('club_managers');
  });
});

// ── Clubs gérés retournés ─────────────────────────────────────────────────────

describe('useManagedClubs — clubs retournés', () => {
  it('inclut le club via profiles.club_id si défini', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1', email: 'test@test.com', clubId: 'c1' } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));

    const { result } = renderHook(() => useManagedClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.managedClubs.some(c => c.id === 'c1')).toBe(true);
  });

  it('retourne [] si pas de club_id ni de entries dans club_managers', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1', email: 'test@test.com', clubId: null } });
    mockFrom.mockReturnValue(q({ data: [], error: null }));
    mockUseClubs.mockReturnValue({ userClubs: [], loading: false });

    const { result } = renderHook(() => useManagedClubs());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.managedClubs).toEqual([]);
  });
});
