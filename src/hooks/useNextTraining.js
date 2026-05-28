import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useNextTraining(clubId, userId, teamId = null) {
  const [session, setSession]   = useState(null);
  const [counts, setCounts]     = useState({ present: 0, absent: 0, unsure: 0 });
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [prevStatus, setPrevStatus] = useState(null);

  // Phase 1 — fetch the next upcoming session for the club (+ optional team filter)
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

    q.maybeSingle().then(({ data }) => {
      if (!cancelled) { setSession(data ?? null); setLoading(false); }
    });

    return () => { cancelled = true; };
  }, [clubId, teamId]);

  // Phase 2 — fetch attendance + realtime when session is known
  useEffect(() => {
    if (!session?.id) return;
    let cancelled = false;

    function applyList(list) {
      setCounts({
        present: list.filter(a => a.status === 'present').length,
        absent:  list.filter(a => a.status === 'absent').length,
        unsure:  list.filter(a => a.status === 'unsure').length,
      });
      if (userId) {
        const mine = list.find(a => a.user_id === userId);
        setMyStatus(mine?.status ?? null);
        setPrevStatus(mine?.status ?? null);
      }
    }

    supabase
      .from('training_attendance')
      .select('id, user_id, status')
      .eq('session_id', session.id)
      .then(({ data }) => { if (!cancelled) applyList(data ?? []); });

    const channel = supabase
      .channel(`next-training-${session.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'training_attendance',
        filter: `session_id=eq.${session.id}`,
      }, () => {
        supabase
          .from('training_attendance')
          .select('id, user_id, status')
          .eq('session_id', session.id)
          .then(({ data }) => { if (!cancelled) applyList(data ?? []); });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.id, userId]);

  const respond = useCallback(async (status) => {
    if (!session?.id || !userId) return;
    setMyStatus(status);
    const { error } = await supabase
      .from('training_attendance')
      .upsert({ session_id: session.id, user_id: userId, status }, { onConflict: 'session_id,user_id' });
    if (error) {
      console.error('[NextTraining] respond failed:', error.message);
      setMyStatus(prevStatus);
    } else {
      setPrevStatus(status);
    }
  }, [session?.id, userId, prevStatus]);

  const sendMessage = useCallback(async ({ clubId: cId, content, type = 'info' }) => {
    if (!session?.id || !content?.trim()) return false;
    const { error } = await supabase
      .from('training_messages')
      .insert({ session_id: session.id, club_id: cId, author_id: userId, content: content.trim(), type });
    if (error) { console.error('[NextTraining] sendMessage failed:', error.message); return false; }
    return true;
  }, [session?.id, userId]);

  return { session, counts, myStatus, loading, respond, sendMessage };
}
