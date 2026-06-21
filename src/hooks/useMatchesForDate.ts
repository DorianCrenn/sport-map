import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

type DBRow = Record<string, unknown>;

interface UseMatchesForDateOptions {
  date:     Date | string;
  clubIds?: string[];
  sports?:  string[];
  skip?:    boolean;
}

export function useMatchesForDate({ date, clubIds, sports, skip = false }: UseMatchesForDateOptions) {
  const [matches, setMatches] = useState<DBRow[]>([]);
  const [loading, setLoading] = useState(false);

  const dateKey   = date instanceof Date ? date.toDateString() : String(date);
  const clubKey   = Array.isArray(clubIds) ? clubIds.join(',') : '';
  const sportKey  = Array.isArray(sports)  ? sports.join(',')  : '';
  const shouldSkip = skip || (Array.isArray(clubIds) && clubIds.length === 0);

  useEffect(() => {
    if (shouldSkip) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const d        = date instanceof Date ? date : new Date(date);
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(d); dayEnd.setHours(23, 59, 59, 999);

      let query = supabase
        .from('events')
        .select('id, title, sport, date, score, club_id, venue, city, level, event_type, man_of_match, team_name')
        .gte('date', dayStart.toISOString())
        .lte('date', dayEnd.toISOString())
        .order('date', { ascending: true })
        .limit(200);

      if (Array.isArray(clubIds) && clubIds.length > 0) query = query.in('club_id', clubIds.map(String));
      if (Array.isArray(sports) && sports.length > 0)  query = query.in('sport', sports);

      const { data } = await query as { data: DBRow[] | null };
      if (!cancelled) { setMatches(data ?? []); setLoading(false); }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, clubKey, sportKey, shouldSkip]);

  return { matches: shouldSkip ? [] : matches, loading: shouldSkip ? false : loading };
}
