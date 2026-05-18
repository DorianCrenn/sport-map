import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapAnn(row) {
  return {
    id:          row.id,
    clubId:      row.club_id,
    clubName:    row.club_name,
    authorName:  row.author_name,
    type:        row.type,
    title:       row.title ?? '',
    message:     row.message,
    targetTeams: row.target_teams ?? [],
    createdAt:   row.created_at,
  };
}

export function useMyAnnouncements() {
  const { currentUser, follows } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [readIds, setReadIds]             = useState(new Set());
  const [loading, setLoading]             = useState(false);
  const followedClubIds = follows.map(f => String(f.clubId));

  const fetchAll = useCallback(async () => {
    if (!currentUser || followedClubIds.length === 0) {
      setAnnouncements([]); setReadIds(new Set()); setLoading(false); return;
    }
    setLoading(true);
    const [annRes, readRes] = await Promise.all([
      supabase
        .from('club_announcements')
        .select('*')
        .in('club_id', followedClubIds)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', currentUser.id),
    ]);
    const allAnn = (annRes.data ?? []).map(mapAnn);
    const reads  = new Set((readRes.data ?? []).map(r => r.announcement_id));

    // Filter by team targeting
    const filtered = allAnn.filter(ann => {
      if (ann.targetTeams.length === 0) return true;
      const follow = follows.find(f => String(f.clubId) === String(ann.clubId));
      if (!follow) return false;
      if (follow.teams === 'all') return true;
      return ann.targetTeams.some(t => follow.teams.includes(t));
    });

    setAnnouncements(filtered);
    setReadIds(reads);
    setLoading(false);
  }, [currentUser?.id, followedClubIds.join(',')]);

  useEffect(() => {
    fetchAll();
    if (!currentUser) return;
    const key = Math.random().toString(36).slice(2, 7);
    const ch = supabase
      .channel(`my-ann-${currentUser.id}-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' },
        ({ new: row }) => {
          const ann = mapAnn(row);
          if (!followedClubIds.includes(String(ann.clubId))) return;
          const follow = follows.find(f => String(f.clubId) === String(ann.clubId));
          if (!follow) return;
          const relevant = ann.targetTeams.length === 0
            || follow.teams === 'all'
            || ann.targetTeams.some(t => follow.teams.includes(t));
          if (relevant) setAnnouncements(prev => [ann, ...prev]);
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUser?.id, fetchAll]);

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length;

  const markRead = useCallback(async (id) => {
    if (readIds.has(id) || !currentUser) return;
    setReadIds(prev => new Set([...prev, id]));
    await supabase.from('announcement_reads').upsert({ announcement_id: id, user_id: currentUser.id });
  }, [currentUser?.id, readIds]);

  const markAllRead = useCallback(async () => {
    if (!currentUser || unreadCount === 0) return;
    const unread = announcements.filter(a => !readIds.has(a.id));
    setReadIds(prev => new Set([...prev, ...unread.map(a => a.id)]));
    if (unread.length > 0) {
      await supabase.from('announcement_reads').upsert(
        unread.map(a => ({ announcement_id: a.id, user_id: currentUser.id }))
      );
    }
  }, [currentUser?.id, announcements, readIds, unreadCount]);

  return { announcements, readIds, unreadCount, loading, markRead, markAllRead, refetch: fetchAll };
}
