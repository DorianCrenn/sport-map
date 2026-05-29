import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

const AttendeeCountContext = createContext(null);

export function useAttendeeCount(eventId) {
  const ctx = useContext(AttendeeCountContext);
  if (!ctx) return 0;
  return ctx.getCount(String(eventId));
}

export function useAttendeeCountActions() {
  const ctx = useContext(AttendeeCountContext);
  if (!ctx) return () => {};
  return ctx.setKnownIds;
}

export function AttendeeCountProvider({ children }) {
  const [counts, setCounts]         = useState({});
  const [knownIds, setKnownIdsState] = useState(null);
  const knownIdsRef  = useRef(null);
  const debounceRef  = useRef(null);

  useEffect(() => { knownIdsRef.current = knownIds; }, [knownIds]);

  // Debounce les mises à jour de knownIds pour éviter de recréer
  // le channel Realtime à chaque scroll/pan de la carte.
  const setKnownIds = useCallback((ids) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setKnownIdsState(ids), 300);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let query = supabase.from('event_attendee_counts').select('event_id, count');
      if (knownIds && knownIds.length > 0) {
        query = query.in('event_id', knownIds);
      } else if (knownIds !== null) {
        return;
      }
      const { data, error } = await query;
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
        if (knownIdsRef.current !== null && !knownIdsRef.current.includes(id)) return;
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
  }, [knownIds]);

  const getCount = useCallback((eventId) => counts[String(eventId)] ?? 0, [counts]);

  return (
    <AttendeeCountContext.Provider value={{ getCount, setKnownIds }}>
      {children}
    </AttendeeCountContext.Provider>
  );
}
