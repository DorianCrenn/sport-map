import { useState, useEffect } from 'react';
import { useAuthSafe } from '../contexts/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

// Lit le rôle simulé depuis sessionStorage (si le simulateur est actif)
function getSimRole() {
  try {
    const raw = sessionStorage.getItem('sl-role-simulator');
    if (!raw) return null;
    return JSON.parse(raw).role ?? null;
  } catch { return null; }
}

/**
 * Détermine le rôle métier de l'utilisateur courant dans la permission_matrix.
 *
 * Hiérarchie :
 *   null (non connecté) → 'visitor'
 *   admin/superadmin    → 'admin'
 *   club_admin          → 'club_admin'
 *   user + club_managers (manager/editor) → 'club_manager'
 *   user + club_managers (coach)          → 'coach'
 *   user + club_players.user_id           → 'player'
 *   user + player_guardians.user_id       → 'parent'
 *   user (défaut)                         → 'supporter'
 *
 * Le simulateur admin override tous ces calculs.
 */
export function useMyRole() {
  // useAuthSafe ne throw pas hors AuthProvider (ex: tests isolés)
  const auth        = useAuthSafe();
  const currentUser = auth?.currentUser ?? null;
  const isAdmin     = auth?.isAdmin     ?? false;
  const isClubAdmin = auth?.isClubAdmin ?? false;

  const [detectedRole, setDetectedRole] = useState(null);

  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) { setDetectedRole('visitor'); return; }
    if (isAdmin)     { setDetectedRole('admin');     return; }
    if (isClubAdmin) { setDetectedRole('club_admin'); return; }

    // Pour les users standard : déterminer le sous-rôle
    let cancelled = false;

    Promise.all([
      // Manager / coach dans club_managers
      supabase
        .from('club_managers')
        .select('role')
        .eq('user_id', uid)
        .eq('status', 'active')
        .limit(1),
      // Joueur lié
      supabase
        .from('club_players')
        .select('id')
        .eq('user_id', uid)
        .eq('is_active', true)
        .limit(1),
      // Tuteur légal
      supabase
        .from('player_guardians')
        .select('id')
        .eq('user_id', uid)
        .limit(1),
    ]).then(([mgr, player, guardian]) => {
      if (cancelled) return;
      const mgrRole = mgr.data?.[0]?.role;
      if (mgrRole === 'manager' || mgrRole === 'editor') {
        setDetectedRole('club_manager');
      } else if (mgrRole === 'coach') {
        setDetectedRole('coach');
      } else if (player.data?.length > 0) {
        setDetectedRole('player');
      } else if (guardian.data?.length > 0) {
        setDetectedRole('parent');
      } else {
        setDetectedRole('supporter');
      }
    }).catch(() => {
      if (!cancelled) setDetectedRole('supporter');
    });

    return () => { cancelled = true; };
  }, [currentUser?.id, isAdmin, isClubAdmin]);

  // Le simulateur override en temps réel (lit sessionStorage à chaque render)
  const simRole = getSimRole();

  const role = simRole ?? detectedRole ?? (currentUser ? 'supporter' : 'visitor');

  const isSimulating = !!simRole;

  return { role, isSimulating, detectedRole };
}
