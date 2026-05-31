import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Feed d'actualités Realtime pour l'onglet Actualités.
 * Agrège :
 *   - Annonces des clubs suivis (club_announcements)
 *   - Résultats récents (events avec score non null, clubs suivis)
 *   - Prochains matchs des clubs suivis
 *
 * follows        : tableau { clubId, teams: 'all' | string[] } — filtre par équipe
 * managedClubIds : IDs des clubs gérés (admin/coach) — pas de filtre d'équipe pour eux
 *
 * Fonctionne sans auth — retourne des tableaux vides si non connecté.
 */

function isEventVisible(event, follows, managedClubIds) {
  const cid = String(event.club_id);
  if (managedClubIds.includes(cid)) return true;
  const follow = follows.find(f => String(f.clubId) === cid);
  if (!follow || follow.teams === 'all') return true;
  return follow.teams.includes(event.team_name ?? '');
}

export function useNewsFeed({ followedClubIds = [], follows = [], managedClubIds = [] }) {
  const [announcements, setAnnouncements] = useState([]);
  const [results, setResults]             = useState([]);
  const [upcoming, setUpcoming]           = useState([]);
  const [rides, setRides]                 = useState([]);
  const [loading, setLoading]             = useState(false);

  const hasClubs = followedClubIds.length > 0;

  useEffect(() => {
    if (!hasClubs) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const clubIds = followedClubIds.map(String);

      // Annonces — 20 dernières des clubs suivis
      const { data: ann } = await supabase
        .from('club_announcements')
        .select('id, club_id, club_name, type, title, message, created_at, author_name')
        .in('club_id', clubIds)
        .order('created_at', { ascending: false })
        .limit(20);

      // Résultats récents — events passés avec score, des clubs suivis
      const now = new Date().toISOString();
      const { data: res } = await supabase
        .from('events')
        .select('id, title, sport, date, score, club_id, venue, city, event_type, level, team_name')
        .in('club_id', clubIds)
        .not('score', 'is', null)
        .lt('date', now)
        .order('date', { ascending: false })
        .limit(10);

      // Prochains matchs — events futurs + 7 derniers jours (matchs récents sans score)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: ups } = await supabase
        .from('events')
        .select('id, title, sport, date, club_id, venue, city, event_type, level, home_or_away, team_name, poster_url')
        .in('club_id', clubIds)
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: true })
        .limit(10);

      // Covoiturages actifs pour les prochains matchs suivis
      let ridesData = [];
      const upcomingIds = (ups ?? []).map(e => String(e.id));
      if (upcomingIds.length > 0) {
        const { data: rds } = await supabase
          .from('rides')
          .select(`
            id, event_id, driver_name, departure_location,
            departure_time, available_seats, status, created_at,
            ride_requests ( status )
          `)
          .in('event_id', upcomingIds)
          .in('status', ['active', 'full'])
          .order('departure_time', { ascending: true })
          .limit(15);
        ridesData = rds ?? [];
      }

      if (cancelled) return;
      setAnnouncements(ann ?? []);
      setResults((res ?? []).filter(e => isEventVisible(e, follows, managedClubIds)));
      setUpcoming((ups ?? []).filter(e => isEventVisible(e, follows, managedClubIds)));
      setRides(ridesData);
      setLoading(false);
    }

    load();

    const clubIdSet = new Set(followedClubIds.map(String));

    // Realtime sur les annonces + événements (scores + nouveaux matchs)
    const channel = supabase
      .channel('news-feed-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_announcements',
      }, (payload) => {
        const row = payload.new;
        if (!clubIdSet.has(String(row.club_id))) return;
        setAnnouncements(prev => [row, ...prev].slice(0, 20));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'events',
      }, (payload) => {
        const row = payload.new;
        if (!clubIdSet.has(String(row.club_id))) return;
        // Score mis à jour → refresher les résultats
        if (row.score != null && new Date(row.date) < new Date()) {
          setResults(prev => {
            const without = prev.filter(e => e.id !== row.id);
            return [row, ...without].slice(0, 10);
          });
        }
        // Si l'événement est futur, mettre à jour la liste upcoming
        if (new Date(row.date) >= new Date()) {
          setUpcoming(prev => prev.map(e => e.id === row.id ? { ...e, ...row } : e));
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
      }, (payload) => {
        const row = payload.new;
        if (!clubIdSet.has(String(row.club_id))) return;
        if (!isEventVisible(row, follows, managedClubIds)) return;
        if (new Date(row.date) >= new Date()) {
          setUpcoming(prev => [row, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10));
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
      }, (payload) => {
        const row = payload.new;
        // On ajoute le ride si son event est dans nos events suivis
        setUpcoming(prev => {
          const eventIds = new Set(prev.map(e => String(e.id)));
          if (!eventIds.has(String(row.event_id))) return prev;
          setRides(current => [...current, { ...row, ride_requests: [] }].slice(0, 15));
          return prev;
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
      }, (payload) => {
        const row = payload.new;
        setRides(prev => prev.map(r => r.id === row.id ? { ...r, ...row } : r));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followedClubIds.join(','), follows.map(f => `${f.clubId}:${f.teams}`).join(';'), managedClubIds.join(',')]);

  return { announcements, results, upcoming, rides, loading, hasClubs };
}
