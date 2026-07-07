/**
 * Tests AdminPage — onglet Clubs (workflow de vérification)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: mockFrom,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'tok' } } }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {} }),
    },
  },
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({
    isAdmin: true,
    currentUser: { id: 'admin-1', name: 'Admin Test' },
  })),
}));

vi.mock('../../hooks/useClubs.js', () => ({
  useClubs: vi.fn(() => ({
    userClubs: [],
    verifyClub: vi.fn().mockResolvedValue(),
    rejectClub: vi.fn().mockResolvedValue(),
    requestClubInfo: vi.fn().mockResolvedValue(),
    suspendClub: vi.fn().mockResolvedValue(),
  })),
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({
    allSports: { Football: { id: 'Football', label: 'Football', color: '#22C55E' } },
    customSports: [],
    deletedDefaults: [],
    addSport: vi.fn(),
    updateSport: vi.fn(),
    deleteSport: vi.fn(),
    restoreSport: vi.fn(),
    toggleArchive: vi.fn(),
  }),
}));

vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));
vi.mock('../../components/sportIcons.js', () => ({
  SPORT_ICON_OPTIONS: [],
  SPORT_ICONS: {},
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

function makeChain(result) {
  const p = Promise.resolve(result);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    head: vi.fn().mockReturnThis(),
    then: (fn, rej) => p.then(fn, rej),
    catch: (fn) => p.catch(fn),
  };
}

import AdminPage from '../../pages/AdminPage.jsx';
import { useClubs } from '../../hooks/useClubs.js';

const PENDING_CLUB = {
  id: 'club-1',
  name: 'FC Plouvorn',
  sport: 'Football',
  city: 'Plouvorn',
  status: 'pending_verification',
  manager_name: 'Hervé Tanguy',
  created_at: '2026-06-03T10:00:00',
  logo_url: null,
};

function renderAdmin() {
  return render(<AdminPage />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminPage — onglet Clubs', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    // Stats queries (3 count queries)
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))   // clubs pending
      .mockReturnValueOnce(makeChain({ count: 5, error: null }))   // clubs verified
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))   // clubs rejected
      .mockReturnValueOnce(makeChain({ count: 12, error: null })); // profiles users
  });

  it('affiche onglet Clubs dans la navigation', () => {
    renderAdmin();
    expect(screen.getByRole('button', { name: /Clubs/i })).toBeDefined();
  });

  it('affiche le compteur de clubs en attente dans onglet', async () => {
    renderAdmin();
    await waitFor(() => {
      expect(screen.getByText(/Clubs \(1\)/i)).toBeDefined();
    });
  });

  it('affiche la liste des clubs pending quand on clique sur onglet', async () => {
    // Tous les appels from() après les stats → retournent la liste de clubs
    mockFrom.mockReturnValue(makeChain({ data: [PENDING_CLUB], error: null }));

    renderAdmin();
    const clubsTab = screen.getByRole('button', { name: /Clubs/i });
    fireEvent.click(clubsTab);

    await waitFor(() => {
      expect(screen.getByText('FC Plouvorn')).toBeDefined();
    }, { timeout: 3000 });
  });

  it('affiche les actions inline quand on clique Examiner', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [PENDING_CLUB], error: null }));

    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Clubs/i }));
    await waitFor(() => screen.getByText('FC Plouvorn'));

    fireEvent.click(screen.getByRole('button', { name: /Examiner/i }));

    expect(screen.getByRole('button', { name: /Vérifier/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Refuser/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Infos/i })).toBeDefined();
  });

  it('appelle verifyClub et invoque la notification sur clic Vérifier', async () => {
    const mockVerify = vi.fn().mockResolvedValue();
    useClubs.mockReturnValue({
      userClubs: [],
      verifyClub: mockVerify,
      rejectClub: vi.fn(),
      requestClubInfo: vi.fn(),
      suspendClub: vi.fn(),
    });

    mockFrom.mockReturnValue(makeChain({ data: [PENDING_CLUB], error: null }));

    renderAdmin();
    fireEvent.click(screen.getByRole('button', { name: /Clubs/i }));
    await waitFor(() => screen.getByText('FC Plouvorn'));

    fireEvent.click(screen.getByRole('button', { name: /Examiner/i }));
    fireEvent.click(screen.getByRole('button', { name: /Vérifier/i }));

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith('club-1', '');
    });
  });
});

describe('AdminPage — admin connecte', () => {
  it('affiche le titre Administration si admin', () => {
    renderAdmin();
    expect(screen.getByText(/Administration/i)).toBeDefined();
  });
});
