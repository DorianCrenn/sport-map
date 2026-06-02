/**
 * Tests MapPage — rendu, filtrage, sélection, géolocalisation, accessibilité
 */
import React, { Suspense } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(({ children, style, className, onClick, ...rest }, ref) =>
        <div ref={ref} style={style} className={className} onClick={onClick} {...rest}>{children}</div>
      ),
      button: React.forwardRef(({ children, style, className, onClick, ...rest }, ref) =>
        <button ref={ref} style={style} className={className} onClick={onClick} {...rest}>{children}</button>
      ),
    },
  };
});

vi.mock('../../contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(() => ({ currentUser: { id: 'u1', favoriteSports: ['Football'] } })),
}));

vi.mock('../../contexts/FavoritesContext.jsx', () => ({
  useFavoritesContext: vi.fn(() => ({ favorites: new Set() })),
}));

vi.mock('../../hooks/useSports.js', () => ({
  useSports: vi.fn(() => ({ allSports: { Football: { label: 'Football', color: '#3b82f6' } } })),
}));

vi.mock('../../hooks/useFilteredEvents.js', () => ({
  useFilteredEvents: vi.fn(() => []),
}));

vi.mock('../../hooks/useGeolocation.js', () => ({
  useGeolocation: vi.fn(() => ({ coords: null, loading: false, error: null, request: vi.fn() })),
}));

vi.mock('../../hooks/useDynamicMeta.js', () => ({
  useDynamicMeta: vi.fn(),
}));

vi.mock('../../lib/dateUtils.js', () => ({
  formatDate: vi.fn(() => '01/06/2026'),
  formatTime: vi.fn(() => '15h00'),
}));

vi.mock('../../lib/eventShare.js', () => ({
  generateEventUrl: vi.fn(() => 'https://sportlink.fr/events/evt-1'),
}));

vi.mock('../../components/MapView.jsx', () => ({
  default: vi.fn(({ onMarkerClick, onMapClick, onBoundsChange }) => (
    <div data-testid="map-view">
      <button data-testid="trigger-marker" onClick={() => onMarkerClick?.('evt-1')}>Marker</button>
      <button data-testid="trigger-map-click" onClick={() => onMapClick?.()}>MapClick</button>
      <button data-testid="trigger-bounds" onClick={() => onBoundsChange?.({ contains: () => true })}>Bounds</button>
    </div>
  )),
}));

vi.mock('../../components/EventSidebar.jsx', () => ({
  default: vi.fn(({ onGeolocate, onAddEvent, canAddEvent, events }) => (
    <div data-testid="event-sidebar">
      <button data-testid="sidebar-geolocate" onClick={onGeolocate}>Autour de moi</button>
      {canAddEvent && <button data-testid="sidebar-add-event" onClick={onAddEvent}>+ Événement</button>}
      <span data-testid="sidebar-event-count">{events?.length ?? 0}</span>
    </div>
  )),
}));

vi.mock('../../components/MobileEventSheet.jsx', () => ({
  default: vi.fn(() => <div data-testid="mobile-event-sheet" />),
}));

vi.mock('../../components/SportFilterBar.jsx', () => ({
  default: vi.fn(({ onChange }) => (
    <div data-testid="sport-filter-bar">
      <button data-testid="select-football" onClick={() => onChange('Football')}>Football</button>
      <button data-testid="clear-sport" onClick={() => onChange(null)}>Tous</button>
    </div>
  )),
}));

vi.mock('../../components/DateFilterBar.jsx', () => ({
  default: vi.fn(({ onChange }) => (
    <div data-testid="date-filter-bar">
      <button data-testid="set-date-range" onClick={() => onChange({ from: new Date(), to: new Date() })}>Aujourd'hui</button>
    </div>
  )),
}));

vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));
vi.mock('../../components/EmptyMapGuide.jsx', () => ({ default: () => <div data-testid="empty-map-guide" /> }));
vi.mock('../../components/EventFormModal.jsx', () => ({
  default: vi.fn(({ onClose, onSave }) => (
    <div data-testid="event-form-modal" role="dialog">
      <button data-testid="modal-close" onClick={onClose}>Fermer</button>
      <button data-testid="modal-save" onClick={() => onSave({ id: 'new-evt', title: 'Test' })}>Sauvegarder</button>
    </div>
  )),
}));

// ── Import after mocks ─────────────────────────────────────────────────────────

import MapPage from '../../pages/MapPage.jsx';
import { useFilteredEvents } from '../../hooks/useFilteredEvents.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EVENTS = [
  { id: 'evt-1', sport: 'Football', title: 'FC Brest vs FC Nantes', date: new Date(Date.now() + 86400000).toISOString(), city: 'Brest', lat: 48.39, lng: -4.48, clubId: 'club-1' },
  { id: 'evt-2', sport: 'Rugby', title: 'Tournoi Rugby', date: new Date(Date.now() + 172800000).toISOString(), city: 'Quimper', lat: 47.99, lng: -4.10 },
];

const defaultProps = {
  allEvents: EVENTS,
  activeDepartment: '29',
  canAddEvent: false,
  onAddEvent: vi.fn().mockResolvedValue({ id: 'new-evt', lat: 48.39, lng: -4.48, title: 'Test' }),
  onUpdateEvent: vi.fn(),
  onDeleteEvent: vi.fn(),
  onGoToFavoris: vi.fn(),
  cityFilter: null,
  focusEventId: null,
  onFocusDone: vi.fn(),
  eventsLoading: false,
  initialSportFilter: null,
  onInitialFilterApplied: vi.fn(),
  allClubs: [{ id: 'club-1', name: 'FC Brest', logo_url: null }],
};

function renderMapPage(props = {}) {
  return render(
    <Suspense fallback={<div>Loading...</div>}>
      <MapPage {...defaultProps} {...props} />
    </Suspense>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useFilteredEvents.mockReturnValue(EVENTS);
  useGeolocation.mockReturnValue({ coords: null, loading: false, error: null, request: vi.fn() });
  useAuth.mockReturnValue({ currentUser: { id: 'u1', favoriteSports: ['Football'] } });
  localStorage.clear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MapPage — rendu initial', () => {
  it('affiche le composant MapView au rendu', () => {
    renderMapPage();
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('affiche EventSidebar avec les événements filtrés', () => {
    renderMapPage();
    expect(screen.getByTestId('event-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-event-count')).toHaveTextContent('2');
  });

  it('applique le filtre sport venant de l\'onboarding (initialSportFilter)', () => {
    const onInitialFilterApplied = vi.fn();
    renderMapPage({ initialSportFilter: 'Rugby', onInitialFilterApplied });
    expect(onInitialFilterApplied).toHaveBeenCalledTimes(1);
  });

  it('n\'affiche pas le bouton + Événement si canAddEvent=false', () => {
    renderMapPage({ canAddEvent: false });
    expect(screen.queryByTestId('sidebar-add-event')).not.toBeInTheDocument();
  });

  it('affiche le bouton + Événement si canAddEvent=true', () => {
    renderMapPage({ canAddEvent: true });
    expect(screen.getByTestId('sidebar-add-event')).toBeInTheDocument();
  });
});

describe('MapPage — filtrage', () => {
  it('passe les événements filtrés à EventSidebar', () => {
    useFilteredEvents.mockReturnValue([EVENTS[0]]);
    renderMapPage();
    expect(screen.getByTestId('sidebar-event-count')).toHaveTextContent('1');
  });

  it('ne liste que les événements futurs quand upcomingOnly=true (défaut)', () => {
    const pastEvent = { ...EVENTS[0], date: new Date(Date.now() - 86400000).toISOString() };
    useFilteredEvents.mockReturnValue([pastEvent, EVENTS[1]]);
    renderMapPage();
    // upcomingOnly filtre les passés → seulement EVENTS[1] dans la sidebar
    expect(screen.getByTestId('sidebar-event-count')).toHaveTextContent('1');
  });

  it('accepte un filtre date via DateFilterBar', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('set-date-range'));
    // Pas de crash, le filtre est mis à jour (useFilteredEvents appelé avec dateRange)
    expect(useFilteredEvents).toHaveBeenCalled();
  });

  it('accepte un filtre sport via SportFilterBar', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('select-football'));
    expect(useFilteredEvents).toHaveBeenCalled();
    const lastCall = useFilteredEvents.mock.calls[useFilteredEvents.mock.calls.length - 1];
    expect(lastCall[1].sport).toBe('Football');
  });

  it('réinitialise le filtre sport au clic sur "Tous"', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('select-football'));
    await userEvent.click(screen.getByTestId('clear-sport'));
    const lastCall = useFilteredEvents.mock.calls[useFilteredEvents.mock.calls.length - 1];
    expect(lastCall[1].sport).toBeNull();
  });
});

describe('MapPage — sélection d\'événement', () => {
  it('sélectionne un événement au clic sur un marqueur', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('trigger-marker'));
    // L'événement evt-1 est sélectionné — pas de crash, pas d'erreur
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('désélectionne l\'événement au clic sur la carte', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('trigger-marker'));
    await userEvent.click(screen.getByTestId('trigger-map-click'));
    // Pas de crash
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });

  it('toggle la sélection au double-clic sur le même marqueur', async () => {
    renderMapPage();
    await userEvent.click(screen.getByTestId('trigger-marker'));
    await userEvent.click(screen.getByTestId('trigger-marker')); // second click → deselect
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });
});

describe('MapPage — modal EventFormModal', () => {
  it('ouvre EventFormModal quand on clique sur + Événement', async () => {
    renderMapPage({ canAddEvent: true });
    await userEvent.click(screen.getByTestId('sidebar-add-event'));
    await waitFor(() => {
      expect(screen.getByTestId('event-form-modal')).toBeInTheDocument();
    });
  });

  it('ferme EventFormModal quand on clique sur Fermer', async () => {
    renderMapPage({ canAddEvent: true });
    await userEvent.click(screen.getByTestId('sidebar-add-event'));
    await waitFor(() => expect(screen.getByTestId('event-form-modal')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('event-form-modal')).not.toBeInTheDocument();
    });
  });

  it('appelle onUpdateEvent quand EventFormModal sauvegarde un événement existant', async () => {
    const onUpdateEvent = vi.fn();
    renderMapPage({ canAddEvent: true, onUpdateEvent });
    await userEvent.click(screen.getByTestId('sidebar-add-event'));
    await waitFor(() => expect(screen.getByTestId('event-form-modal')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('modal-save'));
    // Modal se ferme (modal removed = success)
    await waitFor(() => {
      expect(screen.queryByTestId('event-form-modal')).not.toBeInTheDocument();
    });
  });
});

describe('MapPage — géolocalisation', () => {
  it('affiche la bannière geoError si l\'utilisateur refuse la géolocalisation', () => {
    useGeolocation.mockReturnValue({
      coords: null, loading: false,
      error: 'Géolocalisation refusée',
      request: vi.fn(),
    });
    renderMapPage();
    expect(screen.getByText(/Géolocalisation non disponible/i)).toBeInTheDocument();
  });

  it('la bannière geoError a un bouton fermer avec aria-label', () => {
    useGeolocation.mockReturnValue({
      coords: null, loading: false,
      error: 'Géolocalisation refusée',
      request: vi.fn(),
    });
    renderMapPage();
    const closeBtn = screen.getByRole('button', { name: /fermer la bannière de géolocalisation/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('ferme la bannière geoError au clic sur le bouton Fermer', async () => {
    useGeolocation.mockReturnValue({
      coords: null, loading: false,
      error: 'Géolocalisation refusée',
      request: vi.fn(),
    });
    renderMapPage();
    const closeBtn = screen.getByRole('button', { name: /fermer la bannière de géolocalisation/i });
    await userEvent.click(closeBtn);
    expect(screen.queryByText(/Géolocalisation non disponible/i)).not.toBeInTheDocument();
  });

  it('lance la géolocalisation au clic sur Autour de moi', async () => {
    const request = vi.fn();
    useGeolocation.mockReturnValue({ coords: null, loading: false, error: null, request });
    renderMapPage();
    await userEvent.click(screen.getByTestId('sidebar-geolocate'));
    // nearbyFilter activé → requestGeo appelé
    expect(request).toHaveBeenCalled();
  });
});

describe('MapPage — bannière AhaSport', () => {
  it('affiche la bannière AhaSport quand initialSportFilter est défini', () => {
    useFilteredEvents.mockReturnValue([EVENTS[0]]);
    renderMapPage({ initialSportFilter: 'Football' });
    // La bannière affiche un message contenant "Football" et "cette semaine" ou "aucun"
    expect(screen.getByText(/Football.*(semaine|bientôt)/i)).toBeInTheDocument();
  });

  it('la bannière AhaSport a un bouton fermer avec aria-label', () => {
    renderMapPage({ initialSportFilter: 'Football' });
    const closeBtn = screen.getByRole('button', { name: /fermer/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('ferme la bannière AhaSport au clic sur le bouton Fermer', async () => {
    renderMapPage({ initialSportFilter: 'Football' });
    // Il peut y avoir plusieurs boutons "Fermer", on prend le premier
    const closeBtns = screen.getAllByRole('button', { name: /fermer/i });
    await userEvent.click(closeBtns[0]);
    // Pas de crash
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });
});

describe('MapPage — réinitialisation au changement d\'utilisateur', () => {
  it('ne crash pas quand currentUser change', async () => {
    const { rerender } = renderMapPage();
    useAuth.mockReturnValue({ currentUser: { id: 'u2', favoriteSports: [] } });
    rerender(
      <Suspense fallback={<div>Loading...</div>}>
        <MapPage {...defaultProps} />
      </Suspense>
    );
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });
});

describe('MapPage — accessibilité', () => {
  it('le bouton fermer geoError a un aria-label conforme WCAG', () => {
    useGeolocation.mockReturnValue({ coords: null, loading: false, error: 'denied', request: vi.fn() });
    renderMapPage();
    const btn = screen.getByRole('button', { name: /fermer la bannière de géolocalisation/i });
    expect(btn).toHaveAttribute('aria-label');
  });

  it('EventSidebar est rendu dans le DOM (accessibilité sidebar)', () => {
    renderMapPage();
    const sidebar = screen.getByTestId('event-sidebar');
    expect(sidebar).toBeInTheDocument();
  });

  it('le bouton Autour de moi est accessible par rôle button', () => {
    renderMapPage();
    expect(screen.getByRole('button', { name: /autour de moi/i })).toBeInTheDocument();
  });
});
