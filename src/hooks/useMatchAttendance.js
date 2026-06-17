import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export function useMatchAttendance(eventId, userId = null) {
  const [attendance, setAttendance] = useState([]);
  const [counts, setCounts]         = useState({ present: 0, absent: 0, unsure: 0 });
  const [myStatus, setMyStatus]     = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function fetchAll() {
      const { data } = await supabase
        .from('match_player_attendance')
        .select('event_id, user_id, status, updated_at, profiles(name, avatar_url)')
        .eq('event_id', eventId);

      if (cancelled) return;
      const list = data ?? [];
      setAttendance(list);
      setCounts({
        present: list.filter(a => a.status === 'present').length,
        absent:  list.filter(a => a.status === 'absent').length,
        unsure:  list.filter(a => a.status === 'unsure').length,
      });
      if (userId) setMyStatus(list.find(a => a.user_id === userId)?.status ?? null);
    }

    fetchAll();

    const channel = supabase.channel(`match-att-${eventId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'match_player_attendance',
        filter: `event_id=eq.${eventId}`,
      }, () => fetchAll())
      .subscribe();

    channelRef.current = channel;
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [eventId, userId]);

  const respond = useCallback(async (status) => {
    if (!eventId || !userId) return;
    const prev = attendance.find(a => a.user_id === userId);
    setMyStatus(status);

    const { error } = await supabase
      .from('match_player_attendance')
      .upsert({ event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });

    if (error) {
      console.error('[MatchAttendance] respond failed:', error.message);
      setMyStatus(prev?.status ?? null);
    }
  }, [eventId, userId, attendance]);

  return { attendance, counts, myStatus, respond };
}
