import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

// Fenêtre temporelle : J-3 (communicant) à J+1 (post-match)
function getMatchWindow() {
  const from = new Date();
  from.setDate(from.getDate() - 1);
  from.setHours(0, 0, 0, 0);

  const to = new Date();
  to.setDate(to.getDate() + 4);
  to.setHours(23, 59, 59, 999);

  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Agrège toutes les données nécessaires aux QuickAction cards :
 *   – entraînement du jour (coaches)
 *   – matchs J-3 à J+1 avec statuts et compteurs convocations (coaches)
 *   – matchs live en cours (tous rôles – Multiplex)
 *
 * @param {object} opts
 * @param {object|null} opts.currentUser
 * @param {array}  opts.managedClubs    – sortie de useManagedClubs (inclut managerRole)
 * @param {array}  opts.followedClubIds – clubs suivis (pour le Multiplex live)
 * @param {boolean} opts.isCoachOrManager
 * @param {boolean} opts.isCommunicant
 */
export function useQuickActions({
  currentUser,
  managedClubs,
  followedClubIds,
  isCoachOrManager,
  isCommunicant,
}) {
  const [todayTraining,    setTodayTraining]    = useState(null);
  const [coachMatches,     setCoachMatches]     = useState([]);
  const [liveMatches,      setLiveMatches]      = useState([]);
  const [loading,          setLoading]          = useState(true);

  // Map eventId → clubId pour filtrer les updates Realtime
  const eventClubMapRef = useRef({});

  const allManagedIds = useMemo(
    () => managedClubs.map(c => String(c.id)),
    [managedClubs],
  );

  const followedSet = useMemo(
    () => new Set((followedClubIds ?? []).map(String)),
    [followedClubIds],
  );

  // ── Chargement initial ────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!currentUser?.id) {
      setTodayTraining(null); setCoachMatches([]); setLiveMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const { from, to } = getMatchWindow();

    const [trainingRes, eventsRes] = await Promise.all([
      // 1. Entraînement du jour pour les clubs gérés
      (isCoachOrManager || isCommunicant) && allManagedIds.length
        ? supabase
            .from('training_sessions')
            .select('id, club_id, team_id, time, location, status')
            .in('club_id', allManagedIds)
            .eq('date', todayDate)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),

      // 2. Events J-3 à J+1 pour clubs coach/communicant
      allManagedIds.length
        ? supabase
            .from('events')
            .select('id, title, date, adversaire, home_or_away, team_name, club_id, score, event_type')
            .in('club_id', allManagedIds)
            .gte('date', from)
            .lte('date', to)
            .in('event_type', ['match', 'friendly'])
            .order('date', { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

    const allClubIds = [...new Set([...allManagedIds, ...(followedClubIds ?? []).map(String)])];

    // 3b. Requête live séparée (besoin de allClubIds)
    const { data: liveScoreRows } = allClubIds.length
      ? await supabase
          .from('match_scores')
          .select('event_id, score_home, score_away, status')
          .eq('status', 'in_progress')
      : { data: [] };

    // 4. match_scores pour les events de la fenêtre
    const windowEventIds = (eventsRes.data ?? []).map(e => e.id);
    const { data: scoreRows } = windowEventIds.length
      ? await supabase
          .from('match_scores')
          .select('event_id, score_home, score_away, status')
          .in('event_id', windowEventIds)
      : { data: [] };

    // 5. Compteurs convocations pour ces events
    const { data: convocRows } = windowEventIds.length
      ? await supabase
          .from('event_convocations')
          .select('event_id, status')
          .in('event_id', windowEventIds)
      : { data: [] };

    // ── Assemblage ─────────────────────────────────────────────────────────
    const scoreMap   = {};
    const convocMap  = {};
    const eventMap   = {};

    for (const s of (scoreRows ?? [])) scoreMap[s.event_id] = s;
    for (const e of (eventsRes.data ?? [])) {
      eventMap[e.id] = e;
      eventClubMapRef.current[e.id] = e.club_id;
    }

    for (const c of (convocRows ?? [])) {
      if (!convocMap[c.event_id]) {
        convocMap[c.event_id] = { accepted: 0, declined: 0, unavailable: 0, pending: 0, total: 0 };
      }
      convocMap[c.event_id][c.status] = (convocMap[c.event_id][c.status] ?? 0) + 1;
      convocMap[c.event_id].total += 1;
    }

    const builtCoachMatches = (eventsRes.data ?? []).map(ev => ({
      event:             ev,
      matchScore:        scoreMap[ev.id] ?? null,
      convocationCounts: convocMap[ev.id] ?? null,
    }));

    setTodayTraining(trainingRes.data ?? null);
    setCoachMatches(builtCoachMatches);

    // Live matches : on résout le club_id via eventMap ou une query supplémentaire
    const liveEventIds = (liveScoreRows ?? []).map(s => s.event_id);
    let liveEventRows = [];
    if (liveEventIds.length) {
      const { data: lev } = await supabase
        .from('events')
        .select('id, title, adversaire, team_name, club_id, sport')
        .in('id', liveEventIds);
      liveEventRows = lev ?? [];
      for (const e of liveEventRows) eventClubMapRef.current[e.id] = e.club_id;
    }

    const liveScoreMap = {};
    for (const s of (liveScoreRows ?? [])) liveScoreMap[s.event_id] = s;

    const builtLive = liveEventRows
      .filter(e => followedSet.has(String(e.club_id)) || allManagedIds.includes(String(e.club_id)))
      .map(e => ({
        event:      e,
        matchScore: liveScoreMap[e.id] ?? null,
      }));

    setLiveMatches(builtLive);
    setLoading(false);
  }, [currentUser?.id, allManagedIds, followedClubIds, followedSet, isCoachOrManager, isCommunicant]);

  useEffect(() => { load(); }, [load]);

  // ── Realtime : match_scores ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`quick-actions-scores-${currentUser.id}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'match_scores',
      }, ({ new: row }) => {
        const clubId = String(eventClubMapRef.current[row.event_id] ?? '');

        // Mettre à jour coachMatches si c'est un event géré
        if (allManagedIds.includes(clubId)) {
          setCoachMatches(prev => prev.map(m =>
            m.event.id === row.event_id
              ? { ...m, matchScore: row }
              : m
          ));
        }

        // Mettre à jour liveMatches
        if (row.status === 'in_progress') {
          setLiveMatches(prev => {
            const exists = prev.some(m => m.event.id === row.event_id);
            if (exists) {
              return prev.map(m =>
                m.event.id === row.event_id ? { ...m, matchScore: row } : m
              );
            }
            // Nouveau match en live : reload complet pour récupérer les infos event
            load();
            return prev;
          });
        } else {
          // Le match n'est plus live : le retirer du Multiplex
          setLiveMatches(prev => prev.filter(m => m.event.id !== row.event_id));
        }
      })
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'match_scores',
      }, ({ new: row }) => {
        if (row.status === 'in_progress') load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, allManagedIds, load]);

  // ── Realtime : event_convocations → met à jour les compteurs en temps réel ─
  useEffect(() => {
    if (!currentUser?.id || !isCoachOrManager) return;

    const convocChannel = supabase
      .channel(`quick-actions-convocs-${currentUser.id}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'event_convocations',
      }, () => {
        // Reload simple pour recalculer les compteurs agrégés
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(convocChannel); };
  }, [currentUser?.id, isCoachOrManager, load]);

  return {
    todayTraining,
    coachMatches,
    liveMatches,
    loading,
  };
}
