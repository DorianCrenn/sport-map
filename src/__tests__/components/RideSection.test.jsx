import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const { mockUseAuth, mockUseRides, mockUseClubFeatures } = vi.hoisted(() => ({
  mockUseAuth:         vi.fn(),
  mockUseRides:        vi.fn(),
  mockUseClubFeatures: vi.fn(),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));
vi.mock('../../hooks/useRides.js',        () => ({ useRides: mockUseRides }));
vi.mock('../../hooks/useClubFeatures.js', () => ({ useClubFeatures: mockUseClubFeatures }));
// Par défaut, l'utilisateur est membre du club de l'EVENT (covoit visible).
vi.mock('../../hooks/useMyClubMemberships.js', () => ({ useMyClubMemberships: () => new Set(['club-1']) }));

vi.mock('../ui/PlanGate.jsx', () => ({ default: ({ children }) => <div data-testid="plan-gate">{children}</div> }));
vi.mock('../../components/ui/PlanGate.jsx', () => ({ default: ({ children }) => <div data-testid="plan-gate">{children}</div> }));
vi.mock('../../components/ui/UpgradePrompt.jsx', () => ({ default: () => <div data-testid="upgrade-prompt" /> }));
vi.mock('../../components/ui/PlansMiniModal.jsx', () => ({ default: () => null }));
vi.mock('../../components/rides/RideCard.jsx', () => ({
  default: ({ ride }) => <div data-testid="ride-card">{ride.departure}</div>,
}));
vi.mock('../../components/rides/CreateRideModal.jsx', () => ({
  default: ({ onClose }) => <div data-testid="create-ride-modal"><button onClick={onClose}>Fermer</button></div>,
}));
vi.mock('../../components/rides/JoinRideModal.jsx', () => ({
  default: ({ onClose }) => <div data-testid="join-ride-modal"><button onClick={onClose}>Fermer</button></div>,
}));

import RideSection from '../../components/rides/RideSection.jsx';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EVENT = { id: 'evt-1', clubId: 'club-1' };

function ride(overrides = {}) {
  return {
    id: 'r-1', driverId: 'u-1', status: 'active',
    availableSeatsLeft: 2, seats: 4,
    departure: 'Brest', requests: [],
    ...overrides,
  };
}

function setup({ rides = [], loading = false, canCarpooling = true, user = null } = {}) {
  mockUseAuth.mockReturnValue({ currentUser: user });
  mockUseRides.mockReturnValue({
    rides, loading,
    createRide: vi.fn(), cancelRide: vi.fn(),
    requestRide: vi.fn(), cancelRequest: vi.fn(),
    acceptRequest: vi.fn(), refuseRequest: vi.fn(),
  });
  mockUseClubFeatures.mockReturnValue({
    loading: false,
    can: (feat) => (feat === 'CARPOOLING' ? canCarpooling : false),
  });
}

beforeEach(() => vi.clearAllMocks());

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RideSection — mode compact (snapPoint != full)', () => {
  it('retourne null si loading en mode compact', () => {
    setup({ loading: true });
    const { container } = render(<RideSection event={EVENT} snapPoint="peek" />);
    expect(container.firstChild).toBeNull();
  });

  it('retourne null si aucun trajet actif en mode compact', () => {
    setup({ rides: [] });
    const { container } = render(<RideSection event={EVENT} snapPoint="peek" />);
    expect(container.firstChild).toBeNull();
  });

  it('affiche le nombre de covoiturages en mode compact', () => {
    setup({ rides: [ride(), ride({ id: 'r-2' })] });
    render(<RideSection event={EVENT} snapPoint="peek" />);
    expect(screen.getByText(/2 covoiturages/i)).toBeInTheDocument();
  });

  it('affiche les places libres en mode compact', () => {
    setup({ rides: [ride({ availableSeatsLeft: 3 })] });
    render(<RideSection event={EVENT} snapPoint="peek" />);
    expect(screen.getByText(/3 places libres/i)).toBeInTheDocument();
  });

  it('affiche "Complet" si toutes les places prises', () => {
    setup({ rides: [ride({ availableSeatsLeft: 0 })] });
    render(<RideSection event={EVENT} snapPoint="peek" />);
    expect(screen.getByText(/complet/i)).toBeInTheDocument();
  });

  it('ne rend RIEN si l\'utilisateur n\'est pas membre du club de l\'événement', () => {
    setup({ rides: [ride()] });
    const { container } = render(<RideSection event={{ id: 'evt-x', clubId: 'club-autre' }} snapPoint="full" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ne rend RIEN pour un événement sans club (personnel)', () => {
    setup({ rides: [ride()] });
    const { container } = render(<RideSection event={{ id: 'evt-y' }} snapPoint="full" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('RideSection — mode full', () => {
  it('affiche le PlanGate si feature CARPOOLING désactivée', () => {
    setup({ canCarpooling: false });
    render(<RideSection event={EVENT} snapPoint="full" />);
    expect(screen.getByTestId('plan-gate')).toBeInTheDocument();
  });

  it('affiche les RideCard pour chaque trajet actif', () => {
    setup({ rides: [ride({ departure: 'Brest' }), ride({ id: 'r-2', departure: 'Quimper' })] });
    render(<RideSection event={EVENT} snapPoint="full" />);
    const cards = screen.getAllByTestId('ride-card');
    expect(cards).toHaveLength(2);
  });

  it('affiche le bouton "Proposer un trajet" si connecté et pas encore conducteur', () => {
    setup({ rides: [], user: { id: 'u-99' } });
    render(<RideSection event={EVENT} snapPoint="full" />);
    const btn = screen.getByRole('button', { name: /proposer.*trajet|covoiturage/i });
    expect(btn).toBeInTheDocument();
  });

  it('ouvre CreateRideModal au clic sur le bouton proposer', () => {
    setup({ rides: [], user: { id: 'u-99' } });
    render(<RideSection event={EVENT} snapPoint="full" />);
    const btn = screen.getByRole('button', { name: /proposer.*trajet|covoiturage/i });
    fireEvent.click(btn);
    expect(screen.getByTestId('create-ride-modal')).toBeInTheDocument();
  });

  it('se monte sans crash si aucun trajet', () => {
    setup({ rides: [] });
    expect(() => render(<RideSection event={EVENT} snapPoint="full" />)).not.toThrow();
  });
});

describe('RideSection — trajets annulés filtrés', () => {
  it('n\'affiche pas les trajets annulés', () => {
    setup({ rides: [ride({ status: 'cancelled' })] });
    render(<RideSection event={EVENT} snapPoint="full" />);
    expect(screen.queryByTestId('ride-card')).not.toBeInTheDocument();
  });
});
