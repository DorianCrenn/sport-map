import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useUserLeaderboard({ limit = 10 } = {}) {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, xp, badges, plan')
        .order('xp', { ascending: false })
        .limit(limit);

      if (!cancelled) {
        if (!error && data) setRanking(data);
        setLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [limit]);

  return { ranking, loading };
}
