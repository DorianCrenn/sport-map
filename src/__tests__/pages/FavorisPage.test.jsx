import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseAuth, mockUseFavoritesContext, mockUseAttendance } = vi.hoisted(() => ({
  mockUseAuth:            vi.fn(),
  mockUseFavoritesContext: vi.fn(),
  mockUseAttendance:      vi.fn(),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));
vi.mock('../../contexts/FavoritesContext.jsx', () => ({ useFavoritesContext: mockUseFavoritesContext }));
vi.mock('../../contexts/AttendanceContext.jsx', () => ({ useAttendanceContext: mockUseAttendance }));

// Tabs enfants — mockés pour simplifier
vi.mock('../../pages/favoris/MatchsTab.jsx', () => ({
  default: ({ favoriteEvents }) => (
    <div data-testid="matchs-tab">{favoriteEvents.length} matchs favoris</div>
  ),
}));
vi.mock('../../pages/favoris/ClubsTab.jsx', () => ({
  default: () => <div data-testid="clubs-tab">Clubs tab</div>,
}));
vi.mock('../../pages/favoris/CalendarTab.jsx', () => ({
  default: () => <div data-testid="calendar-tab">Calendar tab</div>,
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import FavorisPage from '../../pages/FavorisPage.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PAST_EVENT  = { id: 'e1', date: new Date(Date.now() - 3600_000).toISOString(), sport: 'Football' };
const FUTURE_EVENT = { id: 'e2', date: new Date(Date.now() + 3600_000).toISOString(), sport: 'Football' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FavorisPage — état vide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ follows: [], unfollowClub: vi.fn(), updateFollow: vi.fn() });
    mockUseFavoritesContext.mockReturnValue({ favorites: new Set(), toggleFavorite: vi.fn() });
    mockUseAttendance.mockReturnValue({ isAttending: () => false, toggle: vi.fn() });
  });

  it('affiche l\'état vide si aucun favori et aucun suivi de club', () => {
    render(<FavorisPage allEvents={[]} allClubs={[]} onNavigate={vi.fn()} />);
    expect(screen.getByText('Rien de sauvegardé')).toBeDefined();
  });

  it('affiche les boutons de navigation dans l\'état vide', () => {
    render(<FavorisPage allEvents={[]} allClubs={[]} onNavigate={vi.fn()} />);
    expect(screen.getByText(/Découvrir les clubs/i)).toBeDefined();
    expect(screen.getByText(/Voir les événements/i)).toBeDefined();
  });

  it('appelle onNavigate("clubs") sur le bouton clubs', () => {
    const onNavigate = vi.fn();
    render(<FavorisPage allEvents={[]} allClubs={[]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText(/Découvrir les clubs/i));
    expect(onNavigate).toHaveBeenCalledWith('clubs');
  });
});

describe('FavorisPage — avec des favoris', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ follows: [{ clubId: 'c1' }], unfollowClub: vi.fn(), updateFollow: vi.fn() });
    mockUseFavoritesContext.mockReturnValue({
      favorites: new Set(['e1', 'e2']),
      toggleFavorite: vi.fn(),
    });
    mockUseAttendance.mockReturnValue({ isAttending: () => false, toggle: vi.fn() });
  });

  it('affiche les 3 onglets (Matchs, Clubs, Agenda)', () => {
    render(<FavorisPage allEvents={[PAST_EVENT, FUTURE_EVENT]} allClubs={[]} onNavigate={vi.fn()} />);
    expect(screen.getByRole('tab', { name: /Matchs/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Clubs/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Agenda/i })).toBeDefined();
  });

  it('affiche le contenu de l\'onglet Matchs par défaut', () => {
    render(<FavorisPage allEvents={[PAST_EVENT, FUTURE_EVENT]} allClubs={[]} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('matchs-tab')).toBeDefined();
    expect(screen.queryByTestId('clubs-tab')).toBeNull();
  });

  it('affiche le tab Clubs après clic sur l\'onglet', () => {
    render(<FavorisPage allEvents={[PAST_EVENT, FUTURE_EVENT]} allClubs={[]} onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: /Clubs/i }));
    expect(screen.getByTestId('clubs-tab')).toBeDefined();
    expect(screen.queryByTestId('matchs-tab')).toBeNull();
  });

  it('l\'onglet actif a aria-selected=true', () => {
    render(<FavorisPage allEvents={[PAST_EVENT, FUTURE_EVENT]} allClubs={[]} onNavigate={vi.fn()} />);
    const matchsTab = screen.getByRole('tab', { name: /Matchs/i });
    expect(matchsTab.getAttribute('aria-selected')).toBe('true');
  });

  it('l\'onglet inactif a aria-selected=false', () => {
    render(<FavorisPage allEvents={[PAST_EVENT, FUTURE_EVENT]} allClubs={[]} onNavigate={vi.fn()} />);
    const clubsTab = screen.getByRole('tab', { name: /Clubs/i });
    expect(clubsTab.getAttribute('aria-selected')).toBe('false');
  });
});
