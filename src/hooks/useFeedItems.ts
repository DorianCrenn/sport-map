/**
 * useFeedItems — Agrège les données Supabase en FeedItem[] pour ClubFeed.
 *
 * Mappe :
 *   club_announcements  → FlashFeedItem
 *   events futurs       → MatchFeedItem
 *   events avec score   → FlashFeedItem (badge success)
 *   rides actifs        → CarpoolFeedItem
 */

import { useMemo } from 'react';
import { useNewsFeed } from './useNewsFeed.js';
import type {
  FeedItem,
  MatchFeedItem,
  FlashFeedItem,
  ResultFeedItem,
  CarpoolFeedItem,
  FlashBadge,
} from '../components/feed/feed.types';

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapAnnouncement(ann: Record<string, unknown>): FlashFeedItem {
  const BADGE: Record<string, FlashBadge> = {
    urgent: 'alert', result: 'success', info: 'info', event: 'info',
  };
  return {
    id:              `ann-${ann.id}`,
    type:            'flash',
    club_id:         String(ann.club_id),
    created_at:      ann.created_at as string,
    announcement_id: ann.id as string,
    title:           ann.title as string | undefined,
    message:         ann.message as string,
    badge:           BADGE[ann.type as string] ?? 'info',
    author_name:     (ann.author_name ?? ann.club_name) as string | undefined,
  };
}

function mapUpcoming(event: Record<string, unknown>): MatchFeedItem {
  // Tente de parser "Équipe A vs Équipe B" depuis le titre
  const title = (event.title as string) ?? '';
  const parts = title.split(/\svs\.?\s/i);
  const homeTeam = parts[0]?.trim() || title || 'À venir';
  const awayTeam = parts[1]?.trim() || '';

  const d = new Date(event.date as string);
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    id:               `evt-${event.id}`,
    type:             'match',
    club_id:          String(event.club_id),
    created_at:       event.date as string,
    event_id:         event.id as string,
    home_team:        homeTeam,
    away_team:        awayTeam,
    date:             d.toISOString().slice(0, 10),
    time:             `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    venue:            (event.venue as string) ?? '',
    city:             (event.city as string) ?? '',
    sport:            (event.sport as string) ?? 'Football',
    poster_url:        event.poster_url as string | undefined,
    attendee_count:    0,
    user_is_attending: false,
    club_name:         (event.clubs as any)?.name      ?? undefined,
    club_logo_url:     (event.clubs as any)?.logo_url  ?? undefined,
    event_type:        (event.event_type as string)    ?? undefined,
  };
}

function mapRide(
  ride: Record<string, any>,
  eventMap: Map<string, Record<string, any>>,
): CarpoolFeedItem {
  const event = eventMap.get(String(ride.event_id));
  const requests: { status: string }[] = Array.isArray(ride.ride_requests) ? ride.ride_requests : [];
  const acceptedCount = requests.filter(r => r.status === 'accepted').length;
  const totalSeats = ride.available_seats as number;
  // Si ride_requests non accessible (RLS), on se rabat sur le status
  const freeSeats = ride.status === 'full'
    ? 0
    : Math.max(0, totalSeats - acceptedCount);

  return {
    id:                 `ride-${ride.id}`,
    type:               'carpool',
    club_id:            String(event?.club_id ?? ''),
    created_at:         ride.created_at as string,
    ride_id:            ride.id as string,
    driver_name:        ride.driver_name as string,
    destination:        String(event?.city || event?.venue || ride.departure_location || 'Destination'),
    departure_location: ride.departure_location as string,
    departure_time:     ride.departure_time as string,
    total_seats:        totalSeats,
    available_seats:    freeSeats,
    event_id:           ride.event_id as string,
  };
}

function mapResult(event: Record<string, unknown>): ResultFeedItem {
  const sc = event.score as Record<string, number> | string | null;
  let scoreHome = 0, scoreAway = 0;
  if (sc && typeof sc === 'object' && 'home' in sc) {
    scoreHome = Number(sc.home) || 0;
    scoreAway = Number(sc.away) || 0;
  } else if (typeof sc === 'string') {
    const m = sc.match(/(\d+)\D+(\d+)/);
    if (m) { scoreHome = parseInt(m[1]); scoreAway = parseInt(m[2]); }
  }

  const title = (event.title as string) ?? '';
  const parts = title.split(/\svs\.?\s/i);
  const homeTeam = parts[0]?.trim() || title || 'Domicile';
  const awayTeam = parts[1]?.trim() || 'Extérieur';

  return {
    id:            `res-${event.id}`,
    type:          'result',
    club_id:       String(event.club_id),
    created_at:    event.date as string,
    event_id:      event.id as string,
    home_team:     homeTeam,
    away_team:     awayTeam,
    score_home:    scoreHome,
    score_away:    scoreAway,
    sport:         (event.sport as string) ?? 'Football',
    date:          event.date as string,
    club_name:     (event.clubs as any)?.name     ?? undefined,
    club_logo_url: (event.clubs as any)?.logo_url ?? undefined,
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFeedItems(
  followedClubIds: string[],
  follows: { clubId: string; teams: 'all' | string[] }[] = [],
  managedClubIds: string[] = [],
) {
  const { announcements, results, upcoming, rides, loading } = useNewsFeed({ followedClubIds, follows: follows as any, managedClubIds });

  const items = useMemo<FeedItem[]>(() => {
    // Lookup event → city/venue pour les destinations de covoiturage
    const eventMap = new Map(upcoming.map((e: any) => [String(e.id), e]));

    const all: FeedItem[] = [
      ...upcoming.map(mapUpcoming),
      ...((announcements as any[]).map(mapAnnouncement)),
      ...results.map(mapResult),
      ...rides.map((r: any) => mapRide(r, eventMap)),
    ];

    // Trie du plus récent au plus ancien
    return all.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [upcoming, announcements, results, rides]);

  return { items, loading };
}
