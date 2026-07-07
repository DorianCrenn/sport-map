import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Retours stables ───────────────────────────────────────────────────────────
const AUTH = { currentUser: { id: 'u-1' } };
const SPORTS = { allSports: { Football: { label: 'Football', color: '#16a34a' } } };
const FAVS = { favorites: new Set() };
const FILTERED = [];
const GEO = { coords: null, loading: false, error: null, request: vi.fn() };

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>,
    span:   ({ children, ...p }) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => AUTH }));
vi.mock('../../hooks/useSports.js', () => ({ useSports: () => SPORTS }));
vi.mock('../../contexts/FavoritesContext.jsx', () => ({ useFavoritesContext: () => FAVS }));
vi.mock('../../hooks/useFilteredEvents.js', () => ({ useFilteredEvents: () => FILTERED }));
vi.mock('../../hooks/useGeolocation.js', () => ({ useGeolocation: () => GEO }));
vi.mock('../../hooks/useDynamicMeta.js', () => ({ useDynamicMeta: () => {} }));
// MapView porte Leaflet → mocké pour tester la page sans la carte réelle
vi.mock('../../components/MapView.jsx', () => ({ default: () => <div data-testid="map-view" /> }));
vi.mock('../../components/SportFilterBar.jsx', () => ({ default: () => null }));
vi.mock('../../components/DateFilterBar.jsx', () => ({ default: () => null }));
vi.mock('../../components/EventSidebar.jsx', () => ({ default: () => null }));
vi.mock('../../components/MobileEventSheet.jsx', () => ({ default: () => null }));
vi.mock('../../components/EmptyMapGuide.jsx', () => ({ default: () => <div data-testid="empty-guide" /> }));
vi.mock('../../components/SportIcon.jsx', () => ({ default: () => null }));

import MapPage from '../../pages/MapPage.jsx';

const NOOP = vi.fn();
const BASE_PROPS = {
  allEvents: [],
  activeDepartment: 'finistere',
  canAddEvent: false,
  onAddEvent: NOOP, onUpdateEvent: NOOP, onDeleteEvent: NOOP,
  onGoToFavoris: NOOP, cityFilter: null, focusEventId: null, onFocusDone: NOOP,
  eventsLoading: false, allClubs: [],
};

describe('MapPage', () => {
  it('se monte sans crash (sans Leaflet réel)', () => {
    expect(() => render(<MapPage {...BASE_PROPS} />)).not.toThrow();
  });

  it('rend la carte (MapView)', () => {
    render(<MapPage {...BASE_PROPS} />);
    expect(screen.getByTestId('map-view')).toBeInTheDocument();
  });
});
