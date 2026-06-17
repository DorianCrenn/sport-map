import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

export function useSeasonPlanning({
  userId,
  allClubIds = [],
  managedClubIds = [],
  managedClubs = [],
  year,
  month,
  clubFilter = 'all',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Set des event IDs actuellement chargés — utilisé par le listener Realtime
  const matchEventIdsRef = useRef(new Set());

  const { firstDay, lastDay } = useMemo(() => {
    const y = year  ?? new Date().getFullYear();
    const m = month ?? new Date().getMonth() + 1;
    const last = new Date(y, m, 0);
    const mm = String(m).padStart(2, '0');
    const dd = String(last.getDate()).padStart(2, '0');
    return { firstDay: `${y}-${mm}-01`, lastDay: `${y}-${mm}-${dd}` };
  }, [year, month]);

  const clubIdKey  = useMemo(() => [...new Set(allClubIds.map(String).filter(Boolean))].sort().join(','), [allClubIds]);
  const managedKey = useMemo(() => [...new Set(managedClubIds.map(String).filter(Boolean))].sort().join(','), [managedClubIds]);

  // Clé stable pour distinguer coach (owner/manager/editor) de communicant
  const coachKey = useMemo(
    () => managedClubs.filter(c => c.managerRole !== 'communicant').map(c => String(c.id)).sort().join(','),
    [managedClubs],
  );
  const commKey = useMemo(
    () => managedClubs.filter(c => c.managerRole === 'communicant').map(c => String(c.id)).sort().join(','),
    [managedClubs],
  );

  useEffect(() => {
    const baseClubIds = clubIdKey.split(',').filter(Boolean);
    const filtered    = clubFilter !== 'all'
      ? baseClubIds.filter(id => id === String(clubFilter))
      : baseClubIds;

    if (!userId || !filtered.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const managedSet = new Set(managedKey.split(',').filter(Boolean));
    const coachSet   = new Set(coachKey.split(',').filter(Boolean));
    const commSet    = new Set(commKey.split(',').filter(Boolean));

    async function load() {
      setLoading(true);

      // 1. Joueurs directs + enfants (parents)
      const [{ data: directEntries }, { data: guardianRows }] = await Promise.all([
        supabase.from('club_players').select('club_id, team_id, name').eq('user_id', userId).eq('is_active', true),
        supabase.from('player_guardians').select('player_id').eq('user_id', userId),
      ]);

      let childEntries = [];
      if (guardianRows?.length) {
        const pids = guardianRows.map(g => g.player_id);
        const { data: children } = await supabase
          .from('club_players').select('club_id, team_id, name').in('id', pids).eq('is_active', true);
        childEntries = children ?? [];
      }

      if (cancelled) return;

      const allEntries    = [...(directEntries ?? []), ...childEntries];
      const playerClubSet = new Set(allEntries.map(e => String(e.club_id)));
      const playerTeamIds = [...new Set(allEntries.map(e => String(e.team_id)).filter(Boolean))];

      const trainingClubs = filtered.filter(id => playerClubSet.has(id) || managedSet.has(id));

      // 2. Séances + events du mois en parallèle
      const [sessionsRes, eventsRes] = await Promise.all([
        trainingClubs.length
          ? supabase
              .from('training_sessions')
              .select('id, club_id, team_id, date, time, location, status')
              .in('club_id', trainingClubs)
              .gte('date', firstDay)
              .lte('date', lastDay)
              .neq('status', 'cancelled')
              .order('date').order('time')
          : Promise.resolve({ data: [] }),

        supabase
          .from('events')
          .select('id, club_id, title, sport, date, venue, city, event_type, team_name, category, adversaire, home_or_away, level, cup_type, score')
          .in('club_id', filtered)
          .gte('date', `${firstDay}T00:00:00`)
          .lte('date', `${lastDay}T23:59:59`)
          .eq('is_archived', false)
          .not('title', 'ilike', 'entraînement%')
          .order('date'),
      ]);

      if (cancelled) return;

      const sessions = (sessionsRes.data ?? []).filter(s => {
        if (managedSet.has(String(s.club_id))) return true;
        if (!s.team_id) return true;
        return playerTeamIds.includes(String(s.team_id));
      });

      const events     = eventsRes.data ?? [];
      const sessionIds = sessions.map(s => s.id);
      const eventIds   = events.map(e => e.id);

      // 3. Présence, compteurs, convocations et scores en parallèle
      const [
        trainAttRes, matchAttRes,
        trainCntRes, matchCntRes,
        convocRes,   matchScoresRes,
      ] = await Promise.all([
        sessionIds.length
          ? supabase.from('training_attendance').select('session_id, status').in('session_id', sessionIds).eq('user_id', userId)
          : { data: [] },
        eventIds.length
          ? supabase.from('match_player_attendance').select('event_id, status').in('event_id', eventIds).eq('user_id', userId)
          : { data: [] },
        sessionIds.length
          ? supabase.from('training_attendance_counts').select('session_id, present_count, absent_count, unsure_count').in('session_id', sessionIds)
          : { data: [] },
        eventIds.length
          ? supabase.from('match_attendance_counts').select('event_id, present_count, absent_count, unsure_count').in('event_id', eventIds)
          : { data: [] },
        (managedSet.size > 0 && eventIds.length)
          ? supabase.from('event_convocations').select('event_id, status').in('event_id', eventIds)
          : { data: [] },
        // Scores live/final depuis match_scores (source de vérité pour le live)
        eventIds.length
          ? supabase.from('match_scores').select('event_id, score_home, score_away, status').in('event_id', eventIds)
          : { data: [] },
      ]);

      if (cancelled) return;

      const trainStatusMap = Object.fromEntries((trainAttRes.data ?? []).map(a => [a.session_id, a.status]));
      const matchStatusMap = Object.fromEntries((matchAttRes.data ?? []).map(a => [a.event_id,   a.status]));
      const trainCntMap    = Object.fromEntries((trainCntRes.data ?? []).map(r => [r.session_id, r]));
      const matchCntMap    = Object.fromEntries((matchCntRes.data ?? []).map(r => [r.event_id,   r]));
      const matchScoreMap  = Object.fromEntries((matchScoresRes.data ?? []).map(r => [r.event_id, r]));

      const convocMap = {};
      (convocRes.data ?? []).forEach(c => {
        if (!convocMap[c.event_id]) convocMap[c.event_id] = { total: 0, accepted: 0, pending: 0, declined: 0, unavailable: 0 };
        convocMap[c.event_id].total++;
        convocMap[c.event_id][c.status] = (convocMap[c.event_id][c.status] ?? 0) + 1;
      });

      // ── Items entraînement ─────────────────────────────────────────────────
      const trainingItems = sessions.map(s => {
        const cnt   = trainCntMap[s.id] ?? {};
        const entry = allEntries.find(e => String(e.team_id) === String(s.team_id) && String(e.club_id) === String(s.club_id));
        return {
          id:           s.id,
          type:         'training',
          date:         s.date,
          time:         s.time ?? '',
          title:        entry?.name ? `Entraînement ${entry.name}` : 'Entraînement',
          location:     s.location ?? '',
          club_id:      s.club_id,
          status:       s.status,
          team_id:      s.team_id,
          myStatus:     trainStatusMap[s.id] ?? null,
          presentCount: cnt.present_count ?? 0,
          absentCount:  cnt.absent_count  ?? 0,
          unsureCount:  cnt.unsure_count  ?? 0,
          isStaffClub:  managedSet.has(String(s.club_id)),
          isPlayerClub: playerClubSet.has(String(s.club_id)),
          isSupporter:  false,
        };
      });

      // ── Items match ────────────────────────────────────────────────────────
      const matchItems = events.map(ev => {
        const cnt          = matchCntMap[ev.id]  ?? {};
        const convocs      = convocMap[ev.id]    ?? null;
        const matchScore   = matchScoreMap[ev.id] ?? null;
        const isCoachClub  = coachSet.has(String(ev.club_id));
        const isCommClub   = commSet.has(String(ev.club_id));
        const isStaffClub  = managedSet.has(String(ev.club_id));
        const isPlayerClub = playerClubSet.has(String(ev.club_id));
        const dateStr      = String(ev.date).slice(0, 10);
        const rawTime      = String(ev.date).slice(11, 16);
        const timeStr      = rawTime !== '00:00' ? rawTime : '';
        return {
          id:           ev.id,
          type:         'match',
          date:         dateStr,
          time:         timeStr,
          title:        ev.title,
          location:     ev.venue ?? ev.city ?? '',
          club_id:      ev.club_id,
          sport:        ev.sport ?? 'Football',
          adversaire:   ev.adversaire ?? '',
          event_type:   ev.event_type,
          category:     ev.category ?? '',
          team_name:    ev.team_name ?? '',
          home_or_away: ev.home_or_away,
          level:        ev.level ?? '',
          cup_type:     ev.cup_type ?? '',
          score:        ev.score,       // champ JSON events.score (fallback legacy)
          matchScore,                   // ligne match_scores (source de vérité live)
          myStatus:     matchStatusMap[ev.id] ?? null,
          presentCount: cnt.present_count ?? 0,
          absentCount:  cnt.absent_count  ?? 0,
          unsureCount:  cnt.unsure_count  ?? 0,
          convocs,
          isStaffClub,
          isCoachClub,   // owner/manager/editor → peut convoquer + saisir score
          isCommClub,    // communicant → peut créer affiche uniquement
          isPlayerClub,
          isSupporter:  !isStaffClub && !isPlayerClub,
        };
      });

      const merged = [...trainingItems, ...matchItems].sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return (a.time ?? '').localeCompare(b.time ?? '');
      });

      // Mémoriser les IDs des matchs pour le listener Realtime
      matchEventIdsRef.current = new Set(matchItems.map(m => String(m.id)));

      setItems(merged);
      setLoading(false);
    }

    load().catch(err => {
      console.error('[SeasonPlanning] load error:', err);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [userId, clubIdKey, managedKey, coachKey, commKey, firstDay, lastDay, clubFilter]);

  // ── Realtime : mise à jour des scores live ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`season-planning-scores-${userId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'match_scores',
      }, ({ new: row }) => {
        if (!matchEventIdsRef.current.has(String(row.event_id))) return;
        setItems(prev => prev.map(item =>
          item.id === row.event_id
            ? { ...item, matchScore: { status: row.status, score_home: row.score_home, score_away: row.score_away } }
            : item
        ));
      })
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'match_scores',
      }, ({ new: row }) => {
        if (!matchEventIdsRef.current.has(String(row.event_id))) return;
        setItems(prev => prev.map(item =>
          item.id === row.event_id
            ? { ...item, matchScore: { status: row.status, score_home: row.score_home, score_away: row.score_away } }
            : item
        ));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const respond = useCallback(async (type, id, status) => {
    if (!userId || !status) return;

    setItems(prev => prev.map(item => item.id === id ? { ...item, myStatus: status } : item));

    const table   = type === 'training' ? 'training_attendance' : 'match_player_attendance';
    const payload = type === 'training'
      ? { session_id: id, user_id: userId, status, updated_at: new Date().toISOString() }
      : { event_id:   id, user_id: userId, status, updated_at: new Date().toISOString() };
    const conflict = type === 'training' ? 'session_id,user_id' : 'event_id,user_id';

    const { error } = await supabase.from(table).upsert(payload, { onConflict: conflict });
    if (error) {
      console.error('[SeasonPlanning] respond failed:', error.message);
      setItems(prev => prev.map(item => item.id === id ? { ...item, myStatus: null } : item));
    }
  }, [userId]);

  // Mise à jour locale du score après saisie (évite un reload complet)
  const updateMatchScore = useCallback((eventId, scoreData) => {
    setItems(prev => prev.map(item =>
      item.id === eventId ? { ...item, matchScore: scoreData } : item,
    ));
  }, []);

  return { items, loading, respond, updateMatchScore };
}
