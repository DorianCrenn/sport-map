import { supabase } from '../lib/supabase.js';
import { useQuery } from './useQuery.js';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  badges: string[];
  plan_tier: string;
}

interface UseUserLeaderboardResult {
  ranking: LeaderboardUser[];
  loading: boolean;
}

export function useUserLeaderboard({ limit = 10 }: { limit?: number } = {}): UseUserLeaderboardResult {
  const { data: ranking = [], loading } = useQuery<LeaderboardUser[]>(
    async () => {
      const { data, error } = await supabase
        .from('user_leaderboard')
        .select('id, name, avatar_url, xp, badges, plan_tier')
        .limit(limit) as { data: LeaderboardUser[] | null; error: { message: string } | null };
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    [limit],
    { initialData: [] },
  );

  return { ranking: ranking ?? [], loading };
}
