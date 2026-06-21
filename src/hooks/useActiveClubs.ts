import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

interface ActiveClubEntry {
  clubId: string;
  name: string;
  sport: string;
  city: string;
  logo_url: string | null;
  count: number;
}

interface UseActiveClubsResult {
  ranking: ActiveClubEntry[];
  loading: boolean;
}

export function useActiveClubs({ limit = 10 }: { limit?: number } = {}): UseActiveClubsResult {
  const [ranking, setRanking] = useState<ActiveClubEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const now   = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      const { data: eventsData, error } = await supabase
        .from('events')
        .select('club_id')
        .gte('date', start)
        .lt('date', end)
        .not('club_id', 'is', null) as { data: { club_id?: string }[] | null; error: { message: string } | null };

      if (cancelled || error || !eventsData) { setLoading(false); return; }

      const countMap: Record<string, number> = {};
      for (const row of eventsData) {
        if (!row.club_id) continue;
        countMap[row.club_id] = (countMap[row.club_id] ?? 0) + 1;
      }

      const clubIds = Object.keys(countMap);
      if (clubIds.length === 0) {
        if (!cancelled) { setRanking([]); setLoading(false); }
        return;
      }

      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, name, sport, city, logo_url')
        .in('id', clubIds) as { data: { id: string; name?: string; sport?: string; city?: string; logo_url?: string | null }[] | null };

      const clubMap: Record<string, { id: string; name?: string; sport?: string; city?: string; logo_url?: string | null }> = {};
      for (const c of clubsData ?? []) clubMap[String(c.id)] = c;

      const sorted = clubIds
        .map(cid => {
          const c = (clubMap[cid] ?? {}) as { name?: string; sport?: string; city?: string; logo_url?: string | null };
          return { clubId: cid, name: c.name ?? cid, sport: c.sport ?? '', city: c.city ?? '', logo_url: c.logo_url ?? null, count: countMap[cid] };
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
