import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useMyTeamAgenda(userId) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);

      // 1. Équipes en tant que joueur direct
      const { data: directEntries } = await supabase
        .from('club_players')
        .select('club_id, team_id, name')
        .eq('user_id', userId)
        .eq('is_active', true);

      // 2. Équipes via parent/tuteur
      const { data: guardianEntries } = await supabase
        .from('player_guardians')
        .select('player_id')
        .eq('user_id', userId);

      let guardianTeams = [];
      if (guardianEntries?.length) {
        const playerIds = guardianEntries.map(g => g.player_id);
        const { data: guarded } = await supabase
          .from('club_players')
          .select('club_id, team_id, name')
          .in('id', playerIds)
          .eq('is_active', true);
        guardianTeams = guarded ?? [];
      }

      const allEntries = [...(directEntries ?? []), ...guardianTeams];
      if (cancelled) return;
      if (!allEntries.length) { setItems([]); setLoading(false); return; }

      const clubIds  = [...new Set(allEntries.map(e => String(e.club_id)).filter(Boolean))];
      const teamIds  = [...new Set(allEntries.map(e => String(e.team_id)).filter(Boolean))];
      const today    = new Date().toISOString().slice(0, 10);

      // 3. Prochains entraînements
      const { data: sessions } = await supabase
        .from('training_sessions')
        .select('id, club_id, team_id, date, time, location, status')
        .in('team_id', teamIds)
        .gte('date', today)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(4);

      // 4. Prochains matchs
      const { data: events } = await supabase
        .from('events')
        .select('id, club_id, homeTeam, awayTeam, date, city, sport, type, status')
        .in('club_id', clubIds)
        .gte('date', today)
        .neq('status', 'cancelled')
        .order('date', { ascending: true })
        .limit(4);

      if (cancelled) return;

      // 5. Statut de présence pour les entraînements
      const sessionIds = (sessions ?? []).map(s => s.id);
      const { data: trainAttendance } = sessionIds.length
        ? await supabase.from('training_attendance').select('session_id, status').in('session_id', sessionIds).eq('user_id', userId)
        : { data: [] };

      // 6. Statut de présence pour les matchs
      const eventIds = (events ?? []).map(e => e.id);
      const { data: matchAttendance } = eventIds.length
        ? await supabase.from('match_player_attendance').select('event_id, status').in('event_id', eventIds).eq('user_id', userId)
        : { data: [] };

      if (cancelled) return;

      const trainStatusMap = Object.fromEntries((trainAttendance ?? []).map(a => [a.session_id, a.status]));
      const matchStatusMap = Object.fromEntries((matchAttendance ?? []).map(a => [a.event_id, a.status]));

      // 7. Construire les items fusionnés + triés
      const trainingItems = (sessions ?? []).map(s => {
        const entry = allEntries.find(e => String(e.team_id) === String(s.team_id));
        return {
          type: 'training',
          id: s.id,
          data: s,
          myStatus: trainStatusMap[s.id] ?? null,
          teamName: entry?.name ?? null,
          clubId: s.club_id,
        };
      });

      const matchItems = (events ?? []).map(ev => {
        const entry = allEntries.find(e => String(e.club_id) === String(ev.club_id));
        return {
          type: 'match',
          id: ev.id,
          data: ev,
          myStatus: matchStatusMap[ev.id] ?? null,
          teamName: entry?.name ?? null,
          clubId: ev.club_id,
        };
      });

      const merged = [...trainingItems, ...matchItems].sort((a, b) => {
        const dateA = a.data.date;
        const dateB = b.data.date;
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
      }).slice(0, 6);

      setItems(merged);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  const respond = useCallback(async (type, id, status) => {
    if (!userId) return;

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, myStatus: status } : item
    ));

    if (type === 'training') {
      const { error } = await supabase
        .from('training_attendance')
        .upsert({ session_id: id, user_id: userId, status }, { onConflict: 'session_id,user_id' });
      if (error) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, myStatus: null } : item
        ));
      }
    } else {
      const { error } = await supabase
        .from('match_player_attendance')
        .upsert({ event_id: id, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
      if (error) {
        setItems(prev => prev.map(item =>
          item.id === id ? { ...item, myStatus: null } : item
        ));
      }
    }
  }, [userId]);

  return { items, loading, respond };
}
