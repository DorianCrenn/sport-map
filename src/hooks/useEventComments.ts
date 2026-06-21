import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

type DBRow = Record<string, unknown>;

export interface EventComment {
  id:         string;
  event_id:   string;
  user_id:    string;
  content:    string;
  created_at: string;
  profiles?:  { name: string } | null;
  _temp?:     boolean;
}

export function useEventComments(eventId: string | null | undefined) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [comments, setComments] = useState<EventComment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('event_comments')
        .select('id, content, created_at, user_id, profiles(name)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100) as { data: EventComment[] | null };
      if (cancelled) return;
      setComments(data ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`comments-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_comments', filter: `event_id=eq.${eventId}` },
        async (payload: { new: DBRow }) => {
          const { data: prof } = await supabase.from('profiles').select('name').eq('id', String(payload.new.user_id)).maybeSingle() as { data: { name: string } | null };
          setComments(prev => [...prev, { ...(payload.new as unknown as EventComment), profiles: prof ?? { name: 'Anonyme' } }]);
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'event_comments', filter: `event_id=eq.${eventId}` },
        (payload: { old: DBRow }) => { setComments(prev => prev.filter(c => c.id !== String(payload.old.id))); })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [eventId]);

  const addComment = useCallback(async (content: string): Promise<{ error?: string; data?: EventComment }> => {
    const trimmed = content.trim();
    if (!userId || !trimmed || trimmed.length > 500) return { error: 'invalid' };
    setPosting(true);
    const temp: EventComment = { id: `temp-${Date.now()}`, event_id: String(eventId), user_id: userId, content: trimmed, created_at: new Date().toISOString(), profiles: { name: 'Vous' }, _temp: true };
    setComments(prev => [...prev, temp]);

    const { data, error } = await supabase
      .from('event_comments')
      .insert({ event_id: eventId, user_id: userId, content: trimmed })
      .select('id, content, created_at, user_id, profiles(name)')
      .maybeSingle() as { data: EventComment | null; error: { message: string } | null };

    setPosting(false);
    if (error) { setComments(prev => prev.filter(c => c.id !== temp.id)); return { error: error.message }; }
    setComments(prev => prev.map(c => c.id === temp.id ? (data ?? temp) : c));
    return { data: data ?? temp };
  }, [eventId, userId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!userId) return;
    setComments(prev => prev.filter(c => c.id !== commentId));
    await supabase.from('event_comments').delete().eq('id', commentId).eq('user_id', userId);
  }, [userId]);

  return { comments, loading, posting, addComment, deleteComment, isLoggedIn: !!userId, userId };
}
