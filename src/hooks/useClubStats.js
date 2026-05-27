import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubStats(clubId) {
  const [stats, setStats]     = useState([]);   // par team_name
  const [form5, setForm5]     = useState({});   // { teamName: ['W','D','L',...] }
  const [topMotm, setTopMotm] = useState([]);   // top joueur du match
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    let cancelled = false;

    Promise.all([
      // Agrégats depuis la vue
      supabase
        .from('club_stats')
        .select('*')
        .eq('club_id', String(clubId)),

      // 10 derniers matchs avec score pour la forme
      supabase
        .from('events')
        .select('team_name, home_or_away, score, date')
        .eq('club_id', String(clubId))
        .not('score', 'is', null)
        .order('date', { ascending: false })
        .limit(50),

      // Top joueur du match (occurrences man_of_match)
      supabase
        .from('events')
        .select('man_of_match')
        .eq('club_id', String(clubId))
        .not('man_of_match', 'is', null)
        .not('man_of_match', 'eq', ''),
    ]).then(([statsRes, recentRes, motmRes]) => {
      if (cancelled) return;

      setStats(statsRes.data ?? []);

      // Forme par équipe (5 derniers résultats)
      const recentByTeam = {};
      for (const e of recentRes.data ?? []) {
        const key = e.team_name ?? 'Équipe';
        if (!recentByTeam[key]) recentByTeam[key] = [];
        if (recentByTeam[key].length >= 5) continue;
        const h = parseInt(e.score?.home ?? 0);
        const a = parseInt(e.score?.away ?? 0);
        let result;
        if (h === a) result = 'D';
        else if ((e.home_or_away === 'home' && h > a) || (e.home_or_away === 'away' && a > h)) result = 'W';
        else result = 'L';
        recentByTeam[key].push(result);
      }
      setForm5(recentByTeam);

      // Top MOTM
      const motmCount = {};
      for (const e of motmRes.data ?? []) {
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
