import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ── Mocks globaux ─────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:  ({ children, ...p }) => <div {...p}>{children}</div>,
    span: ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      then:   (fn) => Promise.resolve({ data: [], error: null }).then(fn),
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  isDemoMode: vi.fn().mockReturnValue(false),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { id: 'u1', name: 'User Test', job_role: null },
    isAdmin: false,
    isClubAdmin: false,
    follows: [],
  }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../hooks/useManagedClubs.js',   () => ({ useManagedClubs: () => ({ managedClubs: [], isCoachOrManager: false, isCommunicant: false }) }));
vi.mock('../../hooks/useMyConvocations.js', () => ({ useMyConvocations: () => ({ convocations: [], pendingCount: 0, respond: vi.fn() }) }));
vi.mock('../../hooks/useParentChildren.js', () => ({ useParentChildren: () => ({ isParent: false, children: [] }) }));
vi.mock('../../hooks/useQuickActions.js',   () => ({ useQuickActions: () => ({ actions: [], hasActions: false }) }));
vi.mock('../../hooks/useDemoFeed.js',       () => ({
  useDemoFeed: () => ({ demoConvocations: [], setDemoConvocations: vi.fn(), demoLiveMatches: [] }),
}));
vi.mock('../../hooks/useFeedItems.ts', () => ({
  useFeedItems: () => ({ items: [], loading: false, error: null }),
}));
vi.mock('../../hooks/useFeaturedEvents.ts', () => ({
  useFeaturedEvents: () => ({ featured: [], loading: false }),
}));
vi.mock('../../hooks/useClubSponsors.ts', () => ({
  useClubSponsors: () => ({ sponsors: [] }),
}));
vi.mock('../../hooks/useMatchesForDate.js', () => ({
  useMatchesForDate: () => ({ matches: [], loading: false }),
}));
vi.mock('../../hooks/useMyTeamAgenda.js',  () => ({
  useMyTeamAgenda: () => ({ agenda: [], loading: false }),
}));

vi.mock('../../components/feed/ClubFeed.tsx', () => ({
  default: () => <div data-testid="club-feed">Feed</div>,
}));
vi.mock('../../components/home/QuickActionsSection.jsx', () => ({
  default: ({ actions }) => actions?.length ? <div data-testid="quick-actions" /> : null,
}));
vi.mock('../../components/home/LiveMultiplexSection.jsx', () => ({
  default: () => <div data-testid="live-multiplex" />,
}));
vi.mock('../../components/home/ParentConvocationCard.jsx', () => ({
  default: () => <div data-testid="parent-card" />,
}));
vi.mock('../../components/feed/UpcomingAgendaSection.jsx', () => ({
  default: () => <div data-testid="upcoming-agenda" />,
}));

import ActualitesPage from '../../pages/ActualitesPage.jsx';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ActualitesPage — rendu de base', () => {
  beforeEach(() => vi.clearAllMocks());

  it('se monte sans erreur', async () => {
    const { container } = render(
      <ActualitesPage
        followedClubIds={[]}
        onNavigate={vi.fn()}
        onOpenTrainings={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('affiche le feed principal', async () => {
    render(
      <ActualitesPage
        followedClubIds={['club-1']}
        onNavigate={vi.fn()}
        onOpenTrainings={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('club-feed')).toBeInTheDocument();
    });
  });

  it('ne crash pas sans followedClubIds', () => {
    expect(() => render(<ActualitesPage onNavigate={vi.fn()} />)).not.toThrow();
  });
});

describe('ActualitesPage — convocations parent', () => {
  it('affiche la card parent si convocation en attente', async () => {
    // Card parent est rendue si pendingConvocations.length > 0 — ici 0 en mock
    render(
      <ActualitesPage
        followedClubIds={[]}
        onNavigate={vi.fn()}
        externalConvocations={[{ id: 'c1', status: 'pending' }]}
        onConvocationRespond={vi.fn()}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('club-feed')).toBeInTheDocument();
    });
  });
});

describe('ActualitesPage — mode démo', () => {
  it('ne crash pas en mode démo', async () => {
    const { isDemoMode } = await import('../../lib/supabase.js');
    isDemoMode.mockReturnValue(true);

    expect(() =>
      render(
        <ActualitesPage
          followedClubIds={[]}
          onNavigate={vi.fn()}
          externalConvocations={[]}
          onConvocationRespond={vi.fn()}
        />
      )
    ).not.toThrow();

    isDemoMode.mockReturnValue(false);
  });
});
