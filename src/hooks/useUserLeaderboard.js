import { supabase } from '../lib/supabase.js';
import { useQuery } from './useQuery.js';

export function useUserLeaderboard({ limit = 10 } = {}) {
  const { data: ranking = [], loading } = useQuery(
    async () => {
      // Utilise la vue user_leaderboard (SECURITY DEFINER) qui :
      // 1. Bypasse profiles_select_own_or_admin → retourne tous les profils
      // 2. N'expose pas les champs sensibles (email, role, club_id)
      // 3. Normalise plan_tier pour éviter les valeurs spoofées
      const { data, error } = await supabase
        .from('user_leaderboard')
        .select('id, name, avatar_url, xp, badges, plan_tier')
        .limit(limit);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    [limit],
    { initialData: [] }
  );

  return { ranking, loading };
}
