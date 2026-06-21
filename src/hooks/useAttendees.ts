import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

function lsKey(userId: string | null): string {
  return userId ? `sl_attending_${userId}` : 'sl_attending_anon';
}

interface UseAttendeesResult {
  attending: Set<string>;
  toggle: (id: string | number) => Promise<void>;
  isAttending: (id: string | number) => boolean;
}

export function useAttendees(): UseAttendeesResult {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const prevUserId = useRef<string | null>(null);
  const attendingRef = useRef<Set<string>>(new Set());

  const [attending, setAttending] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(lsKey(null)) ?? '[]') as string[]); }
    catch { return new Set(); }
  });

  useEffect(() => { attendingRef.current = attending; }, [attending]);

  useEffect(() => {
    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      try { setAttending(new Set(JSON.parse(localStorage.getItem(lsKey(null)) ?? '[]') as string[])); }
      catch { setAttending(new Set()); }
      return;
    }

    let cancelled = false;
    supabase.from('attendees').select('event_id').eq('user_id', userId)
      .then(({ data, error }: { data: { event_id: string }[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Attendees] fetch failed, falling back to cache:', error.message);
          try {
            const cached = JSON.parse(localStorage.getItem(lsKey(userId)) ?? '[]') as string[];
            setAttending(new Set(cached.map(String)));
          } catch { setAttending(new Set()); }
          return;
        }
        const serverSet = new Set((data ?? []).map(r => String(r.event_id)));
        setAttending(serverSet);
        try { localStorage.setItem(lsKey(userId), JSON.stringify([...serverSet])); } catch { /* ignore */ }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const toggle = useCallback(async (id: string | number) => {
    const strId = String(id);
    const isCurrent = attendingRef.current.has(strId);

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
          .delete().eq('user_id', userId).eq('event_id', strId) as { error: { message: string } | null };
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('attendees')
          .insert({ user_id: userId, event_id: strId }) as { error: { message: string } | null };
        if (error) throw new Error(error.message);
      }
    } catch (err) {
      console.error('[Attendees] toggle failed, rolling back:', (err as Error).message);
      setAttending(prev => {
        const rolled = new Set(prev);
        isCurrent ? rolled.add(strId) : rolled.delete(strId);
        return rolled;
      });
    }
  }, [userId]);

  const isAttending = useCallback((id: string | number) => attending.has(String(id)), [attending]);

  return { attending, toggle, isAttending };
}
