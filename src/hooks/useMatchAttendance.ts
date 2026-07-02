import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

type AttendanceStatus = 'present' | 'absent' | 'unsure';

export interface AttendanceEntry {
  event_id:   string;
  user_id:    string;
  status:     AttendanceStatus;
  updated_at: string;
  profiles?:  { name?: string; avatar_url?: string | null } | null;
}

interface AttendanceCounts { present: number; absent: number; unsure: number; }

const DEMO_LIVE_ATTENDANCE: AttendanceEntry[] = [
  { event_id: 'demo-live-match', user_id: 'demo-p-01', status: 'present', updated_at: '', profiles: { name: 'Nicolas Perrin',   avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-02', status: 'present', updated_at: '', profiles: { name: 'Romain Quéméner',  avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-03', status: 'present', updated_at: '', profiles: { name: 'Maxime Briand',    avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-04', status: 'present', updated_at: '', profiles: { name: 'Kevin Le Goff',    avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-05', status: 'present', updated_at: '', profiles: { name: 'Thomas Guyader',   avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-06', status: 'present', updated_at: '', profiles: { name: 'Pierre Jaouen',    avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-07', status: 'present', updated_at: '', profiles: { name: 'Clément Hélas',    avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-08', status: 'present', updated_at: '', profiles: { name: 'Baptiste Seznec',  avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-09', status: 'present', updated_at: '', profiles: { name: 'Florian Calvez',   avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-10', status: 'present', updated_at: '', profiles: { name: 'Hugo Kervarrec',   avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-11', status: 'present', updated_at: '', profiles: { name: 'Nathan Kermarrec', avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-12', status: 'present', updated_at: '', profiles: { name: 'Erwan Bodéré',     avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-13', status: 'absent',  updated_at: '', profiles: { name: 'Antonin Salaün',   avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-14', status: 'absent',  updated_at: '', profiles: { name: 'Mathieu Dourdain', avatar_url: null } },
  { event_id: 'demo-live-match', user_id: 'demo-p-15', status: 'unsure',  updated_at: '', profiles: { name: 'Lucas Morel',      avatar_url: null } },
];

async function fetchProfileNames(userIds: string[]): Promise<Record<string, { name: string; avatar_url: string | null }>> {
  if (!userIds.length) return {};
  const { data } = await supabase
    .from('public_profiles')
    .select('id, name, avatar_url')
    .in('id', userIds) as { data: { id: string; name: string; avatar_url: string | null }[] | null };
  const map: Record<string, { name: string; avatar_url: string | null }> = {};
  for (const p of data ?? []) map[p.id] = { name: p.name, avatar_url: p.avatar_url };
  return map;
}

export function useMatchAttendance(eventId: string | null | undefined, userId: string | null = null) {
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [counts,     setCounts]     = useState<AttendanceCounts>({ present: 0, absent: 0, unsure: 0 });
  const [myStatus,   setMyStatus]   = useState<AttendanceStatus | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!eventId) return;
    if (isDemoMode()) {
      const list = DEMO_LIVE_ATTENDANCE.filter(a => a.event_id === eventId);
      setAttendance(list);
      setCounts({ present: list.filter(a => a.status === 'present').length, absent: list.filter(a => a.status === 'absent').length, unsure: list.filter(a => a.status === 'unsure').length });
      return;
    }
    let cancelled = false;

    async function fetchAll() {
      const { data: rows } = await supabase
        .from('match_player_attendance')
        .select('event_id, user_id, status, updated_at')
        .eq('event_id', eventId) as { data: Omit<AttendanceEntry, 'profiles'>[] | null };
      if (cancelled) return;
      const base = rows ?? [];
      const profileMap = await fetchProfileNames([...new Set(base.map(a => a.user_id))]);
      const list: AttendanceEntry[] = base.map(a => ({ ...a, profiles: profileMap[a.user_id] ?? null }));
      setAttendance(list);
      setCounts({ present: list.filter(a => a.status === 'present').length, absent: list.filter(a => a.status === 'absent').length, unsure: list.filter(a => a.status === 'unsure').length });
      if (userId) setMyStatus(list.find(a => a.user_id === userId)?.status ?? null);
    }

    fetchAll();

    const channel = supabase.channel(`match-att-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_player_attendance', filter: `event_id=eq.${eventId}` },
        () => fetchAll())
      .subscribe();
    channelRef.current = channel;
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [eventId, userId]);

  const respond = useCallback(async (status: AttendanceStatus) => {
    if (!eventId || !userId) return;
    const prev = attendance.find(a => a.user_id === userId);
    setMyStatus(status);
    const { error } = await supabase
      .from('match_player_attendance')
      .upsert({ event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' }) as { error: { message: string } | null };
    if (error) { console.error('[MatchAttendance] respond failed:', error.message); setMyStatus(prev?.status ?? null); }
  }, [eventId, userId, attendance]);

  return { attendance, counts, myStatus, respond };
}
