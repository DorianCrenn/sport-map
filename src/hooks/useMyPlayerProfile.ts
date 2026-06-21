import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

export interface PlayerProfile {
  id:         string;
  club_id:    string;
  team_id:    string | null;
  name:       string;
  number?:    number | null;
  position?:  string | null;
  allEntries: PlayerProfile[];
}

export function useMyPlayerProfile(): { profile: PlayerProfile | null; loading: boolean } {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) { setProfile(null); setLoading(false); return; }
    let cancelled = false;
    supabase
      .from('club_players')
      .select('id, club_id, team_id, name, number, position')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .then(({ data }: { data: Omit<PlayerProfile, 'allEntries'>[] | null }) => {
        if (!cancelled) {
          const rows = data ?? [];
          setProfile(rows.length > 0 ? { ...(rows[0] as Omit<PlayerProfile, 'allEntries'>), allEntries: rows as unknown as PlayerProfile[] } : null);
          setLoading(false);
        }
      },
        () => { if (!cancelled) setLoading(false); }
      );
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  return { profile, loading };
}
