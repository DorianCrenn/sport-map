import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockFrom, mockUseAuth } = vi.hoisted(() => ({
  mockFrom:    vi.fn(),
  mockUseAuth: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn().mockResolvedValue(undefined),
  },
  isDemoMode: () => false,
}));
vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth: mockUseAuth }));
vi.mock('../../lib/errorBus.js', () => ({ dispatchError: vi.fn() }));

import { makeQuery } from '../../test/mocks/supabase.js';
import { useRides } from '../../hooks/useRides.js';

function rideRow(overrides = {}) {
  return {
    id: 'r-1', event_id: 'evt-1', driver_id: 'u-1', driver_name: 'Jean',
    departure_location: 'Brest', departure_lat: 48.39, departure_lng: -4.49,
    departure_time: '2026-07-10T16:00:00Z', available_seats: 3,
    accepted_equipment: [], detour_flexibility: 'none', notes: '',
    status: 'active', created_at: '2026-06-01', ride_requests: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ currentUser: { id: 'u-1' } });
  mockFrom.mockReturnValue(makeQuery({ data: [rideRow()], error: null }));
});

describe('useRides â€” chargement', () => {
  it('démarre avec loading=true si eventId fourni', () => {
    const { result } = renderHook(() => useRides('evt-1'));
    expect(result.current.loading).toBe(true);
  });

  it('loading=false si eventId null', () => {
    const { result } = renderHook(() => useRides(null));
    expect(result.current.loading).toBe(false);
  });

  it('charge les rides depuis Supabase', async () => {
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rides).toHaveLength(1);
  });

  it('mappe driver_id â†’ driverId', async () => {
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rides[0].driverId).toBe('u-1');
  });

  it('calcule availableSeatsLeft correctement (sans requêtes acceptées)', async () => {
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rides[0].availableSeatsLeft).toBe(3);
  });

  it('calcule availableSeatsLeft avec des places prises', async () => {
    mockFrom.mockReturnValue(makeQuery({
      data: [rideRow({ available_seats: 4, ride_requests: [
        { id: 'req-1', ride_id: 'r-1', passenger_id: 'u-2', passenger_name: 'Alice', message: '', status: 'accepted', created_at: '' },
        { id: 'req-2', ride_id: 'r-1', passenger_id: 'u-3', passenger_name: 'Bob', message: '', status: 'accepted', created_at: '' },
      ] })],
      error: null,
    }));
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rides[0].availableSeatsLeft).toBe(2);
    expect(result.current.rides[0].takenSeats).toBe(2);
  });

  it('retourne rides=[] en cas d\'erreur', async () => {
    mockFrom.mockReturnValue(makeQuery({ data: null, error: { message: 'err' } }));
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rides).toEqual([]);
  });
});

describe('useRides â€” fonctions exposées', () => {
  it('expose createRide, cancelRide, requestRide, cancelRequest, acceptRequest, refuseRequest', async () => {
    const { result } = renderHook(() => useRides('evt-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(typeof result.current.createRide).toBe('function');
    expect(typeof result.current.cancelRide).toBe('function');
    expect(typeof result.current.requestRide).toBe('function');
    expect(typeof result.current.cancelRequest).toBe('function');
    expect(typeof result.current.acceptRequest).toBe('function');
    expect(typeof result.current.refuseRequest).toBe('function');
  });
});
