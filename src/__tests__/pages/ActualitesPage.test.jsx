import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// ── Mocks globaux ─────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
    button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      neq:    vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      not:    vi.fn().mockReturnThis(),
      gte:    vi.fn().mockReturnThis(),
      lte:    vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      then:   (fn) => Promise.resolve({ data: [], error: null }).then(fn),
    })),
    channel:       vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
  isDemoMode: vi.fn().mockReturnValue(false),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { id: 'u1', name: 'User Test', job_role: null },
    isAdmin:     false,
    isClubAdmin: false,
  }),
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../hooks/useManagedClubs.js',   () => ({ useManagedClubs:   () => ({ managedClubs: [], isCoachOrManager: false, isCommunicant: false }) }));
vi.mock('../../hooks/useMyConvocations.js', () => ({ useMyConvocations: () => ({ convocations: [], pendingCount: 0, respond: vi.fn() }) }));
vi.mock('../../hooks/useQuickActions.js',   () => ({ useQuickActions:   () => ({ actions: [], hasActions: false, liveMatches: [] }) }));
vi.mock('../../hooks/useDemoFeed.js',       () => ({ useDemoFeed:       () => ({ demoConvocations: [], setDemoConvocations: vi.fn(), demoLiveMatches: [] }) }));
vi.mock('../../hooks/useClubs.js',          () => ({ useClubs:          () => ({ userClubs: [], loading: false }) }));

// PlanningTimeline remplace ClubFeed en Zone 3
vi.mock('../../components/planning/PlanningTimeline.jsx', () => ({
  default: () => <div data-testid="planning-timeline">Planning</div>,
}));

vi.mock('../../components/home/QuickActionsSection.jsx', () => ({
  default: () => null,
}));
vi.mock('../../components/home/LiveMultiplexSection.jsx', () => ({
  default: () => <div data-testid="live-multiplex" />,
}));
vi.mock('../../components/home/ParentConvocationCard.jsx', () => ({
  default: () => <div data-testid="parent-card" />,
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
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it('affiche PlanningTimeline en Zone 3', async () => {
    render(
      <ActualitesPage
        followedClubIds={['club-1']}
        onNavigate={vi.fn()}
        onOpenTrainings={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByTestId('planning-timeline')).toBeInTheDocument());
  });

  it('ne crash pas sans followedClubIds', () => {
    expect(() => render(<ActualitesPage onNavigate={vi.fn()} />)).not.toThrow();
  });

  it('affiche le multiplex en direct (Zone 2)', async () => {
    render(<ActualitesPage followedClubIds={[]} onNavigate={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId('live-multiplex')).toBeInTheDocument());
  });
});

describe('ActualitesPage — convocations parent', () => {
  it('monte sans crash avec une convocation en attente', async () => {
    const { container } = render(
      <ActualitesPage
        followedClubIds={[]}
        onNavigate={vi.fn()}
        externalConvocations={[{ id: 'c1', status: 'pending' }]}
        onConvocationRespond={vi.fn()}
      />
    );
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it('PlanningTimeline reste visible même avec convocations en attente', async () => {
    render(
      <ActualitesPage
        followedClubIds={[]}
        onNavigate={vi.fn()}
        externalConvocations={[{ id: 'c1', status: 'pending' }]}
        onConvocationRespond={vi.fn()}
      />
    );
    await waitFor(() => expect(screen.getByTestId('planning-timeline')).toBeInTheDocument());
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
