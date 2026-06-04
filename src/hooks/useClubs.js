import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapFromDB(row) {
  return {
    id:              row.id,
    name:            row.name,
    sport:           row.sport,
    city:            row.city             ?? '',
    description:     row.description      ?? '',
    logoUrl:         row.logo_url         ?? null,
    logo:            row.logo_url         ?? null,
    website:         row.website          ?? '',
    phone:           row.phone            ?? '',
    email:           row.email            ?? '',
    categories:      row.categories       ?? [],
    userId:          row.user_id,
    // Statut de vérification
    status:          row.status           ?? 'pending_verification',
    verificationNote: row.verification_note ?? null,
    verifiedAt:      row.verified_at      ?? null,
    // Identité enrichie
    sigle:           row.sigle            ?? '',
    slogan:          row.slogan           ?? '',
    foundingYear:    row.founding_year    ?? null,
    primaryColor:    row.primary_color    ?? '#22C55E',
    bannerUrl:       row.banner_url       ?? null,
    // Localisation
    venue:           row.venue            ?? '',
    address:         row.address          ?? '',
    postalCode:      row.postal_code      ?? '',
    region:          row.region           ?? '',
    lat:             row.lat              ?? null,
    lng:             row.lng              ?? null,
    // Contact
    managerName:     row.manager_name     ?? '',
    managerFunction: row.manager_function ?? '',
    managerPhone:    row.manager_phone    ?? '',
    // Sport & effectif
    memberCount:     row.member_count     ?? null,
    level:           row.level            ?? '',
    // Réseaux sociaux
    facebook:        row.facebook         ?? '',
    instagram:       row.instagram        ?? '',
    tiktok:          row.tiktok           ?? '',
    isUserCreated: true,
  };
}

function mapToDB(data, userId) {
  return {
    name:             data.name,
    sport:            data.sport,
    city:             data.city             ?? '',
    description:      data.description      ?? '',
    logo_url:         data.logoUrl          ?? null,
    website:          data.website          ?? '',
    phone:            data.phone            ?? '',
    email:            data.email            ?? '',
    categories:       data.categories       ?? [],
    user_id:          userId,
    // Identité enrichie
    sigle:            data.sigle            ?? '',
    slogan:           data.slogan           ?? '',
    founding_year:    data.foundingYear     ?? null,
    primary_color:    data.primaryColor     ?? '#22C55E',
    banner_url:       data.bannerUrl        ?? null,
    // Localisation
    venue:            data.venue            ?? '',
    address:          data.address          ?? '',
    postal_code:      data.postalCode       ?? '',
    region:           data.region           ?? '',
    lat:              data.lat              ?? null,
    lng:              data.lng              ?? null,
    // Contact
    manager_name:     data.managerName      ?? '',
    manager_function: data.managerFunction  ?? '',
    manager_phone:    data.managerPhone     ?? '',
    // Sport & effectif
    member_count:     data.memberCount      ?? null,
    level:            data.level            ?? '',
    // Réseaux sociaux
    facebook:         data.facebook         ?? '',
    instagram:        data.instagram        ?? '',
    tiktok:           data.tiktok           ?? '',
    // status n'est PAS inclus — géré par les actions admin et le DEFAULT DB
  };
}

export function useClubs() {
  const { currentUser } = useAuth();
  const [userClubs, setUserClubs] = useState([]);
  const channelId = useRef(`clubs-rt-${currentUser?.id ?? 'anon'}`);
  const [loading, setLoading]    = useState(true);
  const userClubsRef = useRef([]);
  useEffect(() => { userClubsRef.current = userClubs; }, [userClubs]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Clubs] fetch failed:', error.message);
          setLoading(false);
          return;
        }
        setUserClubs(data?.map(mapFromDB) ?? []);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('[Clubs] fetch rejected:', err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.some(c => c.id === row.id) ? prev : [mapFromDB(row), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.map(c => c.id === row.id ? mapFromDB(row) : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clubs' }, ({ old: row }) => {
        setUserClubs(prev => prev.filter(c => c.id !== row.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addClub = useCallback(async (data) => {
    const userId = currentUser?.id;
    const { data: saved, error } = await supabase
      .from('clubs')
      .insert(mapToDB(data, userId))
      .select()
      .single();

    if (error) {
      console.error('[Clubs] addClub failed:', error.message);
      throw error;
    }
    const club = mapFromDB(saved);
    setUserClubs(prev => (prev.some(c => c.id === club.id) ? prev : [club, ...prev]));
    return club;
  }, [currentUser?.id]);

  const addClubAndNotify = useCallback(async (data) => {
    const club = await addClub(data);
    // Notification aux admins + confirmation au créateur (fire-and-forget)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.functions.invoke('notify-admin-club-created', {
        body: { club_id: club.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(err => console.warn('[addClubAndNotify] notification failed:', err.message));
    });
    return club;
  }, [addClub]);

  const updateClub = useCallback(async (id, patch) => {
    const snapshot = userClubsRef.current.find(c => c.id === id);
    setUserClubs(clubs => clubs.map(c => c.id === id ? { ...c, ...patch } : c));
    try {
      const merged = snapshot ? { ...snapshot, ...patch } : patch;
      const { error } = await supabase
        .from('clubs')
        .update(mapToDB(merged, currentUser?.id))
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Clubs] updateClub failed, rolling back:', err.message);
      if (snapshot) setUserClubs(clubs => clubs.map(c => c.id === id ? snapshot : c));
      throw err;
    }
  }, [currentUser?.id]);

  const deleteClub = useCallback(async (id) => {
    const snapshot    = userClubsRef.current.find(c => c.id === id);
    const snapshotIdx = userClubsRef.current.findIndex(c => c.id === id);
    setUserClubs(clubs => clubs.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Clubs] deleteClub failed, rolling back:', err.message);
      if (snapshot) {
        setUserClubs(clubs => {
          const next = [...clubs];
          next.splice(snapshotIdx, 0, snapshot);
          return next;
        });
      }
      throw err;
    }
  }, []);

  // ── Mutations admin (statuts) ─────────────────────────────────────────────

  const verifyClub = useCallback(async (id, note = '') => {
    const { error } = await supabase.from('clubs').update({
      status:            'verified',
      verification_note: note || null,
      verified_at:       new Date().toISOString(),
      verified_by:       currentUser?.id,
    }).eq('id', id);
    if (error) throw error;
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'verified', verificationNote: note } : c));
  }, [currentUser?.id]);

  const rejectClub = useCallback(async (id, note = '') => {
    const { error } = await supabase.from('clubs').update({
      status:            'rejected',
      verification_note: note || null,
    }).eq('id', id);
    if (error) throw error;
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', verificationNote: note } : c));
  }, []);

  const requestClubInfo = useCallback(async (id, note = '') => {
    const { error } = await supabase.from('clubs').update({
      status:            'pending_verification',
      verification_note: note || null,
    }).eq('id', id);
    if (error) throw error;
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'pending_verification', verificationNote: note } : c));
  }, []);

  const suspendClub = useCallback(async (id, note = '') => {
    const { error } = await supabase.from('clubs').update({
      status:            'suspended',
      verification_note: note || null,
    }).eq('id', id);
    if (error) throw error;
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'suspended', verificationNote: note } : c));
  }, []);

  return {
    userClubs,
    loading,
    addClub,
    addClubAndNotify,
    updateClub,
    deleteClub,
    verifyClub,
    rejectClub,
    requestClubInfo,
    suspendClub,
  };
}
