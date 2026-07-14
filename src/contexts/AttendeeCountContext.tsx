import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase.js';

interface AttendeeCountContextValue {
  getCount: (eventId: string) => number;
  setKnownIds: (ids: string[]) => void;
}

const AttendeeCountContext = createContext<AttendeeCountContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAttendeeCount(eventId: string | number): number {
  const ctx = useContext(AttendeeCountContext);
  if (!ctx) return 0;
  return ctx.getCount(String(eventId));
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAttendeeCountActions(): (ids: string[]) => void {
  const ctx = useContext(AttendeeCountContext);
  if (!ctx) return () => {};
  return ctx.setKnownIds;
}

export function AttendeeCountProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts]          = useState<Record<string, number>>({});
  const [knownIds, setKnownIdsState] = useState<string[] | null>(null);
  const knownIdsRef = useRef<string[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { knownIdsRef.current = knownIds; }, [knownIds]);

  const setKnownIds = useCallback((ids: string[]) => {
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
      const map: Record<string, number> = {};
      for (const row of data ?? []) map[String(row.event_id)] = row.count as number;
      setCounts(map);
    }

    load();

    if (knownIds !== null && knownIds.length === 0) {
      return () => { cancelled = true; };
    }

    const pgConfig: Record<string, unknown> = { event: '*', schema: 'public', table: 'attendees' };
    if (knownIds && knownIds.length > 0) {
      pgConfig.filter = `event_id=in.(${knownIds.slice(0, 50).join(',')})`;
    }

    const channel = supabase
      .channel(`attendee-count-changes-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', pgConfig as any, (payload) => {
        const row = (payload.new as { event_id?: string })?.event_id
          ? (payload.new as { event_id: string })
          : (payload.old as { event_id?: string });
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

  const getCount = useCallback((eventId: string) => counts[String(eventId)] ?? 0, [counts]);

  return (
    <AttendeeCountContext.Provider value={{ getCount, setKnownIds }}>
      {children}
    </AttendeeCountContext.Provider>
  );
}
