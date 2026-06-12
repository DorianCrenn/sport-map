import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubs } from './useClubs.js';

// Retourne tous les clubs que l'utilisateur peut gérer, avec le rôle par club.
// managerRole par club : 'owner' | 'manager' | 'editor' | 'communicant'
// isCoachOrManager : a accès édition (manager/editor/owner) dans au moins un club
// isCommunicant    : a le rôle 'communicant' dans au moins un club
export function useManagedClubs() {
  const { currentUser, isAdmin, isClubAdmin } = useAuth();
  const { userClubs, loading: clubsLoading } = useClubs();

  // { clubId → role } depuis club_managers
  const [managerRows, setManagerRows] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) { setManagerRows([]); return; }
    let cancelled = false;
    setManagersLoading(true);
    supabase
      .from('club_managers')
      .select('club_id, role')
      .eq('email', currentUser.email.toLowerCase())
      .eq('status', 'active')
      .then(({ data }) => {
        if (cancelled) return;
        setManagerRows(data ?? []);
        setManagersLoading(false);
      })
      .catch(() => { if (!cancelled) setManagersLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const roleByClubId = useMemo(() => {
    const map = {};
    for (const r of managerRows) map[String(r.club_id)] = r.role;
    return map;
  }, [managerRows]);

  const managedClubs = useMemo(() => {
    const ids = new Set(Object.keys(roleByClubId));
    if (currentUser?.clubId) ids.add(String(currentUser.clubId));
    if (currentUser?.id) {
      userClubs
        .filter(c => String(c.userId) === String(currentUser.id))
        .forEach(c => ids.add(String(c.id)));
    }
    if (!ids.size) return [];
    return userClubs
      .filter(c => ids.has(String(c.id)))
      .map(c => {
        const cid = String(c.id);
        const isOwner = isAdmin || isClubAdmin
          || String(c.userId) === String(currentUser?.id);
        const managerRole = isOwner ? 'owner' : (roleByClubId[cid] ?? 'manager');
        return { ...c, managerRole };
      });
  }, [userClubs, roleByClubId, currentUser?.clubId, currentUser?.id, isAdmin, isClubAdmin]);

  const isCoachOrManager = useMemo(
    () => managedClubs.some(c => c.managerRole !== 'communicant'),
    [managedClubs],
  );

  const isCommunicant = useMemo(
    () => managedClubs.some(c => c.managerRole === 'communicant'),
    [managedClubs],
  );

  return {
    managedClubs,
    isCoachOrManager,
    isCommunicant,
    loading: clubsLoading || managersLoading,
  };
}
