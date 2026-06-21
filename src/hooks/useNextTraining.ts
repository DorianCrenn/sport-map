import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { sanitizeText } from '../lib/sanitize.js';

type AttStatus = 'present' | 'absent' | 'unsure';
type DBRow = Record<string, unknown>;

interface TrainingSession {
  id: string;
  club_id: string;
  team_id?: string;
  date: string;
  time?: string;
  location?: string;
  status?: string;
}

interface AttCounts { present: number; absent: number; unsure: number; }

export function useNextTraining(clubId: string | null | undefined, userId: string | null | undefined, teamId: string | null = null) {
  const [session,    setSession]    = useState<TrainingSession | null>(null);
  const [counts,     setCounts]     = useState<AttCounts>({ present: 0, absent: 0, unsure: 0 });
  const [myStatus,   setMyStatus]   = useState<AttStatus | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [prevStatus, setPrevStatus] = useState<AttStatus | null>(null);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    let q = supabase
      .from('training_sessions')
      .select('id, club_id, team_id, date, time, location, status')
      .eq('club_id', String(clubId))
      .gte('date', today)
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(1);

    if (teamId) q = q.eq('team_id', String(teamId));

    q.maybeSingle().then(({ data }: { data: TrainingSession | null }) => {
      if (!cancelled) { setSession(data ?? null); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [clubId, teamId]);

  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    function applyList(list: { id: string; user_id: string; status: AttStatus }[]) {
      setCounts({ present: list.filter(a => a.status === 'present').length, absent: list.filter(a => a.status === 'absent').length, unsure: list.filter(a => a.status === 'unsure').length });
      if (userId) { const mine = list.find(a => a.user_id === userId); setMyStatus(mine?.status ?? null); setPrevStatus(mine?.status ?? null); }
    }

    supabase.from('training_attendance').select('id, user_id, status').eq('session_id', session.id)
      .then(({ data }: { data: { id: string; user_id: string; status: AttStatus }[] | null }) => { if (!cancelled) applyList(data ?? []); });

    const channel = supabase.channel(`next-training-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance', filter: `session_id=eq.${session.id}` },
        (_p: DBRow) => {
          supabase.from('training_attendance').select('id, user_id, status').eq('session_id', session.id)
            .then(({ data }: { data: { id: string; user_id: string; status: AttStatus }[] | null }) => { if (!cancelled) applyList(data ?? []); });
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [session?.id, userId]);

  const respond = useCallback(async (status: AttStatus) => {
    if (!session?.id || !userId) return;
    setMyStatus(status);
    const { error } = await supabase.from('training_attendance').upsert({ session_id: session.id, user_id: userId, status }, { onConflict: 'session_id,user_id' }) as { error: { message: string } | null };
    if (error) { console.error('[NextTraining] respond failed:', error.message); setMyStatus(prevStatus); }
    else setPrevStatus(status);
  }, [session?.id, userId, prevStatus]);

  const sendMessage = useCallback(async ({ clubId: cId, content, type = 'info' }: { clubId: string; content: string; type?: string }): Promise<boolean> => {
    if (!session?.id || !content?.trim()) return false;
    const { error } = await supabase.from('training_messages').insert({ session_id: session.id, club_id: cId, author_id: userId, content: sanitizeText(content.trim()), type }) as { error: { message: string } | null };
    if (error) { console.error('[NextTraining] sendMessage failed:', error.message); return false; }
    return true;
  }, [session?.id, userId]);

  return { session, counts, myStatus, loading, respond, sendMessage };
}
