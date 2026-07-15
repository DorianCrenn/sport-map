import { useState, useEffect } from 'react';
import { useAuthSafe } from '../contexts/AuthContext.js';
import { supabase } from '../lib/supabase.js';

type MetaRole = 'visitor' | 'admin' | 'club_admin' | 'club_manager' | 'coach' | 'communicant' | 'player' | 'parent' | 'supporter';

function getSimRole(): MetaRole | null {
  try {
    const raw = sessionStorage.getItem('sl-role-simulator');
    if (!raw) return null;
    return (JSON.parse(raw) as { role?: MetaRole }).role ?? null;
  } catch { return null; }
}

interface UseMyRoleResult {
  role: MetaRole;
  isSimulating: boolean;
  detectedRole: MetaRole | null;
}

export function useMyRole(): UseMyRoleResult {
  const auth        = useAuthSafe();
  const currentUser = auth?.currentUser ?? null;
  const isAdmin     = auth?.isAdmin     ?? false;
  const isClubAdmin = auth?.isClubAdmin ?? false;

  const [detectedRole, setDetectedRole] = useState<MetaRole | null>(null);

  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) { setDetectedRole('visitor'); return; }
    if (isAdmin)     { setDetectedRole('admin');      return; }
    if (isClubAdmin) { setDetectedRole('club_admin'); return; }

    let cancelled = false;

    Promise.all([
      supabase.from('club_managers').select('role').eq('user_id', uid).eq('status', 'active').limit(1),
      supabase.from('club_players').select('id').eq('user_id', uid).eq('is_active', true).limit(1),
      supabase.from('player_guardians').select('id').eq('user_id', uid).limit(1),
    ]).then(([mgr, player, guardian]) => {
      if (cancelled) return;
      const mgrRole = (mgr.data as { role?: string }[] | null)?.[0]?.role;
      if (mgrRole === 'owner') {
        setDetectedRole('club_admin');           // propriétaire = droits club complets
      } else if (mgrRole === 'manager' || mgrRole === 'editor') {
        setDetectedRole('club_manager');
      } else if (mgrRole === 'coach') {
        setDetectedRole('coach');
      } else if (mgrRole === 'communicant') {
        setDetectedRole('communicant');          // communication uniquement (annonces)
      } else if ((player.data?.length ?? 0) > 0) {
        setDetectedRole('player');
      } else if ((guardian.data?.length ?? 0) > 0) {
        setDetectedRole('parent');
      } else {
        setDetectedRole('supporter');
      }
    }).catch(() => {
      if (!cancelled) setDetectedRole('supporter');
    });

    return () => { cancelled = true; };
  }, [currentUser?.id, isAdmin, isClubAdmin]);

  const simRole = getSimRole();
  const role: MetaRole = simRole ?? detectedRole ?? (currentUser ? 'supporter' : 'visitor');
  const isSimulating = !!simRole;

  return { role, isSimulating, detectedRole };
}
