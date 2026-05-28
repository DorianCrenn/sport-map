import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Retourne le profil joueur de l'utilisateur connecté (depuis club_players).
// Retourne null si l'utilisateur n'est rattaché à aucune équipe.
export function useMyPlayerProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) { setProfile(null); setLoading(false); return; }
    let cancelled = false;
    supabase
      .from('club_players')
      .select('id, club_id, team_id, name, number, position')
      .eq('user_id', currentUser.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) { setProfile(data ?? null); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  return { profile, loading };
}
