import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { DEMO_CLUB_ID } from '../demo/data/club.js';

// Ensemble des IDs de clubs où l'utilisateur fait partie de la COMMUNAUTÉ :
// joueur (club_players), parent d'un joueur (player_guardians) ou staff
// (club_managers). Sert à réserver le covoiturage à cette communauté (les
// supporters/visiteurs ne le voient pas).
export function useMyClubMemberships(): Set<string> {
  const { currentUser } = useAuth() as any;
  const [clubIds, setClubIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) { setClubIds(new Set()); return; }

    if (isDemoMode()) {
      // En démo, l'appartenance découle du profil choisi : tout profil sauf
      // « supporter » fait partie de la communauté du club de démonstration.
      const profile = sessionStorage.getItem('sl-demo-profile');
      setClubIds(profile && profile !== 'supporter' ? new Set([String(DEMO_CLUB_ID)]) : new Set());
      return;
    }

    let cancelled = false;
    (async () => {
      const [players, managers, guardians] = await Promise.all([
        supabase.from('club_players').select('club_id').eq('user_id', uid).eq('is_active', true),
        supabase.from('club_managers').select('club_id').eq('user_id', uid).eq('status', 'active'),
        supabase.from('player_guardians').select('player_id').eq('user_id', uid),
      ]);
      const ids = new Set<string>();
      for (const r of ((players.data ?? []) as { club_id: string }[]))  ids.add(String(r.club_id));
      for (const r of ((managers.data ?? []) as { club_id: string }[])) ids.add(String(r.club_id));
      const pids = ((guardians.data ?? []) as { player_id: string }[]).map(g => g.player_id);
      if (pids.length) {
        const { data: children } = await supabase
          .from('club_players').select('club_id').in('id', pids).eq('is_active', true) as { data: { club_id: string }[] | null };
        for (const r of (children ?? [])) ids.add(String(r.club_id));
      }
      if (!cancelled) setClubIds(ids);
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  return clubIds;
}
