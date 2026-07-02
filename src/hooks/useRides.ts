import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { dispatchError } from '../lib/errorBus.js';
import { sanitizeText } from '../lib/sanitize.js';

interface RideRequestRow { id: string; ride_id: string; passenger_id?: string | null; passenger_name?: string; message?: string | null; status: string; created_at: string; }
interface RideRow { id: string; event_id: string; driver_id?: string; driver_name?: string; departure_location?: string; departure_lat?: number | null; departure_lng?: number | null; departure_time?: string | null; available_seats: number; accepted_equipment?: string[]; detour_flexibility?: string; notes?: string; status: string; created_at: string; ride_requests?: RideRequestRow[]; }
export interface RideRequest { id: string; rideId: string; passengerId?: string | null; passengerName: string; message: string; status: string; createdAt: string; }
export interface Ride { id: string; eventId: string; driverId?: string; driverName: string; departureLocation?: string; departureLat?: number | null; departureLng?: number | null; departureTime?: string | null; availableSeats: number; acceptedEquipment: string[]; detourFlexibility: string; notes: string; status: string; createdAt: string; requests: RideRequest[]; takenSeats: number; availableSeatsLeft: number; pendingCount: number; }
interface CreateRideData { departureLocation: string; departureLat?: number | null; departureLng?: number | null; departureTime?: string | null; availableSeats?: number; acceptedEquipment?: string[]; detourFlexibility?: string; notes?: string; }

function mapRequest(row: RideRequestRow): RideRequest { return { id: row.id, rideId: row.ride_id, passengerId: row.passenger_id, passengerName: row.passenger_name ?? '', message: row.message ?? '', status: row.status, createdAt: row.created_at }; }
function mapRide(row: RideRow): Ride { const requests = (row.ride_requests ?? []).map(mapRequest); const accepted = requests.filter(r => r.status === 'accepted'); return { id: row.id, eventId: row.event_id, driverId: row.driver_id, driverName: row.driver_name ?? '', departureLocation: row.departure_location, departureLat: row.departure_lat, departureLng: row.departure_lng, departureTime: row.departure_time, availableSeats: row.available_seats, acceptedEquipment: row.accepted_equipment ?? [], detourFlexibility: row.detour_flexibility ?? 'none', notes: row.notes ?? '', status: row.status, createdAt: row.created_at, requests, takenSeats: accepted.length, availableSeatsLeft: Math.max(0, row.available_seats - accepted.length), pendingCount: requests.filter(r => r.status === 'pending').length }; }

function demoRidesKey(eventId: string) { return `sl-demo-rides-${eventId}`; }
function loadDemoRides(eventId: string): Ride[] {
  try { return JSON.parse(localStorage.getItem(demoRidesKey(eventId)) ?? '[]'); } catch { return []; }
}
function saveDemoRides(eventId: string, rides: Ride[]) {
  try { localStorage.setItem(demoRidesKey(eventId), JSON.stringify(rides)); } catch { /* noop */ }
}

export function useRides(eventId: string | null | undefined) {
  const { currentUser } = useAuth();
  const [rides,   setRides]   = useState<Ride[]>([]);
  const [loading, setLoading] = useState(!!eventId);

  const fetchRides = useCallback(async () => {
    if (!eventId) return;
    if (isDemoMode()) {
      setRides(loadDemoRides(String(eventId)));
      setLoading(false);
      return;
    }
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.from('rides').select('*, ride_requests(*)').eq('event_id', String(eventId)).gte('departure_time', cutoff).order('departure_time', { ascending: true }) as { data: RideRow[] | null; error: { message: string } | null };
    if (error) dispatchError('Impossible de charger les covoiturages.');
    if (!error && data) setRides(data.map(mapRide));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    if (isDemoMode()) { fetchRides(); return; }
    fetchRides();
    const key = Math.random().toString(36).slice(2, 6);
    const evId = String(eventId);
    const ch = supabase.channel(`rides-${evId}-${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides', filter: `event_id=eq.${evId}` }, fetchRides)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, (payload: { new?: { ride_id?: string }; old?: { ride_id?: string } }) => {
        const changedRideId = payload.new?.ride_id ?? payload.old?.ride_id;
        if (!changedRideId) return fetchRides();
        setRides(current => { const relevant = current.some(r => r.id === changedRideId); if (relevant) fetchRides(); return current; });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [eventId, fetchRides]);

  const createRide = useCallback(async (data: CreateRideData): Promise<Ride> => {
    if (isDemoMode()) {
      const evId = String(eventId);
      const fakeRide: Ride = {
        id:                `demo-ride-${Date.now()}`,
        eventId:           evId,
        driverId:          currentUser?.id ?? 'demo-driver',
        driverName:        (currentUser as any)?.name ?? 'Moi',
        departureLocation: data.departureLocation,
        departureLat:      data.departureLat ?? null,
        departureLng:      data.departureLng ?? null,
        departureTime:     data.departureTime ?? null,
        availableSeats:    data.availableSeats ?? 3,
        acceptedEquipment: data.acceptedEquipment ?? [],
        detourFlexibility: data.detourFlexibility ?? 'none',
        notes:             data.notes ? sanitizeText(data.notes) : '',
        status:            'active',
        createdAt:         new Date().toISOString(),
        requests:          [],
        takenSeats:        0,
        availableSeatsLeft: data.availableSeats ?? 3,
        pendingCount:      0,
      };
      const updated = [...loadDemoRides(evId), fakeRide];
      saveDemoRides(evId, updated);
      setRides(updated);
      window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'carpool-requested' } }));
      return fakeRide;
    }
    if (!currentUser) throw new Error('not authenticated');
    const { data: saved, error } = await supabase.from('rides').insert({ event_id: String(eventId), driver_id: currentUser.id, driver_name: (currentUser as any).name ?? '', departure_location: data.departureLocation, departure_lat: data.departureLat ?? null, departure_lng: data.departureLng ?? null, departure_time: data.departureTime ?? null, available_seats: data.availableSeats ?? 3, accepted_equipment: data.acceptedEquipment ?? [], detour_flexibility: data.detourFlexibility ?? 'none', notes: data.notes ? sanitizeText(data.notes) : null, status: 'active' }).select().single() as { data: RideRow | null; error: { message: string } | null };
    if (error) throw error;
    await fetchRides();
    window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'ride_created' } }));
    return mapRide({ ...saved!, ride_requests: [] });
  }, [currentUser, eventId, fetchRides]);

  const cancelRide = useCallback(async (rideId: string) => {
    const ride = rides.find(r => r.id === rideId);
    const { error } = await supabase.from('rides').update({ status: 'cancelled' }).eq('id', rideId).eq('driver_id', currentUser?.id) as { error: { message: string } | null };
    if (error) throw error;
    const accepted = (ride?.requests ?? []).filter(r => r.status === 'accepted' && r.passengerId);
    if (accepted.length > 0) { await supabase.from('ride_notifications').insert(accepted.map(r => ({ user_id: r.passengerId, type: 'ride_cancelled', ride_id: rideId, data: { driverName: (currentUser as any)?.name, rideLocation: ride?.departureLocation } }))); }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const requestRide = useCallback(async (rideId: string, message?: string): Promise<RideRequest> => {
    if (!currentUser) throw new Error('not authenticated');
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      if (ride.status === 'full' || ride.status === 'cancelled') throw new Error('Ce trajet n\'est plus disponible');
      if (ride.departureTime && new Date(ride.departureTime) < new Date()) throw new Error('Ce trajet est déjà parti');
      const accepted = (ride.requests ?? []).filter(r => r.status === 'accepted').length;
      if (accepted >= ride.availableSeats) throw new Error('Plus de places disponibles');
    }
    const { data: saved, error } = await supabase.from('ride_requests').insert({ ride_id: rideId, passenger_id: currentUser.id, passenger_name: (currentUser as any).name ?? '', message: message ? sanitizeText(message) : null, status: 'pending' }).select().single() as { data: RideRequestRow | null; error: { message: string } | null };
    if (error) throw error;
    if (ride) { await supabase.from('ride_notifications').insert({ user_id: ride.driverId, type: 'new_request', ride_id: rideId, request_id: saved!.id, data: { passengerName: (currentUser as any).name, rideLocation: ride.departureLocation } }); }
    await fetchRides();
    if (isDemoMode()) window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'carpool-requested' } }));
    return mapRequest(saved!);
  }, [currentUser, rides, fetchRides]);

  const cancelRequest = useCallback(async (requestId: string, rideId: string) => {
    const { error } = await supabase.from('ride_requests').update({ status: 'cancelled' }).eq('id', requestId).eq('passenger_id', currentUser?.id) as { error: { message: string } | null };
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    if (ride) { await supabase.from('ride_notifications').insert({ user_id: ride.driverId, type: 'passenger_cancelled', ride_id: rideId, request_id: requestId, data: { passengerName: (currentUser as any)?.name } }); }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const acceptRequest = useCallback(async (requestId: string, rideId: string, passengerId: string) => {
    const { error } = await supabase.from('ride_requests').update({ status: 'accepted' }).eq('id', requestId) as { error: { message: string } | null };
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    await supabase.from('ride_notifications').insert({ user_id: passengerId, type: 'request_accepted', ride_id: rideId, request_id: requestId, data: { driverName: (currentUser as any)?.name, rideLocation: ride?.departureLocation } });
    if (ride && ride.takenSeats + 1 >= ride.availableSeats) {
      await supabase.from('rides').update({ status: 'full' }).eq('id', rideId);
      await supabase.from('ride_requests').update({ status: 'rejected' }).eq('ride_id', rideId).eq('status', 'pending').neq('id', requestId);
    }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const refuseRequest = useCallback(async (requestId: string, rideId: string, passengerId: string) => {
    const { error } = await supabase.from('ride_requests').update({ status: 'refused' }).eq('id', requestId) as { error: { message: string } | null };
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    await supabase.from('ride_notifications').insert({ user_id: passengerId, type: 'request_refused', ride_id: rideId, request_id: requestId, data: { driverName: (currentUser as any)?.name, rideLocation: ride?.departureLocation } });
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  return { rides, loading, createRide, cancelRide, requestRide, cancelRequest, acceptRequest, refuseRequest, refetch: fetchRides };
}

export function useMyRides() {
  const { currentUser } = useAuth();
  const [myDriving,   setMyDriving]   = useState<Ride[]>([]);
  const [myPassenger, setMyPassenger] = useState<(RideRequest & { ride: Ride | null })[]>([]);
  const [loading,     setLoading]     = useState(true);

  const fetchAll = useCallback(async () => {
    if (!currentUser) { setLoading(false); return; }
    const [drivingRes, passengerRes] = await Promise.all([
      supabase.from('rides').select('*, ride_requests(*)').eq('driver_id', currentUser.id).order('created_at', { ascending: false }),
      supabase.from('ride_requests').select('*, rides(*)').eq('passenger_id', currentUser.id).order('created_at', { ascending: false }),
    ]) as [{ data: RideRow[] | null }, { data: (RideRequestRow & { rides?: RideRow | null })[] | null }];
    if (drivingRes.data)  setMyDriving(drivingRes.data.map(mapRide));
    if (passengerRes.data) setMyPassenger(passengerRes.data.map(row => ({ ...mapRequest(row), ride: row.rides ? mapRide({ ...row.rides, ride_requests: [] }) : null })));
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    fetchAll();
    if (!currentUser) return;
    const key = Math.random().toString(36).slice(2, 6);
    const ch = supabase.channel(`my-rides-${currentUser.id}-${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides',         filter: `driver_id=eq.${currentUser.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests', filter: `passenger_id=eq.${currentUser.id}` }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUser?.id, fetchAll]);

  return { myDriving, myPassenger, loading, refetch: fetchAll };
}
