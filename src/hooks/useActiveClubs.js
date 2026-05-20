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

      const { data, error } = await supabase
        .from('events')
        .select('club_id, clubs(id, name, sport, city, logo_url)')
        .gte('date', start)
        .lt('date', end)
        .not('club_id', 'is', null);

      if (cancelled || error || !data) { setLoading(false); return; }

      // Aggregate by club client-side
      const map = {};
      for (const row of data) {
        const cid = row.club_id;
        if (!cid) continue;
        if (!map[cid]) {
          map[cid] = {
            clubId:    cid,
            name:      row.clubs?.name      ?? cid,
            sport:     row.clubs?.sport     ?? '',
            city:      row.clubs?.city      ?? '',
            logo_url:  row.clubs?.logo_url  ?? null,
            count:     0,
          };
        }
        map[cid].count++;
      }

      const sorted = Object.values(map)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      if (!cancelled) { setRanking(sorted); setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { ranking, loading };
}
