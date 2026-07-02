import { useState, useEffect, useMemo } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useClubs } from './useClubs.js';
import type { SportLinkClub } from '../types/sportlink.js';
import { demoClubRow } from '../demo/data/club.js';

type ManagerRole = 'owner' | 'manager' | 'editor' | 'communicant';

export interface ManagedClub extends SportLinkClub {
  managerRole: ManagerRole;
}

interface ManagerRow { club_id: string; role: string; team_filter?: string | null; }

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
      .select('club_id, role, team_filter')
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

  const teamFilters = useMemo(
    () => managerRows.map(r => r.team_filter).filter((f): f is string => !!f),
    [managerRows],
  );

  const managedClubs = useMemo<ManagedClub[]>(() => {
    if (isDemoNonAdmin) return [];

    // En mode démo avec profil admin, construire le club démo directement depuis demoClubRow
    // (sans passer par userClubs qui est async → évite la race condition au premier render)
    if (isDemoMode() && demoProfile && ADMIN_DEMO_PROFILES.includes(demoProfile)) {
      const managerRole: ManagerRole = demoProfile === 'communication' ? 'communicant' : 'manager';
      return [{
        id:              DEMO_CLUB_ID,
        name:            demoClubRow.name,
        sport:           demoClubRow.sport,
        city:            demoClubRow.city,
        description:     demoClubRow.description,
        logoUrl:         demoClubRow.logo_url,
        logo:            demoClubRow.logo_url,
        website:         demoClubRow.website,
        phone:           demoClubRow.phone,
        email:           demoClubRow.email,
        categories:      demoClubRow.categories as any,
        userId:          demoClubRow.user_id,
        status:          demoClubRow.status as any,
        verificationNote: demoClubRow.verification_note,
        verifiedAt:      demoClubRow.verified_at,
        sigle:           demoClubRow.sigle,
        slogan:          demoClubRow.slogan,
        foundingYear:    demoClubRow.founding_year,
        primaryColor:    demoClubRow.primary_color,
        bannerUrl:       demoClubRow.banner_url,
        venue:           demoClubRow.venue,
        address:         demoClubRow.address,
        postalCode:      demoClubRow.postal_code,
        region:          demoClubRow.region,
        lat:             demoClubRow.lat,
        lng:             demoClubRow.lng,
        managerName:     demoClubRow.manager_name,
        managerFunction: demoClubRow.manager_function,
        managerPhone:    demoClubRow.manager_phone,
        memberCount:     demoClubRow.member_count,
        level:           demoClubRow.level,
        facebook:        demoClubRow.facebook,
        instagram:       demoClubRow.instagram,
        tiktok:          demoClubRow.tiktok,
        managerRole,
      }];
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

  return { managedClubs, isCoachOrManager, isCommunicant, teamFilters, loading: clubsLoading || managersLoading };
}
