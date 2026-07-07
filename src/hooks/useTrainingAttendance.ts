import { useState, useEffect, useCallback, useRef } from 'react';
import { sanitizeText } from '../lib/sanitize.js';
import { supabase } from '../lib/supabase.js';

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

type AttStatus = 'present' | 'absent' | 'unsure';
type DBRow = Record<string, unknown>;

interface AttEntry { id: string; user_id: string; player_id?: string; status: AttStatus; updated_at?: string; profiles?: { name?: string; avatar_url?: string } | null; }
interface TrainingMessage { id: string; content: string; type?: string; created_at: string; profiles?: { name?: string; avatar_url?: string } | null; [key: string]: unknown; }
interface AttCounts { present: number; absent: number; unsure: number; }

export function useTrainingAttendance(sessionId: string | null | undefined, userId: string | null = null) {
  const [attendance, setAttendance] = useState<AttEntry[]>([]);
  const [counts,     setCounts]     = useState<AttCounts>({ present: 0, absent: 0, unsure: 0 });
  const [myStatus,   setMyStatus]   = useState<AttStatus | null>(null);
  const [messages,   setMessages]   = useState<TrainingMessage[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function loadAttendance() {
      const { data: rows } = await supabase
        .from('training_attendance')
        .select('id, user_id, player_id, status, updated_at')
        .eq('session_id', sessionId) as { data: Omit<AttEntry, 'profiles'>[] | null };
      if (cancelled) return;
      const base = rows ?? [];
      const profileMap = await fetchProfileNames([...new Set(base.map(a => a.user_id))]);
      const list: AttEntry[] = base.map(a => ({ ...a, profiles: profileMap[a.user_id] ?? null }));
      setAttendance(list);
      setCounts({ present: list.filter(a => a.status === 'present').length, absent: list.filter(a => a.status === 'absent').length, unsure: list.filter(a => a.status === 'unsure').length });
      if (userId) { const mine = list.find(a => a.user_id === userId); setMyStatus(mine?.status ?? null); }
    }
    loadAttendance();

    async function loadMessages() {
      const { data: rows } = await supabase
        .from('training_messages')
        .select('id, content, type, created_at, author_id')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true }) as { data: (Omit<TrainingMessage, 'profiles'> & { author_id?: string })[] | null };
      if (cancelled) return;
      const base = rows ?? [];
      const authorIds = [...new Set(base.map(r => r.author_id).filter(Boolean) as string[])];
      const profileMap = await fetchProfileNames(authorIds);
      setMessages(base.map(r => ({ ...r, profiles: r.author_id ? (profileMap[r.author_id] ?? null) : null })) as TrainingMessage[]);
    }
    loadMessages();

    const channel = supabase.channel(`training-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance', filter: `session_id=eq.${sessionId}` }, (_p: DBRow) => {
        loadAttendance();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'training_messages', filter: `session_id=eq.${sessionId}` }, (payload: { new: TrainingMessage }) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [sessionId, userId]);

  const respond = useCallback(async (status: AttStatus) => {
    if (!sessionId || !userId) return;
    setMyStatus(status);
    const prev = attendance.find(a => a.user_id === userId);
    const { error } = await supabase.from('training_attendance').upsert({ session_id: sessionId, user_id: userId, status }, { onConflict: 'session_id,user_id' }) as { error: { message: string } | null };
    if (error) { console.error('[Attendance] respond failed:', error.message); setMyStatus(prev?.status ?? null); }
  }, [sessionId, userId, attendance]);

  const sendMessage = useCallback(async ({ clubId, content, type = 'info' }: { clubId: string; content: string; type?: string }): Promise<boolean> => {
    if (!sessionId || !content?.trim()) return false;
    const { error } = await supabase.from('training_messages').insert({ session_id: sessionId, club_id: clubId, author_id: userId, content: sanitizeText(content.trim()), type }) as { error: { message: string } | null };
    if (error) { console.error('[TrainingMessages] send failed:', error.message); return false; }
    return true;
  }, [sessionId, userId]);

  return { attendance, counts, myStatus, messages, respond, sendMessage };
}
