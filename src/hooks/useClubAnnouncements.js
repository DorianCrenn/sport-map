import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sanitizeText } from '../lib/sanitize.js';

async function pushClubFollowers(clubId, title, body, url, tag) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const base = import.meta.env.VITE_SUPABASE_URL ?? '';
    await fetch(`${base}/functions/v1/notify-club-followers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ club_id: String(clubId), title, body, url, tag }),
    });
  } catch { /* best-effort, don't block UI */ }
}

function mapAnn(row) {
  return {
    id:           row.id,
    clubId:       row.club_id,
    clubName:     row.club_name,
    authorId:     row.author_id,
    authorName:   row.author_name,
    type:         row.type,
    title:        row.title ?? '',
    message:      row.message,
    targetTeams:  row.target_teams ?? [],
    createdAt:    row.created_at,
    scheduledFor: row.scheduled_for ?? null,
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' }, ({ new: row }) => {
        if (String(row.club_id) !== String(clubId)) return;
        setAnnouncements(prev => prev.some(a => a.id === row.id) ? prev : [mapAnn(row), ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'club_announcements' }, ({ old: row }) => {
        setAnnouncements(prev => prev.filter(a => a.id !== row.id));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [clubId, fetch]);

  const sendAnnouncement = useCallback(async ({ type, title, message, targetTeams, clubName, scheduledFor }) => {
    if (!currentUser) throw new Error('Connecte-toi pour envoyer une annonce');
    if (!clubId) throw new Error('Aucun club sélectionné');
    const { data, error } = await supabase
      .from('club_announcements')
      .insert({
        club_id:       String(clubId),
        club_name:     sanitizeText(clubName ?? ''),
        author_id:     currentUser.id,
        author_name:   sanitizeText(currentUser.name ?? ''),
        type,
        title:         title ? sanitizeText(title) : null,
        message:       sanitizeText(message),
        target_teams:  targetTeams ?? [],
        scheduled_for: scheduledFor ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    const ann = mapAnn(data);
    // Notify followers immediately for non-scheduled announcements (PUSH-PROD-001c)
    if (!scheduledFor) {
      const notifTitle = clubName
        ? `${sanitizeText(clubName)} — ${sanitizeText(title ?? 'Nouvelle annonce')}`
        : sanitizeText(title ?? 'Nouvelle annonce');
      pushClubFollowers(clubId, notifTitle, sanitizeText(message).slice(0, 120), '/', `announcement-${ann.id}`);
    }
    return ann;
  }, [currentUser, clubId]);

  const deleteAnnouncement = useCallback(async (id) => {
    await supabase.from('club_announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  return { announcements, loading, sendAnnouncement, deleteAnnouncement, refetch: fetch };
}
