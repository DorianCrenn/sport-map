import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

type DBRow = Record<string, unknown>;

export interface MyAnnouncement {
  id:           string;
  clubId:       string;
  clubName:     string;
  authorName:   string;
  type:         string;
  title:        string;
  message:      string;
  targetTeams:  string[];
  createdAt:    string;
  scheduledFor: string | null;
}

function mapAnn(row: DBRow): MyAnnouncement {
  return {
    id:           String(row.id),
    clubId:       String(row.club_id),
    clubName:     String(row.club_name ?? ''),
    authorName:   String(row.author_name ?? ''),
    type:         String(row.type ?? ''),
    title:        String(row.title ?? ''),
    message:      String(row.message ?? ''),
    targetTeams:  (row.target_teams as string[]) ?? [],
    createdAt:    String(row.created_at ?? ''),
    scheduledFor: (row.scheduled_for as string | null) ?? null,
  };
}

export function useMyAnnouncements() {
  const { currentUser, follows } = useAuth();
  const [announcements, setAnnouncements] = useState<MyAnnouncement[]>([]);
  const [readIds,        setReadIds]       = useState<Set<string>>(new Set());
  const [loading,        setLoading]       = useState(false);
  const followedClubIds = (follows ?? []).map(f => String(f.clubId));
  const followedKey     = followedClubIds.join(',');

  // Le handler Realtime lit les follows courants via un ref → pas besoin de
  // re-souscrire quand les follows changent (source du crash "postgres_changes
  // after subscribe" au login, quand followedKey change juste après connexion).
  const followsRef = useRef(follows);
  useEffect(() => { followsRef.current = follows; }, [follows]);

  const fetchAll = useCallback(async () => {
    if (!currentUser || followedClubIds.length === 0) {
      setAnnouncements([]); setReadIds(new Set()); setLoading(false); return;
    }
    setLoading(true);
    const [annRes, readRes] = await Promise.allSettled([
      supabase.from('club_announcements').select('*').in('club_id', followedClubIds).order('created_at', { ascending: false }).limit(60),
      supabase.from('announcement_reads').select('announcement_id').eq('user_id', currentUser.id),
    ]);
    const annData  = annRes.status  === 'fulfilled' ? ((annRes.value.data  ?? []) as DBRow[]) : [];
    const readData = readRes.status === 'fulfilled' ? ((readRes.value.data ?? []) as { announcement_id: string }[]) : [];
    const allAnn   = annData.map(mapAnn);
    const reads    = new Set(readData.map(r => r.announcement_id));
    const now      = new Date();
    const filtered = allAnn.filter(ann => {
      if (ann.scheduledFor && new Date(ann.scheduledFor) > now) return false;
      if (ann.targetTeams.length === 0) return true;
      const follow = (follows ?? []).find(f => String(f.clubId) === String(ann.clubId));
      if (!follow) return false;
      if (follow.teams === 'all') return true;
      return ann.targetTeams.some(t => Array.isArray(follow.teams) && follow.teams.includes(t));
    });
    setAnnouncements(filtered); setReadIds(reads); setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, followedKey]);

  // Fetch : se relance quand l'utilisateur ou ses follows changent.
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime : UNE souscription par session (deps = id seul). Nom unique pour
  // ne jamais réutiliser un channel déjà subscribe()é lors d'un remount.
  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase
      .channel(`my-ann-${currentUser.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' },
        ({ new: row }: { new: DBRow }) => {
          const ann  = mapAnn(row);
          const flws = followsRef.current ?? [];
          const follow = flws.find(f => String(f.clubId) === String(ann.clubId));
          if (!follow) return;
          const relevant = ann.targetTeams.length === 0 || follow.teams === 'all' || ann.targetTeams.some(t => Array.isArray(follow.teams) && follow.teams.includes(t));
          if (relevant) setAnnouncements(prev => (prev.some(a => a.id === ann.id) ? prev : [ann, ...prev]));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const markRead = useCallback(async (id: string) => {
    if (readIds.has(id) || !currentUser) return;
    setReadIds(prev => new Set([...prev, id]));
    await supabase.from('announcement_reads').upsert({ announcement_id: id, user_id: currentUser.id });
  }, [currentUser?.id, readIds]);

  const markAllRead = useCallback(async () => {
    if (!currentUser || unreadCount === 0) return;
    const unread = announcements.filter(a => !readIds.has(a.id));
    setReadIds(prev => new Set([...prev, ...unread.map(a => a.id)]));
    if (unread.length > 0) {
      await supabase.from('announcement_reads').upsert(unread.map(a => ({ announcement_id: a.id, user_id: currentUser.id })));
    }
  }, [currentUser?.id, announcements, readIds, unreadCount]);

  return { announcements, readIds, unreadCount, loading, markRead, markAllRead, refetch: fetchAll };
}
