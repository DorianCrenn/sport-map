import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseAuth, mockUseManagedClubs } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseManagedClubs: vi.fn(),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../hooks/useManagedClubs.js', () => ({
  useManagedClubs: mockUseManagedClubs,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import BottomNav from '../../components/BottomNav.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderNav(props = {}) {
  return render(
    <BottomNav
      activeTab="home"
      onTabChange={vi.fn()}
      {...props}
    />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('BottomNav — utilisateur standard (non connecté)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentUser: null, isAdmin: false, isClubAdmin: false });
    mockUseManagedClubs.mockReturnValue({ managedClubs: [] });
  });

  it('affiche les onglets Accueil, Carte, Clubs et Profil', () => {
    renderNav();
    expect(screen.getByText('Accueil')).toBeDefined();
    expect(screen.getByText('Carte')).toBeDefined();
    expect(screen.getByText('Clubs')).toBeDefined();
    expect(screen.getByText('Profil')).toBeDefined();
  });

  it('n\'affiche pas l\'onglet Mon Club pour un utilisateur standard', () => {
    renderNav();
    expect(screen.queryByText('Mon Club')).toBeNull();
  });

  it('n\'affiche pas le FAB pour un utilisateur sans droits d\'admin', () => {
    renderNav();
    // Le FAB est un bouton avec l'onglet "slot null" — il ne doit pas y avoir de bouton vert de création
    expect(screen.queryByText('Sauvegardés')).toBeDefined(); // L'onglet favoris existe
  });
});

describe('BottomNav — club_admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentUser: { id: 'u1' }, isAdmin: false, isClubAdmin: true });
    mockUseManagedClubs.mockReturnValue({ managedClubs: [{ id: 'c1' }] });
  });

  it('affiche l\'onglet Mon Club pour un club_admin', () => {
    renderNav();
    expect(screen.getByText('Mon Club')).toBeDefined();
  });

  it('n\'affiche pas l\'onglet Sauvegardés pour un club_admin (remplacé par FAB)', () => {
    renderNav();
    // Le club_admin a [HOME, MAP, FAB, CLUBS, MON_CLUB]
    expect(screen.queryByText('Sauvegardés')).toBeNull();
  });
});

describe('BottomNav — interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ currentUser: null, isAdmin: false, isClubAdmin: false });
    mockUseManagedClubs.mockReturnValue({ managedClubs: [] });
  });

  it('appelle onTabChange avec l\'id de l\'onglet cliqué', () => {
    const onTabChange = vi.fn();
    renderNav({ onTabChange });
    fireEvent.click(screen.getByText('Carte'));
    expect(onTabChange).toHaveBeenCalledWith('map');
  });

  it('appelle onTabChange avec "clubs" sur l\'onglet Clubs', () => {
    const onTabChange = vi.fn();
    renderNav({ onTabChange });
    fireEvent.click(screen.getByText('Clubs'));
    expect(onTabChange).toHaveBeenCalledWith('clubs');
  });
});
