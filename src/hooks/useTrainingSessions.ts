import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

interface TrainingSession { id: string; club_id: string; team_id?: string | null; session_ref_id?: string | null; date: string; time?: string | null; location?: string | null; status?: string; recurring?: boolean; day?: string; [key: string]: unknown; }

export function useTrainingSessions(clubId: string | null | undefined, teamId: string | null = null) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const prevSessionsRef = useRef<TrainingSession[]>([]);
  const clubIdStr = String(clubId ?? '');

  useEffect(() => {
    if (!clubIdStr) { setSessions([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    let query = supabase.from('training_sessions').select('*').eq('club_id', clubIdStr)
      .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)).order('date', { ascending: true });
    if (teamId) query = query.eq('team_id', teamId);

    query.then(
      ({ data, error }: { data: TrainingSession[] | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (error) console.error('[TrainingSessions] fetch failed:', error.message);
        setSessions(data ?? []); setLoading(false);
      },
      (err: Error) => { if (cancelled) return; console.error('[TrainingSessions] fetch rejected:', err.message); setLoading(false); }
    );

    return () => { cancelled = true; };
  }, [clubIdStr, teamId]);

  const createSession = useCallback(async (fields: Partial<TrainingSession>): Promise<TrainingSession | null> => {
    const { data, error } = await supabase.from('training_sessions').insert({ club_id: clubIdStr, ...fields }).select().single() as { data: TrainingSession | null; error: { message: string } | null };
    if (error) { console.error('[TrainingSessions] create failed:', error.message); return null; }
    setSessions(prev => [...prev, data!].sort((a, b) => a.date.localeCompare(b.date)));
    window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'training_created' } }));
    return data;
  }, [clubIdStr]);

  const updateSession = useCallback(async (id: string, patch: Partial<TrainingSession>) => {
    if (patch.status && !['active', 'cancelled', 'rescheduled'].includes(patch.status)) return;
    setSessions(prev => { prevSessionsRef.current = prev; return prev.map(s => s.id === id ? { ...s, ...patch } : s); });
    const { error } = await supabase.from('training_sessions').update(patch).eq('id', id) as { error: { message: string } | null };
    if (error) { console.error('[TrainingSessions] update failed, rolling back:', error.message); setSessions(prevSessionsRef.current); }
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    setSessions(prev => { prevSessionsRef.current = prev; return prev.filter(s => s.id !== id); });
    const { error } = await supabase.from('training_sessions').delete().eq('id', id) as { error: { message: string } | null };
    if (error) { console.error('[TrainingSessions] delete failed, rolling back:', error.message); setSessions(prevSessionsRef.current); }
  }, []);

  const generateFromRecurring = useCallback(async (recurSessions: TrainingSession[], targetTeamId: string | null, weeksAhead = 4): Promise<number> => {
    const DAY_TO_JS: Record<string, number> = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
    const today = new Date(); const end = new Date(today.getTime() + weeksAhead * 7 * 86400000);
    const todayStr = today.toISOString().slice(0, 10); const endStr = end.toISOString().slice(0, 10);
    const recurring = (recurSessions ?? []).filter(s => s.recurring);
    if (!recurring.length) return 0;

    const allRefIds = recurring.map(s => s.id);
    const { data: existing } = await supabase.from('training_sessions').select('session_ref_id, date').eq('club_id', clubIdStr).in('session_ref_id', allRefIds).gte('date', todayStr).lte('date', endStr) as { data: { session_ref_id: string; date: string }[] | null };
    const existingSet = new Set((existing ?? []).map(e => `${e.session_ref_id}|${e.date}`));

    const toCreate: Partial<TrainingSession>[] = [];
    for (const s of recurring) {
      const jsDay = s.day ? DAY_TO_JS[s.day] : undefined;
      if (jsDay === undefined) continue;
      let cur = new Date(today); cur.setDate(cur.getDate() + ((jsDay - cur.getDay() + 7) % 7));
      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10);
        if (!existingSet.has(`${s.id}|${dateStr}`)) toCreate.push({ club_id: clubIdStr, team_id: targetTeamId ?? null, session_ref_id: s.id, date: dateStr, time: s.time ?? null, location: s.location ?? null });
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }
    if (!toCreate.length) return 0;
    const { data, error } = await supabase.from('training_sessions').insert(toCreate).select() as { data: TrainingSession[] | null; error: { message: string } | null };
    if (error) { console.error('[TrainingSessions] generate failed:', error.message); return 0; }
    setSessions(prev => [...prev, ...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
    return data?.length ?? 0;
  }, [clubIdStr]);

  return { sessions, loading, createSession, updateSession, deleteSession, generateFromRecurring };
}
