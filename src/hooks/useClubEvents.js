import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Charge les événements d'un club depuis la table Supabase `events`.
 * Retourne le tableau dans le format attendu par les blocs ClubPageView
 * (UpcomingEventsBlock, MatchesBlock, NextMatchBlock).
 */
export function useClubEvents(clubId) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    supabase
      .from('events')
      .select('id, title, date, sport, venue, city, team_name, adversaire, home_or_away')
      .eq('club_id', String(clubId))
      .order('date')
      .then(({ data }) => {
        if (cancelled || !data) return;
        setEvents(data.map(ev => ({
          id: ev.id,
          clubId: String(clubId),
          date: ev.date,
          title: ev.title,
          sport: ev.sport,
          venue: ev.venue,
          city: ev.city,
          teamName: ev.team_name,
          adversaire: ev.adversaire,
          isHome: ev.home_or_away === 'home',
          isPublishedOnMap: true,
        })));
      });

    return () => { cancelled = true; };
  }, [clubId]);

  return events;
}
