import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const LOCAL_KEY = 'sl_attending';

export function useAttendees() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef(null);

  const [attending, setAttending] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')); }
    catch { return new Set(); }
  });

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      try { setAttending(new Set(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'))); }
      catch { setAttending(new Set()); }
      return;
    }

    supabase.from('attendees').select('event_id').eq('user_id', userId)
      .then(({ data }) => {
        if (data) setAttending(new Set(data.map(r => String(r.event_id))));
      });
  }, [userId]);

  const toggle = useCallback(async (id) => {
    const strId = String(id);
    const isCurrent = attending.has(strId);

    setAttending(prev => {
      const next = new Set(prev);
      isCurrent ? next.delete(strId) : next.add(strId);
      if (!userId) localStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
      return next;
    });

    if (!userId) return;
    if (isCurrent) {
      await supabase.from('attendees').delete().eq('user_id', userId).eq('event_id', strId);
    } else {
      await supabase.from('attendees').insert({ user_id: userId, event_id: strId });
    }
  }, [userId, attending]);

  const isAttending = useCallback((id) => attending.has(String(id)), [attending]);

  return { attending, toggle, isAttending };
}
