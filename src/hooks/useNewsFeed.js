import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Feed d'actualités Realtime pour l'onglet Actualités.
 * Agrège :
 *   - Annonces des clubs suivis (club_announcements)
 *   - Résultats récents (events avec score non null, clubs suivis)
 *   - Prochains matchs des clubs suivis
 *
 * Fonctionne sans auth — retourne des tableaux vides si non connecté.
 */
export function useNewsFeed({ followedClubIds = [] }) {
  const [announcements, setAnnouncements] = useState([]);
  const [results, setResults]             = useState([]);
  const [upcoming, setUpcoming]           = useState([]);
  const [loading, setLoading]             = useState(true);

  const hasClubs = followedClubIds.length > 0;

  useEffect(() => {
    if (!hasClubs) { setLoading(false); return; }

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
        .select('id, title, sport, date, score, club_id, venue, city, event_type, level')
        .in('club_id', clubIds)
        .not('score', 'is', null)
        .lt('date', now)
        .order('date', { ascending: false })
        .limit(10);

      // Prochains matchs — events futurs des clubs suivis
      const { data: ups } = await supabase
        .from('events')
        .select('id, title, sport, date, club_id, venue, city, event_type, level, home_or_away')
        .in('club_id', clubIds)
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(10);

      if (cancelled) return;
      setAnnouncements(ann ?? []);
      setResults(res ?? []);
      setUpcoming(ups ?? []);
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
        if (new Date(row.date) >= new Date()) {
          setUpcoming(prev => [row, ...prev].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followedClubIds.join(',')]);

  return { announcements, results, upcoming, loading, hasClubs };
}
