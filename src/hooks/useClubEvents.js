import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Charge les événements d'un club depuis la table Supabase `events`.
 * Retourne le tableau dans le format attendu par ClubMatchesTab et NextMatchBlock
 * (homeTeam, awayTeam, scoreHome, scoreAway, eventType, homeOrAway...).
 */
export function useClubEvents(clubId, clubName = '') {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    supabase
      .from('events')
      .select('id, title, date, sport, venue, city, team_name, adversaire, home_or_away, event_type, score, category, level, cup_type, club_id, is_archived')
      .eq('club_id', String(clubId))
      .eq('is_archived', false)
      .order('date')
      .then(({ data }) => {
        if (cancelled || !data) return;
        setEvents(data.map(ev => {
          const isHome = ev.home_or_away !== 'away';
          const name = clubName || '';
          return {
            id:              ev.id,
            clubId:          String(clubId),
            date:            ev.date,
            title:           ev.title,
            sport:           ev.sport,
            venue:           ev.venue           ?? '',
            city:            ev.city            ?? '',
            teamName:        ev.team_name        ?? '',
            adversaire:      ev.adversaire       ?? '',
            homeOrAway:      ev.home_or_away     ?? 'home',
            isHome,
            eventType:       ev.event_type       ?? 'friendly',
            category:        ev.category         ?? '',
            level:           ev.level            ?? '',
            score:           ev.score            ?? null,
            scoreHome:       ev.score?.home      ?? null,
            scoreAway:       ev.score?.away      ?? null,
            championship:    ev.level            || null,
            homeTeam:        isHome ? name : (ev.adversaire ?? '—'),
            awayTeam:        isHome ? (ev.adversaire ?? '—') : name,
            isPublishedOnMap: true,
          };
        }));
      });

    return () => { cancelled = true; };
  }, [clubId, clubName]);

  return events;
}
