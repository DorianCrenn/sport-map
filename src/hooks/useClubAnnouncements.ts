import { useState, useEffect, useCallback } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { sanitizeText } from '../lib/sanitize.js';

type DBRow = Record<string, unknown>;

export interface ClubAnnouncement {
  id:           string;
  clubId:       string;
  clubName:     string;
  authorId:     string;
  authorName:   string;
  type:         string;
  title:        string;
  message:      string;
  targetTeams:  string[];
  createdAt:    string;
  scheduledFor: string | null;
}

async function pushClubFollowers(clubId: string, title: string, body: string, url: string, tag: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const base = import.meta.env.VITE_SUPABASE_URL ?? '';
    await fetch(`${base}/functions/v1/notify-club-followers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ club_id: String(clubId), title, body, url, tag }),
    });
  } catch { /* best-effort */ }
}

function mapAnn(row: DBRow): ClubAnnouncement {
  return {
    id:           String(row.id),
    clubId:       String(row.club_id),
    clubName:     String(row.club_name ?? ''),
    authorId:     String(row.author_id ?? ''),
    authorName:   String(row.author_name ?? ''),
    type:         String(row.type ?? ''),
    title:        String(row.title ?? ''),
    message:      String(row.message ?? ''),
    targetTeams:  (row.target_teams as string[]) ?? [],
    createdAt:    String(row.created_at ?? ''),
    scheduledFor: (row.scheduled_for as string | null) ?? null,
  };
}

export interface SendOptions {
  type: string;
  title?: string;
  message: string;
  targetTeams?: string[];
  clubName?: string;
  scheduledFor?: string | null;
}

export function useClubAnnouncements(clubId: string | null | undefined) {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [loading, setLoading] = useState(!!clubId);

  const fetchData = useCallback(async () => {
    if (!clubId) return;
    const { data } = await supabase
      .from('club_announcements')
      .select('*')
      .eq('club_id', String(clubId))
      .order('created_at', { ascending: false })
      .limit(30) as { data: DBRow[] | null };
    if (data) setAnnouncements(data.map(mapAnn));
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    fetchData();
    const key = Math.random().toString(36).slice(2, 7);
    const ch = supabase
      .channel(`club-ann-${String(clubId)}-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' }, ({ new: row }: { new: DBRow }) => {
        if (String(row.club_id) !== String(clubId)) return;
        setAnnouncements(prev => prev.some(a => a.id === String(row.id)) ? prev : [mapAnn(row), ...prev]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'club_announcements' }, ({ old: row }: { old: DBRow }) => {
        setAnnouncements(prev => prev.filter(a => a.id !== String(row.id)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clubId, fetchData]);

  const sendAnnouncement = useCallback(async ({ type, title, message, targetTeams, clubName, scheduledFor }: SendOptions) => {
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
      .single() as { data: DBRow | null; error: { message: string } | null };
    if (error) throw error;
    const ann = mapAnn(data!);
    if (isDemoMode()) window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'announcement-sent' } }));
    window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'announcement_sent', data: { announcement_type: type } } }));
    if (!scheduledFor) {
      const notifTitle = clubName
        ? `${sanitizeText(clubName)} — ${sanitizeText(title ?? 'Nouvelle annonce')}`
        : sanitizeText(title ?? 'Nouvelle annonce');
      pushClubFollowers(String(clubId), notifTitle, sanitizeText(message).slice(0, 120), '/', `announcement-${ann.id}`);
    }
    return ann;
  }, [currentUser, clubId]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    await supabase.from('club_announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  return { announcements, loading, sendAnnouncement, deleteAnnouncement, refetch: fetchData };
}
