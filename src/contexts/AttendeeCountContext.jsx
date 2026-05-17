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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees' }, () => load())
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
