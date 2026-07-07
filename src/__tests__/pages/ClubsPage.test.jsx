import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ── Mocks (refs stables — un [] recréé à chaque rendu bouclerait) ──────────────

const { mockUseClubs } = vi.hoisted(() => ({ mockUseClubs: vi.fn() }));

const STABLE_SPORTS = { Football: { label: 'Football', color: '#16a34a' } };
const STABLE_AUTH = {
  currentUser: { id: 'u-1', favoriteSports: [], clubId: null },
  isAdmin: false, isClubAdmin: false,
  followClub: vi.fn(), unfollowClub: vi.fn(), isFollowingClub: () => false, refetchProfile: vi.fn(),
};
const STABLE_LB = { leaderboard: [] };

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/useSports.js', () => ({ useSports: () => ({ allSports: STABLE_SPORTS }) }));
vi.mock('../../hooks/useClubs.js', () => ({ useClubs: mockUseClubs }));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => STABLE_AUTH }));
vi.mock('../../hooks/useClubLeaderboard.js', () => ({ useClubLeaderboard: () => STABLE_LB }));
vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));
vi.mock('../../components/ConfirmDialog.jsx', () => ({ default: () => null }));
vi.mock('../../components/Skeleton.jsx', () => ({ SkeletonClubCard: () => <div data-testid="skeleton-club" /> }));
vi.mock('../../components/club/ClubPageView.jsx', () => ({ default: () => null }));
vi.mock('../../components/club/ClubCreationWizard.jsx', () => ({ default: () => null }));
vi.mock('../../components/club/ClubFormModal.jsx', () => ({ default: () => null }));
vi.mock('../../lib/demoDataGenerator.js', () => ({ generateDemoData: () => ({ clubs: [], events: [] }) }));

import ClubsPage from '../../pages/ClubsPage.jsx';

const EMPTY_CLUBS = { userClubs: [], loading: false, addClubAndNotify: vi.fn(), updateClub: vi.fn(), deleteClub: vi.fn() };
const NO_PROPS_EVENTS = [];

beforeEach(() => {
  mockUseClubs.mockReset();
  mockUseClubs.mockReturnValue(EMPTY_CLUBS);
});

describe('ClubsPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<ClubsPage allEvents={NO_PROPS_EVENTS} />)).not.toThrow();
  });

  it('affiche le champ de recherche de clubs', () => {
    render(<ClubsPage allEvents={NO_PROPS_EVENTS} />);
    expect(screen.getByPlaceholderText(/rechercher un club/i)).toBeInTheDocument();
  });

  it('affiche l\'état de chargement (skeletons) quand loading', () => {
    mockUseClubs.mockReturnValue({ ...EMPTY_CLUBS, userClubs: [], loading: true });
    render(<ClubsPage allEvents={NO_PROPS_EVENTS} />);
    expect(screen.getByLabelText(/chargement des clubs/i)).toBeInTheDocument();
  });

  it('affiche un club de la liste', async () => {
    mockUseClubs.mockReturnValue({
      ...EMPTY_CLUBS,
      userClubs: [{ id: 'c-1', name: 'FC SportLink Test', sport: 'Football', city: 'Brest' }],
    });
    render(<ClubsPage allEvents={NO_PROPS_EVENTS} />);
    await waitFor(() => expect(screen.getByText(/FC SportLink Test/)).toBeInTheDocument());
  });
});
