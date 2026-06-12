import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../hooks/useAndroidBack.js', () => ({ useAndroidBack: vi.fn() }));
vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: vi.fn() }));

const { mockUseMyAnnouncements } = vi.hoisted(() => ({ mockUseMyAnnouncements: vi.fn() }));

vi.mock('../../hooks/useMyAnnouncements.js', () => ({
  useMyAnnouncements: mockUseMyAnnouncements,
}));

vi.mock('../../components/AnnouncementCard.jsx', () => ({
  default: ({ ann }) => (
    <div data-testid="announcement-card">{ann?.title}</div>
  ),
}));

import AnnouncementsCenter from '../../components/AnnouncementsCenter.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeAnn(overrides = {}) {
  return {
    id: 'a-1', title: 'Match samedi', type: 'event',
    message: 'Rendez-vous à 14h', created_at: '2026-07-10T08:00:00Z',
    club_id: 'c-1',
    ...overrides,
  };
}

function setup({ announcements = [], loading = false, unreadCount = 0 } = {}) {
  mockUseMyAnnouncements.mockReturnValue({
    announcements, loading, unreadCount,
    readIds: new Set(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  });
}

beforeEach(() => vi.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AnnouncementsCenter — structure', () => {
  it('se monte sans crash', () => {
    setup();
    expect(() => render(<AnnouncementsCenter onClose={vi.fn()} />)).not.toThrow();
  });

  it('a le rôle dialog avec aria-label', () => {
    setup();
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('affiche le titre "Annonces clubs"', () => {
    setup();
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText(/annonces clubs/i)).toBeInTheDocument();
  });

  it('appelle onClose au clic sur le bouton retour', () => {
    setup();
    const onClose = vi.fn();
    render(<AnnouncementsCenter onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /retour/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('appelle onClose à l\'appui sur Escape', () => {
    setup();
    const onClose = vi.fn();
    render(<AnnouncementsCenter onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AnnouncementsCenter — état de chargement', () => {
  it('affiche "Chargement…" si loading=true', () => {
    setup({ loading: true });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('n\'affiche pas les annonces si loading=true', () => {
    setup({ loading: true, announcements: [makeAnn()] });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.queryByTestId('announcement-card')).not.toBeInTheDocument();
  });
});

describe('AnnouncementsCenter — liste vide', () => {
  it('affiche "Aucune annonce" si liste vide', () => {
    setup({ announcements: [] });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText(/aucune annonce/i)).toBeInTheDocument();
  });

  it('affiche "Tout est à jour" dans le sous-titre si unreadCount=0', () => {
    setup({ announcements: [], unreadCount: 0 });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText(/tout est à jour/i)).toBeInTheDocument();
  });
});

describe('AnnouncementsCenter — avec annonces', () => {
  it('affiche les AnnouncementCard pour chaque annonce', () => {
    setup({ announcements: [makeAnn({ id: 'a-1' }), makeAnn({ id: 'a-2', title: 'Tournoi' })] });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getAllByTestId('announcement-card')).toHaveLength(2);
  });

  it('affiche le titre de chaque annonce', () => {
    setup({ announcements: [makeAnn({ title: 'Match samedi' })] });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText('Match samedi')).toBeInTheDocument();
  });
});

describe('AnnouncementsCenter — non lus', () => {
  it('affiche le compteur d\'annonces non lues', () => {
    setup({ unreadCount: 3 });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByText(/3 non lue/i)).toBeInTheDocument();
  });

  it('affiche le bouton "Tout lire" si unreadCount > 0', () => {
    setup({ unreadCount: 2, announcements: [makeAnn()] });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /tout lire/i })).toBeInTheDocument();
  });

  it('appelle markAllRead au clic sur "Tout lire"', () => {
    const markAllRead = vi.fn();
    mockUseMyAnnouncements.mockReturnValue({
      announcements: [makeAnn()], loading: false, unreadCount: 1,
      readIds: new Set(), markRead: vi.fn(), markAllRead,
    });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /tout lire/i }));
    expect(markAllRead).toHaveBeenCalled();
  });

  it('n\'affiche pas le bouton "Tout lire" si unreadCount=0', () => {
    setup({ unreadCount: 0 });
    render(<AnnouncementsCenter onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /tout lire/i })).not.toBeInTheDocument();
  });
});
