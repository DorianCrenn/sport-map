import { supabase } from '../lib/supabase.js';
import { useQuery } from './useQuery.js';

export function useUserLeaderboard({ limit = 10 } = {}) {
  const { data: ranking = [], loading } = useQuery(
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, xp, badges, plan')
        .order('xp', { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    [limit],
    { initialData: [] }
  );

  return { ranking, loading };
}
