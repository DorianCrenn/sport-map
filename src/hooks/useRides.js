import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapRequest(row) {
  return {
    id:            row.id,
    rideId:        row.ride_id,
    passengerId:   row.passenger_id,
    passengerName: row.passenger_name ?? '',
    message:       row.message ?? '',
    status:        row.status,
    createdAt:     row.created_at,
  };
}

function mapRide(row) {
  const requests = (row.ride_requests ?? []).map(mapRequest);
  const accepted = requests.filter(r => r.status === 'accepted');
  return {
    id:                row.id,
    eventId:           row.event_id,
    driverId:          row.driver_id,
    driverName:        row.driver_name ?? '',
    departureLocation: row.departure_location,
    departureLat:      row.departure_lat,
    departureLng:      row.departure_lng,
    departureTime:     row.departure_time,
    availableSeats:    row.available_seats,
    acceptedEquipment: row.accepted_equipment ?? [],
    detourFlexibility: row.detour_flexibility ?? 'none',
    notes:             row.notes ?? '',
    status:            row.status,
    createdAt:         row.created_at,
    requests,
    takenSeats:        accepted.length,
    availableSeatsLeft: Math.max(0, row.available_seats - accepted.length),
    pendingCount:      requests.filter(r => r.status === 'pending').length,
  };
}

export function useRides(eventId) {
  const { currentUser } = useAuth();
  const [rides, setRides]     = useState([]);
  const [loading, setLoading] = useState(!!eventId);

  const fetchRides = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await supabase
      .from('rides')
      .select('*, ride_requests(*)')
      .eq('event_id', String(eventId))
      .order('created_at', { ascending: true });
    if (!error && data) setRides(data.map(mapRide));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    fetchRides();
    const key = Math.random().toString(36).slice(2, 6);
    const evId = String(eventId);
    const ch = supabase
      .channel(`rides-${evId}-${key}`)
      // Server-side filter: only receive changes for this event's rides
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rides', filter: `event_id=eq.${evId}` },
        fetchRides
      )
      // ride_requests has no event_id column — filter client-side via payload
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ride_requests' },
        (payload) => {
          const changedRideId = payload.new?.ride_id ?? payload.old?.ride_id;
          if (!changedRideId) return fetchRides();
          // Only refetch if the changed request belongs to one of our event's rides
          setRides(current => {
            const relevant = current.some(r => r.id === changedRideId);
            if (relevant) fetchRides();
            return current;
          });
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [eventId, fetchRides]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const createRide = useCallback(async (data) => {
    if (!currentUser) throw new Error('not authenticated');
    const { data: saved, error } = await supabase
      .from('rides')
      .insert({
        event_id:           String(eventId),
        driver_id:          currentUser.id,
        driver_name:        currentUser.name ?? '',
        departure_location: data.departureLocation,
        departure_lat:      data.departureLat  ?? null,
        departure_lng:      data.departureLng  ?? null,
        departure_time:     data.departureTime ?? null,
        available_seats:    data.availableSeats ?? 3,
        accepted_equipment: data.acceptedEquipment ?? [],
        detour_flexibility: data.detourFlexibility ?? 'none',
        notes:              data.notes || null,
        status:             'active',
      })
      .select()
      .single();
    if (error) throw error;
    await fetchRides();
    return mapRide({ ...saved, ride_requests: [] });
  }, [currentUser, eventId, fetchRides]);

  const cancelRide = useCallback(async (rideId) => {
    const ride = rides.find(r => r.id === rideId);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', rideId)
      .eq('driver_id', currentUser?.id);
    if (error) throw error;
    // Notify accepted passengers
    const accepted = ride?.requests.filter(r => r.status === 'accepted') ?? [];
    if (accepted.length > 0) {
      await supabase.from('ride_notifications').insert(
        accepted.map(r => ({
          user_id: r.passengerId, type: 'ride_cancelled', ride_id: rideId,
          data: { driverName: currentUser?.name, rideLocation: ride.departureLocation },
        }))
      );
    }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const requestRide = useCallback(async (rideId, message) => {
    if (!currentUser) throw new Error('not authenticated');
    const { data: saved, error } = await supabase
      .from('ride_requests')
      .insert({
        ride_id:        rideId,
        passenger_id:   currentUser.id,
        passenger_name: currentUser.name ?? '',
        message:        message || null,
        status:         'pending',
      })
      .select()
      .single();
    if (error) throw error;
    // Notify driver
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      await supabase.from('ride_notifications').insert({
        user_id: ride.driverId, type: 'new_request',
        ride_id: rideId, request_id: saved.id,
        data: { passengerName: currentUser.name, rideLocation: ride.departureLocation },
      });
    }
    await fetchRides();
    return mapRequest(saved);
  }, [currentUser, rides, fetchRides]);

  const cancelRequest = useCallback(async (requestId, rideId) => {
    const { error } = await supabase
      .from('ride_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('passenger_id', currentUser?.id);
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      await supabase.from('ride_notifications').insert({
        user_id: ride.driverId, type: 'passenger_cancelled',
        ride_id: rideId, request_id: requestId,
        data: { passengerName: currentUser?.name },
      });
    }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const acceptRequest = useCallback(async (requestId, rideId, passengerId, passengerName) => {
    const { error } = await supabase
      .from('ride_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    await supabase.from('ride_notifications').insert({
      user_id: passengerId, type: 'request_accepted',
      ride_id: rideId, request_id: requestId,
      data: { driverName: currentUser?.name, rideLocation: ride?.departureLocation },
    });
    // Mark ride as full if needed
    if (ride && ride.takenSeats + 1 >= ride.availableSeats) {
      await supabase.from('rides').update({ status: 'full' }).eq('id', rideId);
    }
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  const refuseRequest = useCallback(async (requestId, rideId, passengerId) => {
    const { error } = await supabase
      .from('ride_requests')
      .update({ status: 'refused' })
      .eq('id', requestId);
    if (error) throw error;
    const ride = rides.find(r => r.id === rideId);
    await supabase.from('ride_notifications').insert({
      user_id: passengerId, type: 'request_refused',
      ride_id: rideId, request_id: requestId,
      data: { driverName: currentUser?.name, rideLocation: ride?.departureLocation },
    });
    await fetchRides();
  }, [currentUser, rides, fetchRides]);

  return {
    rides, loading,
    createRide, cancelRide,
    requestRide, cancelRequest,
    acceptRequest, refuseRequest,
    refetch: fetchRides,
  };
}

// Separate hook for MyRidesPage — fetches all rides/requests for current user
export function useMyRides() {
  const { currentUser } = useAuth();
  const [myDriving,  setMyDriving]  = useState([]);
  const [myPassenger, setMyPassenger] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!currentUser) { setLoading(false); return; }
    const [drivingRes, passengerRes] = await Promise.all([
      supabase
        .from('rides')
        .select('*, ride_requests(*)')
        .eq('driver_id', currentUser.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('ride_requests')
        .select('*, rides(*)')
        .eq('passenger_id', currentUser.id)
        .order('created_at', { ascending: false }),
    ]);
    if (drivingRes.data)  setMyDriving(drivingRes.data.map(mapRide));
    if (passengerRes.data) {
      setMyPassenger(passengerRes.data.map(row => ({
        ...mapRequest(row),
        ride: row.rides ? mapRide({ ...row.rides, ride_requests: [] }) : null,
      })));
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    fetchAll();
    if (!currentUser) return;
    const key = Math.random().toString(36).slice(2, 6);
    const ch = supabase
      .channel(`my-rides-${currentUser.id}-${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides',         filter: `driver_id=eq.${currentUser.id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests', filter: `passenger_id=eq.${currentUser.id}` }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUser?.id, fetchAll]);

  return { myDriving, myPassenger, loading, refetch: fetchAll };
}
