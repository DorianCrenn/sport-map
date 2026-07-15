import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUseAuthSafe = vi.hoisted(() => vi.fn());
const mockFrom        = vi.hoisted(() => vi.fn());

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuthSafe: mockUseAuthSafe,
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: { from: mockFrom },
  isDemoMode: vi.fn(() => false),
}));

// sessionStorage mock
const sessionStore: Record<string, string> = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem:    (k: string) => sessionStore[k] ?? null,
    setItem:    (k: string, v: string) => { sessionStore[k] = v; },
    removeItem: (k: string) => { delete sessionStore[k]; },
    clear:      () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); },
  },
  writable: true,
});

import { useMyRole } from '../../hooks/useMyRole.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNoUser() {
  mockUseAuthSafe.mockReturnValue({ currentUser: null, isAdmin: false, isClubAdmin: false });
}

function mockUser(override: { isAdmin?: boolean; isClubAdmin?: boolean } = {}) {
  mockUseAuthSafe.mockReturnValue({
    currentUser: { id: 'user-123' },
    isAdmin:     override.isAdmin     ?? false,
    isClubAdmin: override.isClubAdmin ?? false,
  });
}

function mockSupabaseRoles({ mgrRole = null as string | null, hasPlayer = false, hasGuardian = false } = {}) {
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      limit:  vi.fn().mockResolvedValue({
        data: table === 'club_managers' && mgrRole ? [{ role: mgrRole }]
            : table === 'club_players'  && hasPlayer  ? [{ id: '1' }]
            : table === 'player_guardians' && hasGuardian ? [{ id: '1' }]
            : [],
      }),
    };
    return chain;
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useMyRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('visiteur si pas d\'utilisateur connecté', () => {
    mockNoUser();
    const { result } = renderHook(() => useMyRole());
    expect(result.current.role).toBe('visitor');
    expect(result.current.isSimulating).toBe(false);
  });

  it('admin si currentUser et isAdmin=true', async () => {
    mockUser({ isAdmin: true });
    mockSupabaseRoles();
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('admin'));
    expect(result.current.role).toBe('admin');
  });

  it('club_admin si isClubAdmin=true', async () => {
    mockUser({ isClubAdmin: true });
    mockSupabaseRoles();
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('club_admin'));
    expect(result.current.role).toBe('club_admin');
  });

  it('coach si club_managers.role="coach"', async () => {
    mockUser();
    mockSupabaseRoles({ mgrRole: 'coach' });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('coach'));
    expect(result.current.role).toBe('coach');
  });

  it('club_manager si club_managers.role="manager"', async () => {
    mockUser();
    mockSupabaseRoles({ mgrRole: 'manager' });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('club_manager'));
  });

  it('club_admin si club_managers.role="owner" (n\'était pas géré → supporter avant)', async () => {
    mockUser();
    mockSupabaseRoles({ mgrRole: 'owner' });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('club_admin'));
  });

  it('communicant si club_managers.role="communicant"', async () => {
    mockUser();
    mockSupabaseRoles({ mgrRole: 'communicant' });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('communicant'));
  });

  it('club_manager si club_managers.role="editor"', async () => {
    mockUser();
    mockSupabaseRoles({ mgrRole: 'editor' });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('club_manager'));
  });

  it('player si club_players non vide', async () => {
    mockUser();
    mockSupabaseRoles({ hasPlayer: true });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('player'));
    expect(result.current.role).toBe('player');
  });

  it('parent si player_guardians non vide', async () => {
    mockUser();
    mockSupabaseRoles({ hasGuardian: true });
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('parent'));
  });

  it('supporter si aucun rôle spécifique trouvé', async () => {
    mockUser();
    mockSupabaseRoles();
    const { result } = renderHook(() => useMyRole());
    await waitFor(() => expect(result.current.detectedRole).toBe('supporter'));
    expect(result.current.role).toBe('supporter');
  });

  it('role simulé depuis sessionStorage prend le dessus', async () => {
    mockUser({ isAdmin: true });
    sessionStorage.setItem('sl-role-simulator', JSON.stringify({ role: 'visitor' }));
    const { result } = renderHook(() => useMyRole());
    expect(result.current.role).toBe('visitor');
    expect(result.current.isSimulating).toBe(true);
  });

  it('isSimulating=false sans sessionStorage', () => {
    mockNoUser();
    const { result } = renderHook(() => useMyRole());
    expect(result.current.isSimulating).toBe(false);
  });
});
