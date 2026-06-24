import { useState, useEffect, useMemo } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useClubs } from './useClubs.js';
import type { SportLinkClub } from '../types/sportlink.js';

type ManagerRole = 'owner' | 'manager' | 'editor' | 'communicant';

export interface ManagedClub extends SportLinkClub {
  managerRole: ManagerRole;
}

interface ManagerRow { club_id: string; role: string; }

// Profils démo "visiteur" qui ne doivent pas hériter des clubs managés par l'email démo
const NON_ADMIN_DEMO_PROFILES = ['parent', 'player', 'supporter'];
// Profils démo "gestionnaire" qui voient le club démo comme club managé
const ADMIN_DEMO_PROFILES     = ['president', 'coach', 'communication'];
const DEMO_CLUB_ID            = 'demo-club-001';

export function useManagedClubs() {
  const { currentUser, isAdmin, isClubAdmin } = useAuth();
  const { userClubs, loading: clubsLoading } = useClubs();

  // En mode démo, les profils non-admin n'ont aucun club managé
  const demoProfile = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sl-demo-profile') : null;
  const isDemoNonAdmin = !!demoProfile && NON_ADMIN_DEMO_PROFILES.includes(demoProfile);
  const [managerRows,      setManagerRows]      = useState<ManagerRow[]>([]);
  const [managersLoading,  setManagersLoading]  = useState(false);

  useEffect(() => {
    if (!currentUser?.email) { setManagerRows([]); return; }
    let cancelled = false;
    setManagersLoading(true);
    supabase
      .from('club_managers')
      .select('club_id, role')
      .eq('email', currentUser.email.toLowerCase())
      .eq('status', 'active')
      .then(({ data }: { data: ManagerRow[] | null }) => {
        if (cancelled) return;
        setManagerRows(data ?? []);
        setManagersLoading(false);
      },
        () => { if (!cancelled) setManagersLoading(false); }
      );
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const roleByClubId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of managerRows) map[String(r.club_id)] = r.role;
    return map;
  }, [managerRows]);

  const managedClubs = useMemo<ManagedClub[]>(() => {
    if (isDemoNonAdmin) return [];

    // En mode démo avec profil admin, retourner le club démo directement (pas de currentUser réel)
    if (isDemoMode() && demoProfile && ADMIN_DEMO_PROFILES.includes(demoProfile)) {
      const demoClub = userClubs.find(c => String(c.id) === DEMO_CLUB_ID);
      if (demoClub) {
        const managerRole: ManagerRole = demoProfile === 'communication' ? 'communicant' : 'manager';
        return [{ ...demoClub, managerRole }];
      }
      return [];
    }

    const ids = new Set(Object.keys(roleByClubId));
    if (currentUser?.clubId) ids.add(String(currentUser.clubId));
    if (currentUser?.id) {
      userClubs.filter(c => String(c.userId) === String(currentUser.id)).forEach(c => ids.add(String(c.id)));
    }
    if (!ids.size) return [];
    return userClubs
      .filter(c => ids.has(String(c.id)))
      .map(c => {
        const cid     = String(c.id);
        const isOwner = isAdmin || isClubAdmin || String(c.userId) === String(currentUser?.id);
        const managerRole: ManagerRole = isOwner ? 'owner' : ((roleByClubId[cid] as ManagerRole) ?? 'manager');
        return { ...c, managerRole };
      });
  }, [isDemoNonAdmin, demoProfile, userClubs, roleByClubId, currentUser?.clubId, currentUser?.id, isAdmin, isClubAdmin]);

  const isCoachOrManager = useMemo(() => managedClubs.some(c => c.managerRole !== 'communicant'), [managedClubs]);
  const isCommunicant    = useMemo(() => managedClubs.some(c => c.managerRole === 'communicant'), [managedClubs]);

  return { managedClubs, isCoachOrManager, isCommunicant, loading: clubsLoading || managersLoading };
}
