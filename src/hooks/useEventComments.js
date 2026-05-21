import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useEventComments(eventId) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);

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
        .limit(100);

      if (cancelled) return;
      setComments(data ?? []);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`comments-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_comments',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        // Fetch the profile name for the new comment
        const { data: prof } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', payload.new.user_id)
          .maybeSingle();
        setComments(prev => [
          ...prev,
          { ...payload.new, profiles: prof ?? { name: 'Anonyme' } },
        ]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'event_comments',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [eventId]);

  const addComment = useCallback(async (content) => {
    const trimmed = content.trim();
    if (!userId || !trimmed || trimmed.length > 500) return { error: 'invalid' };
    setPosting(true);

    // Optimistic
    const temp = {
      id: `temp-${Date.now()}`,
      event_id: eventId,
      user_id: userId,
      content: trimmed,
      created_at: new Date().toISOString(),
      profiles: { name: 'Vous' },
      _temp: true,
    };
    setComments(prev => [...prev, temp]);

    const { data, error } = await supabase
      .from('event_comments')
      .insert({ event_id: eventId, user_id: userId, content: trimmed })
      .select('id, content, created_at, user_id, profiles(name)')
      .maybeSingle();

    setPosting(false);

    if (error) {
      setComments(prev => prev.filter(c => c.id !== temp.id));
      return { error: error.message };
    }
    // Replace temp with real
    setComments(prev => prev.map(c => c.id === temp.id ? (data ?? temp) : c));
    return { data };
  }, [eventId, userId]);

  const deleteComment = useCallback(async (commentId) => {
    if (!userId) return;
    setComments(prev => prev.filter(c => c.id !== commentId));
    await supabase.from('event_comments').delete().eq('id', commentId).eq('user_id', userId);
  }, [userId]);

  return { comments, loading, posting, addComment, deleteComment, isLoggedIn: !!userId, userId };
}
