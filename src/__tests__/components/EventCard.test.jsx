import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:     ({ children, ...p }) => <div {...p}>{children}</div>,
    button:  ({ children, ...p }) => <button {...p}>{children}</button>,
    article: ({ children, ...p }) => <article {...p}>{children}</article>,
    p:       ({ children, ...p }) => <p {...p}>{children}</p>,
    span:    ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const authState = vi.hoisted(() => ({ current: { currentUser: null, isAdmin: false, isClubAdmin: false } }));
vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: () => authState.current,
}));

vi.mock('../../contexts/FavoritesContext.jsx', () => ({
  useFavoritesContext: () => ({ isFavorite: () => false, toggleFavorite: vi.fn() }),
}));

vi.mock('../../contexts/AttendanceContext.jsx', () => ({
  useAttendanceContext: () => ({ isAttending: () => false, toggleAttendance: vi.fn() }),
}));

vi.mock('../../contexts/AttendeeCountContext.jsx', () => ({
  useAttendeeCount: () => 0,
}));

vi.mock('../../contexts/ToastContext.jsx', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: () => ({
    allSports: {
      Football: { id: 'Football', label: 'Football', color: '#22c55e' },
    },
  }),
}));

vi.mock('../../hooks/useShare.js', () => ({
  useShare: () => ({ share: vi.fn() }),
}));

vi.mock('../../hooks/useClubPlayers.js', () => ({
  useClubPlayers: () => ({ players: [] }),
}));

vi.mock('../../hooks/useClubAnnouncements.js', () => ({
  useClubAnnouncements: () => ({ announcements: [] }),
}));

vi.mock('../../hooks/useEventPredictions.js', () => ({
  useEventPredictionCount: () => ({ total: 0 }),
}));

vi.mock('../../components/EventReactions.jsx', () => ({ default: () => null }));
vi.mock('../../components/EventComments.jsx',  () => ({ default: () => null }));
vi.mock('../../components/EventPhotoGallery.jsx', () => ({ default: () => null }));
vi.mock('../../components/SportIcon.jsx', () => ({
  default: ({ sport }) => <span data-testid="sport-icon">{sport}</span>,
}));
vi.mock('../../components/PosterStudio.jsx',  () => ({ default: () => null }));
vi.mock('../../components/PosterShareBtn.jsx', () => ({ default: () => null }));
vi.mock('../../utils/exportICS.js', () => ({ downloadICS: vi.fn() }));
vi.mock('../../lib/eventShare.js', () => ({
  generateEventDescription: vi.fn(() => ''),
  openWhatsAppShare: vi.fn(),
  openFacebookShare: vi.fn(),
  openInstagramShare: vi.fn(),
}));

import EventCard from '../../components/EventCard.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvent(overrides = {}) {
  return {
    id: 'evt-1',
    title: 'FC Plouvorn vs Brest FC',
    sport: 'Football',
    eventType: 'championship',
    date: new Date(Date.now() + 3600_000).toISOString(), // dans 1h
    city: 'Plouvorn',
    venue: 'Stade Ar Vrug',
    level: 'D3',
    ...overrides,
  };
}

function renderCard(event, props = {}) {
  return render(
    <EventCard
      event={event}
      isSelected={false}
      onSelect={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      {...props}
    />
  );
}

// ── Tests — EventTypeBadge (via rendu) ────────────────────────────────────────

describe('EventCard — EventTypeBadge', () => {
  it('affiche le level pour championship (ex: "D3")', () => {
    renderCard(makeEvent({ eventType: 'championship', level: 'D3' }));
    expect(screen.getAllByText('D3').length).toBeGreaterThan(0);
  });

  it('affiche "Amical" pour eventType=friendly', () => {
    renderCard(makeEvent({ eventType: 'friendly', level: '' }));
    expect(screen.getByText('Amical')).toBeDefined();
  });

  it('affiche "TOURNOI" pour eventType=tournament (rendu TournamentCardContent)', () => {
    renderCard(makeEvent({ eventType: 'tournament', level: '' }));
    expect(screen.getByText('TOURNOI')).toBeDefined();
  });
});

// ── Tests — StatusBadge (via rendu) ──────────────────────────────────────────

describe('EventCard — StatusBadge', () => {
  it('n\'affiche pas de badge statut pour un event futur (upcoming)', () => {
    renderCard(makeEvent({ status: 'upcoming' }));
    expect(screen.queryByText('À venir')).toBeNull();
  });

  it('affiche "● En direct" pour status=live', () => {
    renderCard(makeEvent({ status: 'live' }));
    expect(screen.getByText(/En direct/)).toBeDefined();
  });

  it('affiche "Reporté" pour status=postponed', () => {
    renderCard(makeEvent({ status: 'postponed' }));
    expect(screen.getByText('Reporté')).toBeDefined();
  });

  it('affiche "Terminé" pour status=done', () => {
    renderCard(makeEvent({ status: 'done' }));
    expect(screen.getByText('Terminé')).toBeDefined();
  });
});

// ── Tests — rendu minimal ─────────────────────────────────────────────────────

describe('EventCard — rendu minimal', () => {
  it('affiche la ville', () => {
    renderCard(makeEvent());
    expect(screen.getByText(/Plouvorn/i)).toBeDefined();
  });

  it('affiche le sport via SportIcon', () => {
    renderCard(makeEvent());
    expect(screen.getByTestId('sport-icon')).toBeDefined();
  });
});

// ── Permissions : modifier/supprimer réservés au propriétaire (ou admin) ───────
describe('EventCard — permissions d\'édition (propriétaire uniquement)', () => {
  afterEach(() => { authState.current = { currentUser: null, isAdmin: false, isClubAdmin: false }; });

  const ownedEvent = makeEvent({ eventType: 'friendly', source: 'user', userId: 'owner-1' });

  it('le propriétaire voit Modifier / Supprimer', () => {
    authState.current = { currentUser: { id: 'owner-1' }, isAdmin: false, isClubAdmin: false };
    renderCard(ownedEvent, { isSelected: true });
    expect(screen.getByLabelText("Modifier l'événement")).toBeDefined();
    expect(screen.getByLabelText("Supprimer l'événement")).toBeDefined();
  });

  it("un autre utilisateur ne voit PAS Modifier / Supprimer (bug historique creatorId)", () => {
    authState.current = { currentUser: { id: 'someone-else' }, isAdmin: false, isClubAdmin: false };
    renderCard(ownedEvent, { isSelected: true });
    expect(screen.queryByLabelText("Modifier l'événement")).toBeNull();
    expect(screen.queryByLabelText("Supprimer l'événement")).toBeNull();
  });

  it('un admin voit Modifier / Supprimer sur l\'événement d\'un autre', () => {
    authState.current = { currentUser: { id: 'admin-x' }, isAdmin: true, isClubAdmin: false };
    renderCard(ownedEvent, { isSelected: true });
    expect(screen.getByLabelText("Modifier l'événement")).toBeDefined();
  });
});
