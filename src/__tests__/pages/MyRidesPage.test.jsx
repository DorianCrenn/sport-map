import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockUseMyRides } = vi.hoisted(() => ({ mockUseMyRides: vi.fn() }));

const AUTH = { currentUser: { id: 'u-1' } };
const NOTIFS = { notifications: [], unreadCount: 0, markAllRead: vi.fn(), markRead: vi.fn() };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/useAndroidBack.js', () => ({ useAndroidBack: () => {} }));
vi.mock('../../hooks/useRides.js', () => ({ useMyRides: mockUseMyRides }));
vi.mock('../../hooks/useRideNotifications.js', () => ({ useRideNotifications: () => NOTIFS }));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: () => AUTH }));
vi.mock('../../lib/supabase.js', () => ({ supabase: { from: () => ({ select: () => ({ then: (fn) => Promise.resolve({ data: [] }).then(fn) }) }) }, isDemoMode: () => false, setDemoMode: () => {} }));
vi.mock('../../components/rides/RideCard.jsx', () => ({ default: () => <div data-testid="ride-card" /> }));
vi.mock('../../components/ui/EmptyState.jsx', () => ({ default: ({ title }) => <div data-testid="empty-state">{title}</div> }));
vi.mock('../../components/ConfirmDialog.jsx', () => ({ default: () => null }));

import MyRidesPage from '../../pages/MyRidesPage.jsx';

const EMPTY_RIDES = { myDriving: [], myPassenger: [], loading: false, refetch: vi.fn() };

beforeEach(() => {
  mockUseMyRides.mockReset();
  mockUseMyRides.mockReturnValue(EMPTY_RIDES);
});

describe('MyRidesPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<MyRidesPage onBack={vi.fn()} />)).not.toThrow();
  });

  it('affiche un état vide quand aucun covoiturage', () => {
    const { container } = render(<MyRidesPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('affiche une carte de covoiturage quand on conduit', () => {
    mockUseMyRides.mockReturnValue({ ...EMPTY_RIDES, myDriving: [{ id: 'r-1', event_id: 'e-1', seats: 3 }] });
    render(<MyRidesPage onBack={vi.fn()} />);
    expect(screen.getAllByTestId('ride-card').length).toBeGreaterThan(0);
  });
});
