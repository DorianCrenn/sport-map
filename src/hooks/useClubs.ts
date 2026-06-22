import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { dispatchError } from '../lib/errorBus.js';
import { enqueue } from '../lib/offlineQueue.js';
import type { SportLinkClub } from '../types/sportlink.js';

type DBRow = Record<string, unknown>;

function mapFromDB(row: DBRow): SportLinkClub {
  return {
    id:              String(row.id),
    name:            (row.name as string) ?? '',
    sport:           (row.sport as string) ?? '',
    city:            (row.city as string)              ?? '',
    description:     (row.description as string)       ?? '',
    logoUrl:         (row.logo_url as string | null)   ?? null,
    logo:            (row.logo_url as string | null)   ?? null,
    website:         (row.website as string)           ?? '',
    phone:           (row.phone as string)             ?? '',
    email:           (row.email as string)             ?? '',
    categories:      (row.categories as string[])      ?? [],
    userId:          row.user_id as string,
    status:          ((row.status as string) ?? 'pending_verification') as any,
    verificationNote: (row.verification_note as string | null) ?? null,
    verifiedAt:      (row.verified_at as string | null) ?? null,
    sigle:           (row.sigle as string)             ?? '',
    slogan:          (row.slogan as string)            ?? '',
    foundingYear:    (row.founding_year as number | null) ?? null,
    primaryColor:    (row.primary_color as string)     ?? '#22C55E',
    bannerUrl:       (row.banner_url as string | null) ?? null,
    venue:           (row.venue as string)             ?? '',
    address:         (row.address as string)           ?? '',
    postalCode:      (row.postal_code as string)       ?? '',
    region:          (row.region as string)            ?? '',
    lat:             (row.lat as number | null)        ?? null,
    lng:             (row.lng as number | null)        ?? null,
    managerName:     (row.manager_name as string)      ?? '',
    managerFunction: (row.manager_function as string)  ?? '',
    managerPhone:    (row.manager_phone as string)     ?? '',
    memberCount:     (row.member_count as number | null) ?? null,
    level:           (row.level as string)             ?? '',
    facebook:        (row.facebook as string)          ?? '',
    instagram:       (row.instagram as string)         ?? '',
    tiktok:          (row.tiktok as string)            ?? '',
    isUserCreated:   true,
  };
}

function mapToDB(data: Partial<SportLinkClub>, userId: string | null | undefined): Record<string, unknown> {
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
    sigle:            data.sigle            ?? '',
    slogan:           data.slogan           ?? '',
    founding_year:    data.foundingYear     ?? null,
    primary_color:    data.primaryColor     ?? '#22C55E',
    banner_url:       data.bannerUrl        ?? null,
    venue:            data.venue            ?? '',
    address:          data.address          ?? '',
    postal_code:      data.postalCode       ?? '',
    region:           data.region           ?? '',
    lat:              data.lat              ?? null,
    lng:              data.lng              ?? null,
    manager_name:     data.managerName      ?? '',
    manager_function: data.managerFunction  ?? '',
    manager_phone:    data.managerPhone     ?? '',
    member_count:     data.memberCount      ?? null,
    level:            data.level            ?? '',
    facebook:         data.facebook         ?? '',
    instagram:        data.instagram        ?? '',
    tiktok:           data.tiktok           ?? '',
  };
}

interface UseClubsResult {
  userClubs: SportLinkClub[];
  loading: boolean;
  addClub: (data: Partial<SportLinkClub>) => Promise<SportLinkClub>;
  addClubAndNotify: (data: Partial<SportLinkClub>) => Promise<SportLinkClub>;
  updateClub: (id: string, patch: Partial<SportLinkClub>) => Promise<void>;
  deleteClub: (id: string) => Promise<void>;
  verifyClub: (id: string, note?: string) => Promise<void>;
  rejectClub: (id: string, note?: string) => Promise<void>;
  requestClubInfo: (id: string, note?: string) => Promise<void>;
  suspendClub: (id: string, note?: string) => Promise<void>;
}

export function useClubs(): UseClubsResult {
  const { currentUser } = useAuth();
  const [userClubs, setUserClubs] = useState<SportLinkClub[]>([]);
  const [loading, setLoading]     = useState(true);
  const userClubsRef = useRef<SportLinkClub[]>([]);
  useEffect(() => { userClubsRef.current = userClubs; }, [userClubs]);

  useEffect(() => {
    let cancelled = false;
    function fetchClubs() {
      supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
        .then(
          ({ data, error }: { data: DBRow[] | null; error: { message: string } | null }) => {
            if (cancelled) return;
            if (error) {
              console.error('[Clubs] fetch failed:', error.message);
              dispatchError('Impossible de charger les clubs.');
              setLoading(false);
              return;
            }
            setUserClubs(data?.map(mapFromDB) ?? []);
            setLoading(false);
          },
          (err: Error) => {
            if (cancelled) return;
            console.error('[Clubs] fetch rejected:', err.message);
            setLoading(false);
          }
        );
    }
    fetchClubs();
    function onOnline() { if (!cancelled) fetchClubs(); }
    window.addEventListener('online', onOnline);
    return () => { cancelled = true; window.removeEventListener('online', onOnline); };
  }, []);

  useEffect(() => {
    const key = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`clubs-rt-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.some(c => c.id === (row as DBRow).id) ? prev : [mapFromDB(row as DBRow), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.map(c => c.id === (row as DBRow).id ? mapFromDB(row as DBRow) : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clubs' }, ({ old: row }) => {
        setUserClubs(prev => prev.filter(c => c.id !== (row as DBRow).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addClub = useCallback(async (data: Partial<SportLinkClub>): Promise<SportLinkClub> => {
    const userId = currentUser?.id;
    const { data: saved, error } = await supabase
      .from('clubs')
      .insert(mapToDB(data, userId))
      .select()
      .single() as { data: DBRow | null; error: { message: string } | null };

    if (error) { console.error('[Clubs] addClub failed:', error.message); throw new Error(error.message); }
    const club = mapFromDB(saved!);
    setUserClubs(prev => (prev.some(c => c.id === club.id) ? prev : [club, ...prev]));
    return club;
  }, [currentUser?.id]);

  const addClubAndNotify = useCallback(async (data: Partial<SportLinkClub>): Promise<SportLinkClub> => {
    const club = await addClub(data);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.functions.invoke('notify-admin-club-created', {
        body: { club_id: club.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch((err: Error) => console.warn('[addClubAndNotify] notification failed:', err.message));
    });
    return club;
  }, [addClub]);

  const updateClub = useCallback(async (id: string, patch: Partial<SportLinkClub>) => {
    const snapshot = userClubsRef.current.find(c => c.id === id);
    setUserClubs(clubs => clubs.map(c => c.id === id ? { ...c, ...patch } : c));

    if (!navigator.onLine) {
      const merged = snapshot ? { ...snapshot, ...patch } : patch;
      await enqueue({ table: 'clubs', method: 'UPDATE', payload: mapToDB(merged, currentUser?.id), filter: { id } });
      return;
    }

    try {
      const merged = snapshot ? { ...snapshot, ...patch } : patch;
      const { error } = await supabase
        .from('clubs')
        .update(mapToDB(merged, currentUser?.id))
        .eq('id', id) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error('[Clubs] updateClub failed, rolling back:', (err as Error).message);
      if (snapshot) setUserClubs(clubs => clubs.map(c => c.id === id ? snapshot : c));
      throw err;
    }
  }, [currentUser?.id]);

  const deleteClub = useCallback(async (id: string) => {
    const snapshot    = userClubsRef.current.find(c => c.id === id);
    const snapshotIdx = userClubsRef.current.findIndex(c => c.id === id);
    setUserClubs(clubs => clubs.filter(c => c.id !== id));

    if (!navigator.onLine) {
      await enqueue({ table: 'clubs', method: 'DELETE', payload: {}, filter: { id } });
      return;
    }

    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error('[Clubs] deleteClub failed, rolling back:', (err as Error).message);
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

  async function adminUpdate(id: string, patch: Record<string, unknown>, localPatch: Partial<SportLinkClub>) {
    const { error } = await supabase.from('clubs').update(patch).eq('id', id) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, ...localPatch } : c));
  }

  const verifyClub = useCallback(async (id: string, note = '') => {
    await adminUpdate(id, { status: 'verified', verification_note: note || null, verified_at: new Date().toISOString(), verified_by: currentUser?.id }, { status: 'verified', verificationNote: note });
  }, [currentUser?.id]);

  const rejectClub = useCallback(async (id: string, note = '') => {
    await adminUpdate(id, { status: 'rejected', verification_note: note || null }, { status: 'rejected', verificationNote: note });
  }, []);

  const requestClubInfo = useCallback(async (id: string, note = '') => {
    await adminUpdate(id, { status: 'pending_verification', verification_note: note || null }, { status: 'pending_verification', verificationNote: note });
  }, []);

  const suspendClub = useCallback(async (id: string, note = '') => {
    await adminUpdate(id, { status: 'suspended', verification_note: note || null }, { status: 'suspended', verificationNote: note });
  }, []);

  return { userClubs, loading, addClub, addClubAndNotify, updateClub, deleteClub, verifyClub, rejectClub, requestClubInfo, suspendClub };
}
