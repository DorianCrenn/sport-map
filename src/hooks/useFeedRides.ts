import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { demoEvents }       from '../demo/data/events.js';
import { demoRides, demoRideRequests } from '../demo/data/rides.js';

export interface MatchWithRides {
  eventId:        string;
  date:           string;
  sport:          string;
  adversaire:     string;
  venue:          string;
  clubId:         string;
  clubName:       string;
  teamName:       string;
  category:       string;
  totalRides:     number;
  availableSeats: number;
}

export function useFeedRides(clubIds: string[], teamFilters: string[] = []) {
  const [items,   setItems]   = useState<MatchWithRides[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubIds.length) { setLoading(false); return; }
    let cancelled = false;

    const today = new Date().toISOString().slice(0, 10);
    const end   = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

    if (isDemoMode()) {
      // Données démo : rides calculés depuis les fichiers locaux
      const acceptedByRide: Record<string, number> = {};
      for (const req of demoRideRequests) {
        if (req.status === 'accepted') acceptedByRide[req.ride_id] = (acceptedByRide[req.ride_id] ?? 0) + 1;
      }
      const ridesByEvent: Record<string, typeof demoRides> = {};
      for (const ride of demoRides) {
        if (ride.status === 'cancelled') continue;
        if (!ridesByEvent[ride.event_id]) ridesByEvent[ride.event_id] = [];
        ridesByEvent[ride.event_id].push(ride);
      }
      const items: MatchWithRides[] = (demoEvents as any[])
        .filter(e => {
          const d = new Date(e.date).toISOString().slice(0, 10);
          const filtered = teamFilters.length ? teamFilters.some((f: string) => e.team_name === f || e.category === f) : true;
          return d >= today && d <= end && ridesByEvent[e.id]?.length > 0 && filtered;
        })
        .map(e => {
          const rides = ridesByEvent[e.id];
          const totalSeats = rides.reduce((s, r) => s + Math.max(0, r.available_seats - (acceptedByRide[r.id] ?? 0)), 0);
          return {
            eventId:        String(e.id),
            date:           new Date(e.date).toISOString().slice(0, 10),
            sport:          String(e.sport ?? ''),
            adversaire:     String(e.adversaire ?? ''),
            venue:          String(e.venue ?? ''),
            clubId:         String(e.club_id),
            clubName:       'FC SportLink Démo',
            teamName:       String(e.team_name ?? ''),
            category:       String(e.category ?? ''),
            totalRides:     rides.length,
            availableSeats: totalSeats,
          };
        });
      setItems(items);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: events } = await supabase
        .from('events')
        .select('id, date, sport, adversaire, venue, club_id, team_name, category, clubs(name)')
        .in('club_id', clubIds)
        .gte('date', today)
        .lte('date', end)
        .in('event_type', ['match', 'friendly', 'championship', 'cup'])
        .order('date')
        .limit(20) as { data: any[] | null };

      if (cancelled || !events) { if (!cancelled) setLoading(false); return; }

      const filtered = teamFilters.length
        ? events.filter(e => teamFilters.some(f => e.team_name === f || e.category === f))
        : events;

      if (!filtered.length) { setItems([]); setLoading(false); return; }

      const eventIds = filtered.map(e => String(e.id));
      const { data: rides } = await supabase
        .from('rides')
        .select('event_id, available_seats, ride_requests(status)')
        .in('event_id', eventIds)
        .neq('status', 'cancelled') as { data: any[] | null };

      if (cancelled) return;

      const rideMap: Record<string, { count: number; seats: number }> = {};
      for (const ride of rides ?? []) {
        const accepted = (ride.ride_requests ?? []).filter((r: any) => r.status === 'accepted').length;
        const left     = Math.max(0, ride.available_seats - accepted);
        if (!rideMap[ride.event_id]) rideMap[ride.event_id] = { count: 0, seats: 0 };
        rideMap[ride.event_id].count += 1;
        rideMap[ride.event_id].seats += left;
      }

      setItems(filtered.map(e => ({
        eventId:        String(e.id),
        date:           String(e.date ?? ''),
        sport:          String(e.sport ?? ''),
        adversaire:     String(e.adversaire ?? 'Adversaire'),
        venue:          String(e.venue ?? ''),
        clubId:         String(e.club_id),
        clubName:       String((e.clubs as any)?.name ?? ''),
        teamName:       String(e.team_name ?? ''),
        category:       String(e.category ?? ''),
        totalRides:     rideMap[String(e.id)]?.count ?? 0,
        availableSeats: rideMap[String(e.id)]?.seats ?? 0,
      })));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [clubIds.join(','), teamFilters.join(',')]);

  return { items, loading };
}
