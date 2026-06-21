import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export interface ClubEventItem {
  id: string;
  clubId: string;
  date: string;
  title: string;
  sport: string;
  venue: string;
  city: string;
  teamName: string;
  adversaire: string;
  homeOrAway: 'home' | 'away';
  isHome: boolean;
  eventType: string;
  category: string;
  level: string;
  score: { home: number; away: number } | null;
  scoreHome: number | null;
  scoreAway: number | null;
  championship: string | null;
  homeTeam: string;
  awayTeam: string;
  isPublishedOnMap: boolean;
}

export function useClubEvents(clubId: string | null | undefined, clubName = ''): ClubEventItem[] {
  const [events, setEvents] = useState<ClubEventItem[]>([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    supabase
      .from('events')
      .select('id, title, date, sport, venue, city, team_name, adversaire, home_or_away, event_type, score, category, level, cup_type, club_id, is_archived')
      .eq('club_id', String(clubId))
      .eq('is_archived', false)
      .order('date')
      .then(({ data }: { data: Record<string, unknown>[] | null }) => {
        if (cancelled || !data) return;
        const name = clubName || '';
        setEvents(data.map(ev => {
          const isHome = ev.home_or_away !== 'away';
          const score = ev.score as { home?: number; away?: number } | null;
          return {
            id:              String(ev.id),
            clubId:          String(clubId),
            date:            (ev.date as string) ?? '',
            title:           (ev.title as string) ?? '',
            sport:           (ev.sport as string) ?? '',
            venue:           (ev.venue as string)           ?? '',
            city:            (ev.city as string)            ?? '',
            teamName:        (ev.team_name as string)       ?? '',
            adversaire:      (ev.adversaire as string)      ?? '',
            homeOrAway:      (ev.home_or_away as 'home' | 'away') ?? 'home',
            isHome,
            eventType:       (ev.event_type as string)      ?? 'friendly',
            category:        (ev.category as string)        ?? '',
            level:           (ev.level as string)           ?? '',
            score:           ev.score as { home: number; away: number } | null ?? null,
            scoreHome:       score?.home ?? null,
            scoreAway:       score?.away ?? null,
            championship:    (ev.level as string) || null,
            homeTeam:        isHome ? name : ((ev.adversaire as string) ?? '—'),
            awayTeam:        isHome ? ((ev.adversaire as string) ?? '—') : name,
            isPublishedOnMap: true,
          };
        }));
      });

    return () => { cancelled = true; };
  }, [clubId, clubName]);

  return events;
}
