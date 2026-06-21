import { describe, it, expect } from 'vitest';

// ── Helpers de test ───────────────────────────────────────────────────────────

// Dériver les booléens de rôle comme dans AuthContext
function deriveRoles(role) {
  const isAdmin     = role === 'admin' || role === 'superadmin';
  const isClubAdmin = role === 'club_admin';
  return { isAdmin, isClubAdmin, isLoggedIn: true };
}

// Simuler l'override de rôle démo (logique d'AuthContext avec demoProfileType)
function deriveRolesWithDemoOverride(baseRole, demoProfileType, isDemoMode) {
  const NON_ADMIN_DEMO_PROFILES = ['parent', 'player', 'supporter'];
  const effectiveRole =
    isDemoMode && NON_ADMIN_DEMO_PROFILES.includes(demoProfileType)
      ? 'user'
      : baseRole;
  return deriveRoles(effectiveRole);
}

// ── Rôles de base ─────────────────────────────────────────────────────────────

describe('deriveRoles — rôles standard', () => {
  it('club_admin → isClubAdmin = true, isAdmin = false', () => {
    const { isAdmin, isClubAdmin } = deriveRoles('club_admin');
    expect(isClubAdmin).toBe(true);
    expect(isAdmin).toBe(false);
  });

  it('user → isClubAdmin = false, isAdmin = false', () => {
    const { isAdmin, isClubAdmin } = deriveRoles('user');
    expect(isClubAdmin).toBe(false);
    expect(isAdmin).toBe(false);
  });

  it('admin → isAdmin = true, isClubAdmin = false', () => {
    const { isAdmin, isClubAdmin } = deriveRoles('admin');
    expect(isAdmin).toBe(true);
    expect(isClubAdmin).toBe(false);
  });

  it('superadmin → isAdmin = true', () => {
    const { isAdmin } = deriveRoles('superadmin');
    expect(isAdmin).toBe(true);
  });

  it('undefined → isAdmin = false, isClubAdmin = false', () => {
    const { isAdmin, isClubAdmin } = deriveRoles(undefined);
    expect(isAdmin).toBe(false);
    expect(isClubAdmin).toBe(false);
  });
});

// ── Override démo ─────────────────────────────────────────────────────────────

describe('deriveRolesWithDemoOverride — profils démo', () => {
  const BASE_ROLE = 'club_admin';

  it('president en démo → conserve club_admin', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'president', true);
    expect(isClubAdmin).toBe(true);
  });

  it('coach en démo → conserve club_admin', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'coach', true);
    expect(isClubAdmin).toBe(true);
  });

  it('communication en démo → conserve club_admin', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'communication', true);
    expect(isClubAdmin).toBe(true);
  });

  it('parent en démo → role user → isClubAdmin = false', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'parent', true);
    expect(isClubAdmin).toBe(false);
  });

  it('player en démo → role user → isClubAdmin = false', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'player', true);
    expect(isClubAdmin).toBe(false);
  });

  it('supporter en démo → role user → isClubAdmin = false', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'supporter', true);
    expect(isClubAdmin).toBe(false);
  });

  it('isDemoMode = false → pas d\'override', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, 'parent', false);
    expect(isClubAdmin).toBe(true);
  });

  it('demoProfileType = null → pas d\'override', () => {
    const { isClubAdmin } = deriveRolesWithDemoOverride(BASE_ROLE, null, true);
    expect(isClubAdmin).toBe(true);
  });
});

// ── canAddEvent (logique app) ─────────────────────────────────────────────────

describe('canAddEvent — règles de création d\'événement', () => {
  function canAddEvent({ isAdmin, isClubAdmin, clubId }) {
    return isAdmin || (isClubAdmin && !!clubId);
  }

  it('admin → peut créer même sans clubId', () => {
    expect(canAddEvent({ isAdmin: true, isClubAdmin: false, clubId: null })).toBe(true);
  });

  it('club_admin avec clubId → peut créer', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: true, clubId: 'club-001' })).toBe(true);
  });

  it('club_admin sans clubId → ne peut pas créer', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: true, clubId: null })).toBe(false);
  });

  it('user → ne peut pas créer', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: false, clubId: 'club-001' })).toBe(false);
  });

  it('parent en démo (role user) → ne peut pas créer', () => {
    const roles = deriveRolesWithDemoOverride('club_admin', 'parent', true);
    expect(canAddEvent({ ...roles, clubId: 'demo-club-001' })).toBe(false);
  });

  it('president en démo (role club_admin) → peut créer', () => {
    const roles = deriveRolesWithDemoOverride('club_admin', 'president', true);
    expect(canAddEvent({ ...roles, clubId: 'demo-club-001' })).toBe(true);
  });
});

// ── FAB actions visibles ──────────────────────────────────────────────────────

describe('FAB actions visibles selon le rôle', () => {
  function getFabActions(isAdmin, isClubAdmin) {
    const isClubAdminOnly = isClubAdmin && !isAdmin;
    const canFab = isAdmin || isClubAdminOnly;
    const adminActions = canFab ? [
      'dashboard', 'edit-page', 'event', 'announce', 'edit-info',
      'add-team', 'managers', 'roster', 'sponsors',
    ] : [];
    return adminActions;
  }

  it('club_admin → toutes les actions FAB visibles', () => {
    const actions = getFabActions(false, true);
    expect(actions).toContain('dashboard');
    expect(actions).toContain('event');
    expect(actions).toContain('announce');
  });

  it('user (parent/player/supporter) → aucune action FAB admin', () => {
    const actions = getFabActions(false, false);
    expect(actions.length).toBe(0);
  });

  it('admin → toutes les actions FAB (via isClubAdminOnly = false mais canFab = true)', () => {
    const actions = getFabActions(true, false);
    // admin a aussi canFab
    expect(actions.length).toBeGreaterThan(0);
  });
});

// ── canAddEvent étendu aux coaches/managers (P0-2) ────────────────────────────

describe('canAddEvent — avec isCoachOrManager (P0-2)', () => {
  function canAddEvent({ isAdmin, isClubAdmin, isCoachOrManager }) {
    return isAdmin || isClubAdmin || isCoachOrManager;
  }

  it('coach avec club géré → peut créer un événement', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: false, isCoachOrManager: true })).toBe(true);
  });

  it('manager avec club géré → peut créer un événement', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: false, isCoachOrManager: true })).toBe(true);
  });

  it('user sans club géré → ne peut pas créer', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: false, isCoachOrManager: false })).toBe(false);
  });

  it('admin → peut créer (court-circuit)', () => {
    expect(canAddEvent({ isAdmin: true, isClubAdmin: false, isCoachOrManager: false })).toBe(true);
  });

  it('club_admin → peut créer (court-circuit)', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: true, isCoachOrManager: false })).toBe(true);
  });

  it('tous false → interdit', () => {
    expect(canAddEvent({ isAdmin: false, isClubAdmin: false, isCoachOrManager: false })).toBe(false);
  });
});

// ── Tab Mon Club → ClubDashboard direct (P0-3) ────────────────────────────────

describe('handleTabChange mon-club — ouverture dashboard direct', () => {
  function getPendingAction(tab, isClubAdmin, isCoachOrManager) {
    if (tab !== 'mon-club') return null;
    return (isClubAdmin || isCoachOrManager) ? 'dashboard' : null;
  }

  it('club_admin → pendingAction = dashboard', () => {
    expect(getPendingAction('mon-club', true, false)).toBe('dashboard');
  });

  it('coach/manager → pendingAction = dashboard', () => {
    expect(getPendingAction('mon-club', false, true)).toBe('dashboard');
  });

  it('user standard → pas de pendingAction', () => {
    expect(getPendingAction('mon-club', false, false)).toBeNull();
  });

  it('autre tab → pas de pendingAction', () => {
    expect(getPendingAction('home', true, false)).toBeNull();
  });
});
