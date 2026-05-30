import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubs } from './useClubs.js';

// Retourne tous les clubs que l'utilisateur peut gérer :
//   - son club principal (profiles.club_id)
//   - les clubs où il est manager actif (club_managers table)
export function useManagedClubs() {
  const { currentUser } = useAuth();
  const { userClubs, loading: clubsLoading } = useClubs();
  const [extraClubIds, setExtraClubIds] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) { setExtraClubIds([]); return; }
    let cancelled = false;
    setManagersLoading(true);
    supabase
      .from('club_managers')
      .select('club_id')
      .eq('email', currentUser.email.toLowerCase())
      .eq('status', 'active')
      .then(({ data }) => {
        if (cancelled) return;
        setExtraClubIds((data ?? []).map(r => String(r.club_id)));
        setManagersLoading(false);
      })
      .catch(() => { if (!cancelled) setManagersLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const managedClubs = useMemo(() => {
    const ids = new Set(extraClubIds);
    if (currentUser?.clubId) ids.add(String(currentUser.clubId));
    // Clubs créés par cet utilisateur (robustesse si profiles.club_id encore null)
    if (currentUser?.id) {
      userClubs
        .filter(c => String(c.userId) === String(currentUser.id))
        .forEach(c => ids.add(String(c.id)));
    }
    if (!ids.size) return [];
    return userClubs.filter(c => ids.has(String(c.id)));
  }, [userClubs, extraClubIds, currentUser?.clubId, currentUser?.id]);

  return { managedClubs, loading: clubsLoading || managersLoading };
}
