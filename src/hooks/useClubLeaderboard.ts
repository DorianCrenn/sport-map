import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

interface LeaderboardEntry {
  rank: number;
  club: { id: string; name: string; sport: string; city: string; logo_url: string | null };
  eventCount: number;
}

interface UseClubLeaderboardOptions {
  limit?: number;
  sportFilter?: string | null;
}

interface UseClubLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

export function useClubLeaderboard({ limit = 10, sportFilter = null }: UseClubLeaderboardOptions = {}): UseClubLeaderboardResult {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

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

        const { data, error: err } = await query as { data: Record<string, unknown>[] | null; error: { message: string } | null };
        if (err) throw new Error(err.message);
        if (cancelled) return;

        const ranked = (data ?? []).map(row => ({
          rank:       row.rank as number,
          club:       { id: String(row.club_id), name: (row.name as string) ?? 'Club inconnu', sport: (row.sport as string) ?? '', city: (row.city as string) ?? '', logo_url: (row.logo_url as string | null) ?? null },
          eventCount: row.event_count as number,
        }));

        setLeaderboard(ranked);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [limit, sportFilter]);

  return { leaderboard, loading, error };
}
