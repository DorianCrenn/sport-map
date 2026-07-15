import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseMyRole = vi.hoisted(() => vi.fn());
const mockFrom      = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useMyRole.js', () => ({ useMyRole: mockUseMyRole }));
vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: vi.fn(() => false),
}));

import { useCanDo, invalidatePermissionCache } from '../../hooks/useCanDo.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRole(role: string, { isSimulating = false, detectedRole = role } = {}) {
  mockUseMyRole.mockReturnValue({ role, isSimulating, detectedRole });
}

// La matrice se charge via supabase.from('permission_matrix').select(...).then(...)
// → select() doit renvoyer un thenable résolvant { data }.
function mockMatrix(rows: { role: string; resource: string; action: string; allowed: boolean }[]) {
  mockFrom.mockImplementation(() => ({
    select: vi.fn(() => Promise.resolve({ data: rows })),
  }));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useCanDo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidatePermissionCache(); // le cache est au niveau module — réinitialiser entre chaque test
  });

  it('admin détecté (non simulé) : tout est autorisé, même une permission absente', () => {
    mockRole('admin', { detectedRole: 'admin' });
    mockMatrix([]);
    const { result } = renderHook(() => useCanDo());
    expect(result.current.can('n_importe_quoi', 'delete')).toBe(true);
  });

  it('matrice vide/non chargée : fail-open (permissif) pour ne pas bloquer l\'UI', () => {
    mockRole('player', { detectedRole: 'player' });
    mockMatrix([]);
    const { result } = renderHook(() => useCanDo());
    expect(result.current.can('teams', 'create')).toBe(true);
  });

  it('matrice chargée : autorise quand allowed=true', async () => {
    mockRole('coach', { detectedRole: 'coach' });
    mockMatrix([{ role: 'coach', resource: 'teams', action: 'create', allowed: true }]);
    const { result } = renderHook(() => useCanDo());
    await waitFor(() => expect(result.current.can('teams', 'create')).toBe(true));
  });

  it('matrice chargée : refuse une permission absente pour ce rôle', async () => {
    mockRole('player', { detectedRole: 'player' });
    // la matrice n'a que le coach → player n'a pas la permission
    mockMatrix([{ role: 'coach', resource: 'teams', action: 'create', allowed: true }]);
    const { result } = renderHook(() => useCanDo());
    // passe de fail-open (true) à false une fois la matrice chargée
    await waitFor(() => expect(result.current.can('teams', 'create')).toBe(false));
  });

  it('matrice chargée : refuse quand allowed=false explicite', async () => {
    mockRole('supporter', { detectedRole: 'supporter' });
    mockMatrix([{ role: 'supporter', resource: 'teams', action: 'create', allowed: false }]);
    const { result } = renderHook(() => useCanDo());
    await waitFor(() => expect(result.current.can('teams', 'create')).toBe(false));
  });

  it('admin EN SIMULATION : pas de bypass, soumis à la matrice', async () => {
    // detectedRole=admin mais isSimulating → le simulateur doit voir les vraies restrictions
    mockRole('player', { isSimulating: true, detectedRole: 'admin' });
    mockMatrix([{ role: 'player', resource: 'events', action: 'create', allowed: false }]);
    const { result } = renderHook(() => useCanDo());
    await waitFor(() => expect(result.current.can('events', 'create')).toBe(false));
  });

  it('expose role et isSimulating', () => {
    mockRole('coach', { isSimulating: true, detectedRole: 'coach' });
    mockMatrix([]);
    const { result } = renderHook(() => useCanDo());
    expect(result.current.role).toBe('coach');
    expect(result.current.isSimulating).toBe(true);
  });
});
