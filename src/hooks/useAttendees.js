import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

// Scoped per user to prevent cross-user contamination on shared browsers
function lsKey(userId) {
  return userId ? `sl_attending_${userId}` : 'sl_attending_anon';
}

export function useAttendees() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef(null);

  const [attending, setAttending] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(lsKey(null)) ?? '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      try { setAttending(new Set(JSON.parse(localStorage.getItem(lsKey(null)) ?? '[]'))); }
      catch { setAttending(new Set()); }
      return;
    }

    let cancelled = false;
    supabase.from('attendees').select('event_id').eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Attendees] fetch failed, falling back to cache:', error.message);
          try {
            const cached = JSON.parse(localStorage.getItem(lsKey(userId)) ?? '[]');
            setAttending(new Set(cached.map(String)));
          } catch { setAttending(new Set()); }
          return;
        }
        const serverSet = new Set(data.map(r => String(r.event_id)));
        setAttending(serverSet);
        // Mettre à jour le cache localStorage
        try { localStorage.setItem(lsKey(userId), JSON.stringify([...serverSet])); } catch {}
      });
    return () => { cancelled = true; };
  }, [userId]);

  const toggle = useCallback(async (id) => {
    const strId = String(id);
    const isCurrent = attending.has(strId);

    setAttending(prev => {
      const next = new Set(prev);
      isCurrent ? next.delete(strId) : next.add(strId);
      if (!userId) localStorage.setItem(lsKey(null), JSON.stringify([...next]));
      return next;
    });

    if (!userId) return;

    try {
      if (isCurrent) {
        const { error } = await supabase.from('attendees')
          .delete().eq('user_id', userId).eq('event_id', strId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('attendees')
          .insert({ user_id: userId, event_id: strId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[Attendees] toggle failed, rolling back:', err.message);
      setAttending(prev => {
        const rolled = new Set(prev);
        isCurrent ? rolled.add(strId) : rolled.delete(strId);
        return rolled;
      });
    }
  }, [userId, attending]);

  const isAttending = useCallback((id) => attending.has(String(id)), [attending]);

  return { attending, toggle, isAttending };
}
