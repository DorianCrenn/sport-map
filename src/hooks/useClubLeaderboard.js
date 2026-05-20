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

    async function fetch() {
      setLoading(true);
      setError(null);

      try {
        const now           = new Date();
        const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // 1. Compter les événements par club ce mois-ci
        let query = supabase
          .from('events')
          .select('club_id')
          .gte('date', startOfMonth)
          .not('club_id', 'is', null);

        if (sportFilter) query = query.eq('sport', sportFilter);

        const { data: events, error: evErr } = await query;
        if (evErr) throw new Error(evErr.message);

        const counts = {};
        (events ?? []).forEach(e => {
          const cid = String(e.club_id);
          counts[cid] = (counts[cid] || 0) + 1;
        });

        const sorted = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit);

        if (cancelled) return;
        if (sorted.length === 0) { setLeaderboard([]); return; }

        // 2. Récupérer les détails des clubs
        const topIds = sorted.map(([id]) => id);
        const { data: clubs, error: clErr } = await supabase
          .from('clubs')
          .select('id, name, sport, city, logo_url')
          .in('id', topIds);

        if (clErr) throw new Error(clErr.message);
        if (cancelled) return;

        const clubMap = {};
        (clubs ?? []).forEach(c => { clubMap[String(c.id)] = c; });

        const ranked = sorted.map(([id, count], idx) => ({
          rank:       idx + 1,
          club:       clubMap[id] ?? { id, name: 'Club inconnu', sport: null, city: null, logo_url: null },
          eventCount: count,
        }));

        setLeaderboard(ranked);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [limit, sportFilter]);

  return { leaderboard, loading, error };
}
