import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Retourne le classement des clubs par nombre d'événements sur le mois courant.
 * Chaque entrée : { rank, club: { id, name, sport, city, logo_url }, eventCount }
 */
export function useClubLeaderboard({ limit = 10, sportFilter = null } = {}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('club_monthly_leaderboard')
          .select('club_id, name, sport, city, logo_url, event_count, rank')
          .order('rank', { ascending: true })
          .limit(limit);

        if (sportFilter) query = query.eq('sport', sportFilter);

        const { data, error: err } = await query;
        if (err) throw new Error(err.message);
        if (cancelled) return;

        const ranked = (data ?? []).map(row => ({
          rank:       row.rank,
          club:       { id: row.club_id, name: row.name, sport: row.sport, city: row.city, logo_url: row.logo_url },
          eventCount: row.event_count,
        }));

        setLeaderboard(ranked);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [limit, sportFilter]);

  return { leaderboard, loading, error };
}
