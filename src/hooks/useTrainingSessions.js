import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useTrainingSessions(clubId, teamId = null) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const clubIdStr = String(clubId ?? '');

  useEffect(() => {
    if (!clubIdStr) { setSessions([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('club_id', clubIdStr)
      .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)) // 7 jours passés + futur
      .order('date', { ascending: true });

    if (teamId) query = query.eq('team_id', teamId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('[TrainingSessions] fetch failed:', error.message);
      setSessions(data ?? []);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [clubIdStr, teamId]);

  const createSession = useCallback(async (fields) => {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({ club_id: clubIdStr, ...fields })
      .select()
      .single();
    if (error) { console.error('[TrainingSessions] create failed:', error.message); return null; }
    setSessions(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    return data;
  }, [clubIdStr]);

  const updateSession = useCallback(async (id, patch) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    const { error } = await supabase.from('training_sessions').update(patch).eq('id', id);
    if (error) console.error('[TrainingSessions] update failed:', error.message);
  }, []);

  const deleteSession = useCallback(async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    await supabase.from('training_sessions').delete().eq('id', id);
  }, []);

  // Génère des instances de séances récurrentes à partir du JSONB club_trainings
  const generateFromRecurring = useCallback(async (recurSessions, weeksAhead = 4) => {
    const DAY_TO_JS = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
    const today = new Date();
    const end = new Date(today.getTime() + weeksAhead * 7 * 86400000);
    const toCreate = [];

    for (const s of recurSessions) {
      if (!s.recurring) continue;
      const jsDay = DAY_TO_JS[s.day];
      let cur = new Date(today);
      cur.setDate(cur.getDate() + ((jsDay - cur.getDay() + 7) % 7));
      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10);
        const exists = sessions.some(ts => ts.session_ref_id === s.id && ts.date === dateStr);
        if (!exists) {
          toCreate.push({ club_id: clubIdStr, team_id: null, session_ref_id: s.id, date: dateStr, time: s.time, location: s.location ?? null });
        }
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }

    if (!toCreate.length) return;
    const { data, error } = await supabase.from('training_sessions').insert(toCreate).select();
    if (error) { console.error('[TrainingSessions] generate failed:', error.message); return; }
    setSessions(prev => [...prev, ...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
  }, [clubIdStr, sessions]);

  return { sessions, loading, createSession, updateSession, deleteSession, generateFromRecurring };
}
