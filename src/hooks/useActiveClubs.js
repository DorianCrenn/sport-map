import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Retourne le classement des clubs les plus actifs du mois en cours.
 * "Actif" = nombre d'événements organisés ce mois-ci.
 */
export function useActiveClubs({ limit = 10 } = {}) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      // Step 1 — events of the month (club_id only, no join — TEXT field has no FK)
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('club_id')
        .gte('date', start)
        .lt('date', end)
        .not('club_id', 'is', null);

      if (cancelled || error || !eventsData) { setLoading(false); return; }

      const countMap = {};
      for (const row of eventsData) {
        countMap[row.club_id] = (countMap[row.club_id] ?? 0) + 1;
      }

      const clubIds = Object.keys(countMap);
      if (clubIds.length === 0) {
        if (!cancelled) { setRanking([]); setLoading(false); }
        return;
      }

      // Step 2 — fetch club details for those IDs
      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, name, sport, city, logo_url')
        .in('id', clubIds);

      const clubMap = {};
      for (const c of clubsData ?? []) {
        clubMap[String(c.id)] = c;
      }

      const sorted = clubIds
        .map(cid => {
          const c = clubMap[cid] ?? {};
          return {
            clubId:   cid,
            name:     c.name     ?? cid,
            sport:    c.sport    ?? '',
            city:     c.city     ?? '',
            logo_url: c.logo_url ?? null,
            count:    countMap[cid],
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      if (!cancelled) { setRanking(sorted); setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { ranking, loading };
}
