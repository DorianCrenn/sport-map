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
      .gte('date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
      .order('date', { ascending: true });

    if (teamId) query = query.eq('team_id', teamId);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('[TrainingSessions] fetch failed:', error.message);
      setSessions(data ?? []);
      setLoading(false);
    }).catch(err => {
      if (cancelled) return;
      console.error('[TrainingSessions] fetch rejected:', err.message);
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

  // Génère des instances concrètes de séances récurrentes dans training_sessions.
  // teamId (2e param) est l'équipe à laquelle rattacher les séances créées.
  // Utilise une dédup côté DB pour éviter les doublons même si l'état local est incomplet.
  const generateFromRecurring = useCallback(async (recurSessions, targetTeamId, weeksAhead = 4) => {
    const DAY_TO_JS = { Lundi:1, Mardi:2, Mercredi:3, Jeudi:4, Vendredi:5, Samedi:6, Dimanche:0 };
    const today = new Date();
    const end   = new Date(today.getTime() + weeksAhead * 7 * 86400000);
    const todayStr = today.toISOString().slice(0, 10);
    const endStr   = end.toISOString().slice(0, 10);

    const recurring = (recurSessions ?? []).filter(s => s.recurring);
    if (!recurring.length) return 0;

    const allRefIds = recurring.map(s => s.id);

    // Vérification côté DB — quelles combinaisons (ref_id, date) existent déjà ?
    const { data: existing } = await supabase
      .from('training_sessions')
      .select('session_ref_id, date')
      .eq('club_id', clubIdStr)
      .in('session_ref_id', allRefIds)
      .gte('date', todayStr)
      .lte('date', endStr);

    const existingSet = new Set((existing ?? []).map(e => `${e.session_ref_id}|${e.date}`));

    const toCreate = [];
    for (const s of recurring) {
      const jsDay = DAY_TO_JS[s.day];
      if (jsDay === undefined) continue;
      let cur = new Date(today);
      cur.setDate(cur.getDate() + ((jsDay - cur.getDay() + 7) % 7));
      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10);
        if (!existingSet.has(`${s.id}|${dateStr}`)) {
          toCreate.push({
            club_id:        clubIdStr,
            team_id:        targetTeamId ?? null,
            session_ref_id: s.id,
            date:           dateStr,
            time:           s.time        ?? null,
            location:       s.location   ?? null,
          });
        }
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }

    if (!toCreate.length) return 0;
    const { data, error } = await supabase.from('training_sessions').insert(toCreate).select();
    if (error) { console.error('[TrainingSessions] generate failed:', error.message); return 0; }
    setSessions(prev => [...prev, ...(data ?? [])].sort((a, b) => a.date.localeCompare(b.date)));
    return data?.length ?? 0;
  }, [clubIdStr]);

  return { sessions, loading, createSession, updateSession, deleteSession, generateFromRecurring };
}
