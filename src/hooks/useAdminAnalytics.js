import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

function buildDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucketByDay(rows, dateField, days) {
  const map = {};
  days.forEach(d => { map[d] = 0; });
  rows.forEach(r => {
    const day = (r[dateField] || '').slice(0, 10);
    if (day in map) map[day]++;
  });
  return days.map(d => ({ day: d, count: map[d] }));
}

export function useAdminAnalytics() {
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);

  const fetchDashboard = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceIso = since.toISOString();
      const dayList  = buildDays(days);

      // Période précédente pour comparaison (même durée avant la période courante)
      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - days * 2);
      const prevSinceIso = prevSince.toISOString();

      // Requêtes parallèles
      const [
        usersRes,
        clubsRes,
        eventsRes,
        posterExportsRes,
        aiUsageRes,
        featureUsageRes,
        kpiUsersTotal,
        kpiClubsTotal,
        activeUsersRes,
        // Funnel
        funnelOnboarded,
        funnelClubFollowers,
        funnelEventCreators,
        funnelPosterCreators,
        funnelAnnouncers,
        templateUsageRes,
        prevUsersRes,
        prevClubsRes,
        prevEventsRes,
        activeClubsRes,
      ] = await Promise.all([
        // Nouveaux utilisateurs sur la période
        supabase.from('profiles').select('created_at').gte('created_at', sinceIso),
        // Nouveaux clubs sur la période
        supabase.from('clubs').select('created_at').gte('created_at', sinceIso),
        // Événements créés sur la période
        supabase.from('events').select('created_at').gte('created_at', sinceIso),
        // Exports affiches sur la période
        supabase.from('poster_exports').select('created_at, channel, format').gte('created_at', sinceIso),
        // Usage IA (quota mensuel)
        supabase.from('club_ai_usage').select('generate_count, import_count'),
        // Feature usage analytics_events
        supabase.from('analytics_events').select('event_type').gte('created_at', sinceIso),
        // Total utilisateurs
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        // Total clubs
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        // Utilisateurs actifs (distinct via analytics_events)
        supabase.from('analytics_events').select('user_id').gte('created_at', sinceIso),
        // Funnel — utilisateurs ayant terminé l'onboarding
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_done', true),
        // Funnel — utilisateurs suivant au moins un club
        supabase.from('club_follows').select('user_id', { count: 'exact', head: true }),
        // Funnel — utilisateurs ayant créé un événement
        supabase.from('events').select('user_id', { count: 'exact', head: true }),
        // Funnel — utilisateurs ayant exporté une affiche
        supabase.from('poster_exports').select('user_id', { count: 'exact', head: true }),
        // Funnel — utilisateurs ayant publié une annonce
        supabase.from('club_announcements').select('author_id', { count: 'exact', head: true }),
        // Top templates utilisés (avec template_id)
        supabase.from('poster_exports').select('template_id').not('template_id', 'is', null),
        // Période précédente — nouveaux utilisateurs
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        // Période précédente — nouveaux clubs
        supabase.from('clubs').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        // Période précédente — événements créés
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        // Clubs actifs (ayant créé un événement dans la période)
        supabase.from('events').select('club_id').gte('created_at', sinceIso).not('club_id', 'is', null),
      ]);

      // Courbes par jour
      const usersByDay   = bucketByDay(usersRes.data ?? [], 'created_at', dayList);
      const clubsByDay   = bucketByDay(clubsRes.data ?? [], 'created_at', dayList);
      const eventsByDay  = bucketByDay(eventsRes.data ?? [], 'created_at', dayList);
      const postersByDay = bucketByDay(posterExportsRes.data ?? [], 'created_at', dayList);

      // KPIs résumés
      const newUsers   = usersRes.data?.length ?? 0;
      const newClubs   = clubsRes.data?.length ?? 0;
      const newEvents  = eventsRes.data?.length ?? 0;
      const newPosters = posterExportsRes.data?.length ?? 0;

      // Total IA
      const totalAiGenerate = (aiUsageRes.data ?? []).reduce((s, r) => s + (r.generate_count ?? 0), 0);
      const totalAiImport   = (aiUsageRes.data ?? []).reduce((s, r) => s + (r.import_count ?? 0), 0);

      // Répartition exports par canal
      const exportByChannel = {};
      const exportByFormat  = {};
      (posterExportsRes.data ?? []).forEach(({ channel, format }) => {
        exportByChannel[channel] = (exportByChannel[channel] ?? 0) + 1;
        exportByFormat[format]   = (exportByFormat[format]   ?? 0) + 1;
      });

      // Top templates
      const templateCount = {};
      (templateUsageRes.data ?? []).forEach(({ template_id }) => {
        if (template_id) templateCount[template_id] = (templateCount[template_id] ?? 0) + 1;
      });
      const topTemplates = Object.entries(templateCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));

      // Usage des fonctionnalités (analytics_events)
      const featureCount = {};
      (featureUsageRes.data ?? []).forEach(({ event_type }) => {
        featureCount[event_type] = (featureCount[event_type] ?? 0) + 1;
      });

      // Utilisateurs actifs uniques
      const activeSet = new Set((activeUsersRes.data ?? []).map(r => r.user_id));

      // Clubs actifs (distinct club_id)
      const activeClubsSet = new Set((activeClubsRes.data ?? []).map(r => r.club_id).filter(Boolean));

      // Évolutions vs période précédente (en %)
      function pctChange(curr, prev) {
        if (!prev) return prev === 0 && curr > 0 ? 100 : null;
        return Math.round(((curr - prev) / prev) * 100);
      }
      const trends = {
        newUsers:   pctChange(newUsers,  prevUsersRes.count  ?? 0),
        newClubs:   pctChange(newClubs,  prevClubsRes.count  ?? 0),
        newEvents:  pctChange(newEvents, prevEventsRes.count ?? 0),
        newPosters: pctChange(newPosters, (posterExportsRes.data ?? []).length > 0 ? null : 0),
      };

      // Funnel de conversion complet
      const totalUsers = kpiUsersTotal.count ?? 0;
      const funnel = [
        { label: 'Inscrits',                count: totalUsers,                         icon: '👤' },
        { label: 'Onboarding terminé',      count: funnelOnboarded.count    ?? 0,      icon: '✅' },
        { label: 'Suivent un club',         count: funnelClubFollowers.count ?? 0,     icon: '⭐' },
        { label: 'Ont créé un événement',   count: funnelEventCreators.count ?? 0,     icon: '📅' },
        { label: 'Ont exporté une affiche', count: funnelPosterCreators.count ?? 0,    icon: '🎨' },
        { label: 'Ont publié une annonce',  count: funnelAnnouncers.count   ?? 0,      icon: '📣' },
      ];

      setData({
        days,
        dayList,
        kpi: {
          newUsers,
          newClubs,
          newEvents,
          newPosters,
          totalUsers,
          totalClubs:   kpiClubsTotal.count ?? 0,
          activeUsers:  activeSet.size,
          activeClubs:  activeClubsSet.size,
          totalAiGenerate,
          totalAiImport,
        },
        trends,
        curves: { usersByDay, clubsByDay, eventsByDay, postersByDay },
        exportByChannel,
        exportByFormat,
        featureCount,
        funnel,
        topTemplates,
        hasAnalyticsData: (featureUsageRes.data?.length ?? 0) > 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, fetchDashboard };
}
