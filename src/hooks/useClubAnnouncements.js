import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapAnn(row) {
  return {
    id:          row.id,
    clubId:      row.club_id,
    clubName:    row.club_name,
    authorId:    row.author_id,
    authorName:  row.author_name,
    type:        row.type,
    title:       row.title ?? '',
    message:     row.message,
    targetTeams: row.target_teams ?? [],
    createdAt:   row.created_at,
  };
}

export function useClubAnnouncements(clubId) {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(!!clubId);

  const fetch = useCallback(async () => {
    if (!clubId) return;
    const { data } = await supabase
      .from('club_announcements')
      .select('*')
      .eq('club_id', String(clubId))
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setAnnouncements(data.map(mapAnn));
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    fetch();
    const key = Math.random().toString(36).slice(2, 7);
    const ch = supabase
      .channel(`club-ann-${String(clubId)}-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' }, fetch)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'club_announcements' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [clubId, fetch]);

  const sendAnnouncement = useCallback(async ({ type, title, message, targetTeams, clubName }) => {
    if (!currentUser || !clubId) throw new Error('not authenticated');
    const { data, error } = await supabase
      .from('club_announcements')
      .insert({
        club_id:      String(clubId),
        club_name:    clubName ?? '',
        author_id:    currentUser.id,
        author_name:  currentUser.name ?? '',
        type,
        title:        title || null,
        message,
        target_teams: targetTeams ?? [],
      })
      .select()
      .single();
    if (error) throw error;
    return mapAnn(data);
  }, [currentUser, clubId]);

  const deleteAnnouncement = useCallback(async (id) => {
    await supabase.from('club_announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  return { announcements, loading, sendAnnouncement, deleteAnnouncement, refetch: fetch };
}
