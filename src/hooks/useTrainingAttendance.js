import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export function useTrainingAttendance(sessionId, userId = null) {
  const [attendance, setAttendance] = useState([]);   // liste complète pour les managers
  const [counts, setCounts]         = useState({ present: 0, absent: 0, unsure: 0 });
  const [myStatus, setMyStatus]     = useState(null); // 'present' | 'absent' | 'unsure' | null
  const [messages, setMessages]     = useState([]);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    // Fetch attendance list
    supabase
      .from('training_attendance')
      .select('id, user_id, player_id, status, updated_at, profiles(name, avatar_url)')
      .eq('session_id', sessionId)
      .then(({ data }) => {
        if (cancelled) return;
        const list = data ?? [];
        setAttendance(list);
        setCounts({
          present: list.filter(a => a.status === 'present').length,
          absent:  list.filter(a => a.status === 'absent').length,
          unsure:  list.filter(a => a.status === 'unsure').length,
        });
        if (userId) {
          const mine = list.find(a => a.user_id === userId);
          setMyStatus(mine?.status ?? null);
        }
      });

    // Fetch messages
    supabase
      .from('training_messages')
      .select('id, content, type, created_at, profiles(name, avatar_url)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (!cancelled) setMessages(data ?? []); });

    // Realtime
    const channel = supabase.channel(`training-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'training_attendance', filter: `session_id=eq.${sessionId}` },
        () => {
          supabase.from('training_attendance')
            .select('id, user_id, player_id, status, updated_at, profiles(name, avatar_url)')
            .eq('session_id', sessionId)
            .then(({ data }) => {
              const list = data ?? [];
              setAttendance(list);
              setCounts({
                present: list.filter(a => a.status === 'present').length,
                absent:  list.filter(a => a.status === 'absent').length,
                unsure:  list.filter(a => a.status === 'unsure').length,
              });
              if (userId) setMyStatus(list.find(a => a.user_id === userId)?.status ?? null);
            });
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'training_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => { setMessages(prev => [...prev, payload.new]); })
      .subscribe();

    channelRef.current = channel;
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);

  // Respond to training (présent / absent / unsure)
  const respond = useCallback(async (status) => {
    if (!sessionId || !userId) return;
    setMyStatus(status);
    const prev = attendance.find(a => a.user_id === userId);

    const { error } = await supabase
      .from('training_attendance')
      .upsert({ session_id: sessionId, user_id: userId, status }, { onConflict: 'session_id,user_id' });

    if (error) {
      console.error('[Attendance] respond failed:', error.message);
      setMyStatus(prev?.status ?? null);
    }
  }, [sessionId, userId, attendance]);

  // Send message (manager only — RLS enforced server-side)
  const sendMessage = useCallback(async ({ clubId, content, type = 'info' }) => {
    if (!sessionId || !content?.trim()) return false;
    const { error } = await supabase
      .from('training_messages')
      .insert({ session_id: sessionId, club_id: clubId, author_id: userId, content: content.trim(), type });
    if (error) { console.error('[TrainingMessages] send failed:', error.message); return false; }
    return true;
  }, [sessionId, userId]);

  return { attendance, counts, myStatus, messages, respond, sendMessage };
}
