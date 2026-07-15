import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

interface ClubStatRow { [key: string]: unknown; }
interface MotmEntry { name: string; count: number; }

interface UseClubStatsResult {
  stats: ClubStatRow[];
  form5: Record<string, ('W' | 'D' | 'L')[]>;
  topMotm: MotmEntry[];
  loading: boolean;
}

export function useClubStats(clubId: string | null | undefined): UseClubStatsResult {
  const [stats, setStats]     = useState<ClubStatRow[]>([]);
  const [form5, setForm5]     = useState<Record<string, ('W' | 'D' | 'L')[]>>({});
  const [topMotm, setTopMotm] = useState<MotmEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    let cancelled = false;

    if (isDemoMode()) {
      import('../demo/data/stats.js').then(({ demoClubStats, demoForm5 }) => {
        if (cancelled) return;
        setStats(demoClubStats as ClubStatRow[]);
        setForm5(demoForm5 as Record<string, ('W' | 'D' | 'L')[]>);
        setTopMotm([]);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    Promise.all([
      supabase.from('club_stats').select('*').eq('club_id', String(clubId)),
      supabase.from('events').select('team_name, home_or_away, score, date').eq('club_id', String(clubId)).not('score', 'is', null).order('date', { ascending: false }).limit(50),
      supabase.from('events').select('man_of_match').eq('club_id', String(clubId)).not('man_of_match', 'is', null).not('man_of_match', 'eq', ''),
    ]).then(([statsRes, recentRes, motmRes]) => {
      if (cancelled) return;

      setStats((statsRes.data ?? []) as ClubStatRow[]);

      const recentByTeam: Record<string, ('W' | 'D' | 'L')[]> = {};
      for (const e of (recentRes.data ?? []) as { team_name?: string; home_or_away?: string; score?: { home?: number; away?: number } | null; date?: string }[]) {
        const key = e.team_name ?? 'Équipe';
        if (!recentByTeam[key]) recentByTeam[key] = [];
        if (recentByTeam[key].length >= 5) continue;
        const h = parseInt(String(e.score?.home ?? 0), 10);
        const a = parseInt(String(e.score?.away ?? 0), 10);
        let result: 'W' | 'D' | 'L';
        if (h === a) result = 'D';
        else if ((e.home_or_away === 'home' && h > a) || (e.home_or_away === 'away' && a > h)) result = 'W';
        else result = 'L';
        recentByTeam[key].push(result);
      }
      setForm5(recentByTeam);

      const motmCount: Record<string, number> = {};
      for (const e of (motmRes.data ?? []) as { man_of_match?: string }[]) {
        const name = e.man_of_match?.trim();
        if (name) motmCount[name] = (motmCount[name] ?? 0) + 1;
      }
      const sorted = Object.entries(motmCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setTopMotm(sorted);

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clubId]);

  return { stats, form5, topMotm, loading };
}
