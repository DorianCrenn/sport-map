import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Retourne la liste des joueurs liés à l'utilisateur via player_guardians.
 * Chaque entrée : { playerId, name, teamId, clubId, relation }
 */
export function useParentChildren(userId) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) { setChildren([]); setLoading(false); return; }
    let cancelled = false;

    supabase
      .from('player_guardians')
      .select('player_id, relation, player:club_players(id, name, team_id, club_id, is_active)')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (cancelled) return;
        const active = (data ?? [])
          .filter(g => g.player?.is_active)
          .map(g => ({
            playerId: g.player_id,
            name:     g.player?.name ?? 'Joueur',
            teamId:   g.player?.team_id,
            clubId:   g.player?.club_id,
            relation: g.relation,
          }));
        setChildren(active);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { children, loading, isParent: children.length > 0 };
}
