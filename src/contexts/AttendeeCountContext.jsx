import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const AttendeeCountContext = createContext({ getCount: () => 0 });

export function useAttendeeCount(eventId) {
  const { getCount } = useContext(AttendeeCountContext);
  return getCount(String(eventId));
}

export function AttendeeCountProvider({ children }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('event_attendee_counts')
        .select('event_id, count');
      if (cancelled) return;
      if (error) { console.warn('[AttendeeCount] load failed:', error.message); return; }
      const map = {};
      for (const row of data ?? []) map[String(row.event_id)] = row.count;
      setCounts(map);
    }

    load();

    const channel = supabase
      .channel('attendee-count-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, (payload) => {
        const row = payload.new?.event_id ? payload.new : payload.old;
        if (!row?.event_id) { load(); return; }
        const id = String(row.event_id);
        setCounts(prev => {
          const curr = prev[id] ?? 0;
          if (payload.eventType === 'INSERT') return { ...prev, [id]: curr + 1 };
          if (payload.eventType === 'DELETE') return { ...prev, [id]: Math.max(0, curr - 1) };
          return prev;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const getCount = useCallback((eventId) => counts[String(eventId)] ?? 0, [counts]);

  return (
    <AttendeeCountContext.Provider value={{ getCount }}>
      {children}
    </AttendeeCountContext.Provider>
  );
}
