import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export interface LiveScore { scoreHome: number; scoreAway: number; status: string; }

export function useClubLiveScores(eventIds: string[]): Record<string, LiveScore> {
  const [liveMap, setLiveMap] = useState<Record<string, LiveScore>>({});
  const keyRef = useRef('');
  const key = eventIds.slice().sort().join(',');

  useEffect(() => {
    if (!eventIds.length) { setLiveMap({}); return; }
    keyRef.current = key;

    async function load() {
      const { data } = await supabase
        .from('match_scores')
        .select('event_id, score_home, score_away, status')
        .in('event_id', eventIds)
        .eq('status', 'in_progress');
      const map: Record<string, LiveScore> = {};
      for (const row of data ?? []) {
        map[row.event_id] = { scoreHome: row.score_home ?? 0, scoreAway: row.score_away ?? 0, status: row.status };
      }
      if (keyRef.current === key) setLiveMap(map);
    }
    load();

    const channel = supabase
      .channel(`club-live-scores-${key.slice(0, 32)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_scores' }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return liveMap;
}
