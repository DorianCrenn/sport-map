import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const { mockUseClubDashboard, convocDataRef } = vi.hoisted(() => ({
  mockUseClubDashboard: vi.fn(),
  convocDataRef: { current: [] },
}));

// Mock supabase — chainable + thenable pour couvrir tous les patterns d'accès
vi.mock('../../lib/supabase.js', () => {
  function makeChain(resolveWith) {
    const chain = {
      select:      () => chain,
      eq:          () => chain,
      neq:         () => chain,
      gte:         () => chain,
      lte:         () => chain,
      in:          () => chain,
      order:       () => chain,
      limit:       () => chain,
      single:      () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      // thenable : permet "await supabase.from(...).select(...)"
      then:        (resolve) => Promise.resolve(resolveWith()).then(resolve),
    };
    // surcharge gte pour les convocations
    chain.gte = () => Promise.resolve(resolveWith());
    return chain;
  }

  return {
    isDemoMode: () => false,
    setDemoMode: () => {},
    supabase: {
      from: (table) => makeChain(() => ({
        data: table === 'convocation_reply_tokens' ? convocDataRef.current : [],
        error: null,
      })),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null } }),
      },
    },
  };
});

vi.mock('../../hooks/useClubDashboard.js',    () => ({ useClubDashboard: mockUseClubDashboard }));
vi.mock('../../hooks/useClubBrandKit.js',     () => ({ useClubBrandKit: () => ({ brandKit: null }) }));
vi.mock('../../hooks/useClubAnnouncements.js',() => ({ useClubAnnouncements: () => ({ announcements: [], sendAnnouncement: vi.fn() }) }));
vi.mock('../../hooks/useClubFeatures.js', () => ({
  useClubFeatures: () => ({
    loading: false, can: () => true,
    planId: 'free', nextPlanId: 'club',
    planMeta: { name: 'Gratuit', badge: '🆓', color: '#64748b' },
    nextPlanMeta: { name: 'Club', badge: '⭐', color: '#22c55e' },
    isUpgradeable: true, periodEnd: null,
  }),
}));
vi.mock('../../hooks/useClubChallenges.js', () => ({
  useClubChallenges: () => ({
    challenges: [], received: [], sent: [], pendingReceived: [], loading: false,
    sendChallenge: vi.fn(), respond: vi.fn(),
  }),
}));
vi.mock('../../hooks/useClubTrainings.js', () => ({ useClubTrainings: () => [[], vi.fn()] }));
vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: () => ({ userClubs: [], updateClub: vi.fn(), addClub: vi.fn(), deleteClub: vi.fn() }),
}));

vi.mock('../../constants/zIndex.js', () => ({ Z: { modal: 1200 } }));

vi.mock('../../components/club/PromoteFeedModal.jsx', () => ({
  FeaturedSection: () => <div data-testid="featured-section" />,
  default:         () => null,
}));

vi.mock('../../components/club/SendAnnouncementModal.jsx', () => ({
  default: () => <div data-testid="send-announcement-modal" />,
}));

vi.mock('../../components/AnnouncementCard.jsx', () => ({
  default: ({ announcement }) => (
    <div data-testid="announcement-card">{announcement.title}</div>
  ),
}));

vi.mock('../../components/ui/UpgradeDiff.jsx',          () => ({ default: () => null }));
vi.mock('../../components/ui/PlansMiniModal.jsx',        () => ({ default: () => null }));
vi.mock('../../components/ui/SubscriptionExpiryBanner.jsx', () => ({ default: () => null }));
vi.mock('../../lib/planHelpers.ts',                      () => ({ canUseFeature: () => true }));
vi.mock('../../lib/demoDataGenerator.js', () => ({
  hasDemoData:    vi.fn(() => Promise.resolve(false)),
  deleteDemoData: vi.fn(() => Promise.resolve()),
}));

import ClubDashboard from '../../components/club/ClubDashboard.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CLUB = {
  id: 'c-1', name: 'FC Brest', sport: 'Football', city: 'Brest',
  categories: [{ id: 'cat-1', name: 'Seniors', teams: [] }],
};

function emptyData(overrides = {}) {
  return {
    loading: false,
    followers: 0,
    pageViews:  { total: 0, weekly: 0, distinctViewers: 0, byWeek: [] },
    attendees:  { total: 0, topEvents: [] },
    posterExports: 0,
    posterShares:  0,
    scheduledAnnouncements: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseClubDashboard.mockReturnValue(emptyData());
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClubDashboard — rendu', () => {
  it('se monte sans crash', () => {
    expect(() => render(
      <ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />
    )).not.toThrow();
  });

  it('affiche le nom du club dans le titre', () => {
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    // Le nom peut apparaître plusieurs fois (titre + ClubInvitePanel)
    expect(screen.getAllByText('FC Brest').length).toBeGreaterThan(0);
  });

  it('appelle onClose au clic sur le bouton fermer', () => {
    const onClose = vi.fn();
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={onClose} onArchiveSeason={vi.fn()} />);
    const closeBtns = screen.getAllByRole('button', { name: /fermer|close|retour/i });
    fireEvent.click(closeBtns[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ClubDashboard — stats', () => {
  it('affiche les abonnés', () => {
    mockUseClubDashboard.mockReturnValue(emptyData({ followers: 42 }));
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('affiche les vues de page', () => {
    mockUseClubDashboard.mockReturnValue(emptyData({
      pageViews: { total: 150, weekly: 30, distinctViewers: 45, byWeek: [] },
    }));
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('affiche le compteur de présences', () => {
    mockUseClubDashboard.mockReturnValue(emptyData({
      attendees: { total: 99, topEvents: [] },
    }));
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    expect(screen.getByText('99')).toBeInTheDocument();
  });
});

describe('ClubDashboard — état vide', () => {
  it('se monte sans crash quand toutes les stats sont à 0', () => {
    const { container } = render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    expect(container.children.length).toBeGreaterThan(0);
  });
});

describe('ClubDashboard — annonces planifiées', () => {
  it('se monte avec des annonces planifiées sans crash', () => {
    mockUseClubDashboard.mockReturnValue(emptyData({
      scheduledAnnouncements: [{
        id: 's-1', title: 'Annonce planifiée', type: 'event',
        scheduled_for: '2026-07-15T10:00:00Z', message: 'Test',
      }],
    }));
    const { container } = render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    expect(container.children.length).toBeGreaterThan(0);
  });
});

// ── Tests — stats convocations ────────────────────────────────────────────────

describe('ClubDashboard — widget convocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClubDashboard.mockReturnValue(emptyData());
    convocDataRef.current = [];
  });

  it('n\'affiche pas le widget si aucune convocation (total=0)', async () => {
    convocDataRef.current = [];
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    await waitFor(() => {}, { timeout: 100 });
    expect(screen.queryByText(/Convocations/i)).not.toBeInTheDocument();
  });

  it('affiche le widget quand des convocations existent', async () => {
    convocDataRef.current = [
      { reply_status: 'accepted' },
      { reply_status: 'declined' },
      { reply_status: null },
    ];
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Convocations/i)).toBeInTheDocument());
  });

  it('affiche le bon décompte de présents', async () => {
    convocDataRef.current = [
      { reply_status: 'accepted' },
      { reply_status: 'accepted' },
      { reply_status: 'declined' },
    ];
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Présents/i)).toBeInTheDocument());
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('affiche le total correct', async () => {
    convocDataRef.current = [
      { reply_status: 'accepted' },
      { reply_status: null },
      { reply_status: null },
    ];
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });

  it('affiche le décompte "Sans réponse"', async () => {
    convocDataRef.current = [
      { reply_status: 'accepted' },
      { reply_status: null },
      { reply_status: null },
    ];
    render(<ClubDashboard club={CLUB} clubEventIds={[]} allEvents={[]} onClose={vi.fn()} onArchiveSeason={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/Sans réponse/i)).toBeInTheDocument());
  });
});
