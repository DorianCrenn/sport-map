import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockFrom, mockChannel } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockChannel: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from:          mockFrom,
    channel:       mockChannel,
    removeChannel: vi.fn().mockResolvedValue(undefined),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: null,
    isAdmin: false,
    isClubAdmin: false,
    isLoggedIn: false,
    followClub:      vi.fn(),
    updateFollow:    vi.fn(),
    unfollowClub:    vi.fn(),
    isFollowingClub: () => false,
    getFollow:       () => null,
  }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../contexts/SportsContext.jsx', () => ({
  useSports: () => ({ allSports: {} }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn() }),
  useMotionValue: (v) => ({ get: () => v, set: vi.fn() }),
  useTransform: () => 0,
}));

// Mock all heavy sub-components to keep tests fast
vi.mock('../../components/club/ClubHero.jsx', () => ({
  default: ({ club }) => <div data-testid="club-hero">{club?.name}</div>,
  OverflowMenu: () => <div data-testid="overflow-menu" />,
}));
vi.mock('../../components/club/ClubAdminDrawer.jsx', () => ({
  default: () => <div data-testid="admin-drawer" />,
}));
vi.mock('../../components/club/tabs/ClubHomeTab.jsx', () => ({
  default: () => <div data-testid="tab-accueil">Accueil</div>,
}));
vi.mock('../../components/club/tabs/ClubNewsTab.jsx', () => ({
  default: () => <div data-testid="tab-news">Actualités</div>,
}));
vi.mock('../../components/club/tabs/ClubMatchesTab.jsx', () => ({
  default: () => <div data-testid="tab-matchs">Matchs</div>,
}));
vi.mock('../../components/club/tabs/ClubRosterTab.jsx', () => ({
  default: () => <div data-testid="tab-effectif">Effectif</div>,
}));
vi.mock('../../components/club/tabs/ClubInfoTab.jsx', () => ({
  default: () => <div data-testid="tab-infos">Infos</div>,
}));
vi.mock('../../components/club/FollowModal.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/FollowModal.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/SendAnnouncementModal.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubFormModal.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/QuickAddTeamModal.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/ui/SubscriptionExpiryBanner.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubManagersPanel.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubDashboard.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubRosterPanel.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubSponsorsPanel.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/club/ClubPageBuilder.jsx', () => ({
  getRows: () => [],
}));
vi.mock('../../utils/exportICS.js', () => ({
  downloadClubICS: vi.fn(),
}));

vi.mock('../../hooks/useClubPage.js', () => ({
  useClubPage: () => ({
    page: null, loading: false,
    blocks: [],
    updateBlock: vi.fn(), setBlockSpan: vi.fn(), moveBlockInRow: vi.fn(),
    deleteBlock: vi.fn(), reorderRows: vi.fn(), toggleBlock: vi.fn(),
    typography: {}, theme: { accent: '#22C55E', primary: '#1a1a2e', heroStyle: 'solid' },
    savePage: vi.fn(),
  }),
  useClubAnalytics: () => ({}),
  getHeroBackground: () => '#1a1a2e',
}));
vi.mock('../../hooks/useClubAnnouncements.js', () => ({
  useClubAnnouncements: () => ({ announcements: [], unread: 0 }),
}));
vi.mock('../../hooks/useClubManagers.js', () => ({
  useClubManagers: () => ({ managers: [], isManager: () => false, addManager: vi.fn(), removeManager: vi.fn(), updateManagerRole: vi.fn() }),
}));
vi.mock('../../hooks/useClubTrainings.js', () => ({
  useClubTrainings: () => [[], vi.fn()],
}));
vi.mock('../../hooks/useClubEvents.js', () => ({
  useClubEvents: () => [],
}));
vi.mock('../../hooks/useClubPlan.js', () => ({
  useClubPlan: () => ({ plan: 'free', hasPremium: false }),
}));
vi.mock('../../hooks/useShare.js', () => ({
  useShare: () => ({ share: vi.fn() }),
}));
vi.mock('../../hooks/useDynamicMeta.js', () => ({
  useDynamicMeta: vi.fn(),
}));
vi.mock('../../hooks/useAndroidBack.js', () => ({
  useAndroidBack: vi.fn(),
}));
vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({ allSports: {} }),
}));

import { makeQuery, makeChannel } from '../../test/mocks/supabase.js';
import ClubPageView from '../../components/club/ClubPageView.jsx';

// ── Fixture ───────────────────────────────────────────────────────────────────

const CLUB = {
  id: 'club-42',
  name: 'Stade Brestois',
  sport: 'Football',
  city: 'Brest',
  logo: null,
  accentColor: '#ef4444',
  categories: [{ name: 'Seniors' }],
};

function renderView(club = CLUB) {
  return render(
    <ClubPageView
      club={club}
      allEvents={[]}
      onClose={vi.fn()}
      onAddEvent={vi.fn()}
      canAddEvent={false}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(makeQuery({ data: [], error: null }));
  mockChannel.mockReturnValue(makeChannel());
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClubPageView — rendu initial', () => {
  it('affiche le nom du club via ClubHero', () => {
    renderView();
    expect(screen.getByTestId('club-hero')).toHaveTextContent('Stade Brestois');
  });

  it('affiche les 6 tabs de navigation', () => {
    renderView();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(6);
    const labels = tabs.map(t => t.textContent);
    expect(labels).toContain('Accueil');
    expect(labels).toContain('Actualités');
    expect(labels).toContain('Matchs');
    expect(labels).toContain('Saison');
    expect(labels).toContain('Effectif');
    expect(labels).toContain('Infos');
  });

  it('affiche le tab Accueil par défaut', () => {
    renderView();
    expect(screen.getByTestId('tab-accueil')).toBeInTheDocument();
  });
});

describe('ClubPageView — navigation entre tabs', () => {
  it('switch vers tab Matchs au clic', async () => {
    renderView();
    const matchsTab = screen.getByRole('tab', { name: /matchs/i });
    fireEvent.click(matchsTab);
    await waitFor(() => expect(screen.getByTestId('tab-matchs')).toBeInTheDocument());
  });

  it('switch vers tab Effectif au clic', async () => {
    renderView();
    fireEvent.click(screen.getByRole('tab', { name: /effectif/i }));
    await waitFor(() => expect(screen.getByTestId('tab-effectif')).toBeInTheDocument());
  });

  it('switch vers tab Infos au clic', async () => {
    renderView();
    fireEvent.click(screen.getByRole('tab', { name: /infos/i }));
    await waitFor(() => expect(screen.getByTestId('tab-infos')).toBeInTheDocument());
  });

  it('switch vers tab Actualités au clic', async () => {
    renderView();
    fireEvent.click(screen.getByRole('tab', { name: /actualités/i }));
    await waitFor(() => expect(screen.getByTestId('tab-news')).toBeInTheDocument());
  });
});

describe('ClubPageView — tab aria-selected', () => {
  it('tab actif a aria-selected=true', () => {
    renderView();
    const accueilTab = screen.getByRole('tab', { name: /accueil/i });
    expect(accueilTab).toHaveAttribute('aria-selected', 'true');
  });

  it('tab inactif a aria-selected=false', () => {
    renderView();
    const matchsTab = screen.getByRole('tab', { name: /matchs/i });
    expect(matchsTab).toHaveAttribute('aria-selected', 'false');
  });
});

describe('ClubPageView — guard club valide requis', () => {
  it('club avec toutes les props requises se monte sans crash', () => {
    expect(() => renderView({
      ...CLUB,
      userId: 'user-owner',
    })).not.toThrow();
  });
});
