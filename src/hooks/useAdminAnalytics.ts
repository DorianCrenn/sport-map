import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

interface DayCount { day: string; count: number; }

interface FunnelStep { label: string; count: number; icon: string; }

interface AnalyticsDashboard {
  days: number;
  dayList: string[];
  kpi: {
    newUsers: number;
    newClubs: number;
    newEvents: number;
    newPosters: number;
    totalUsers: number;
    totalClubs: number;
    activeUsers: number;
    activeClubs: number;
    totalAiGenerate: number;
    totalAiImport: number;
  };
  trends: {
    newUsers: number | null;
    newClubs: number | null;
    newEvents: number | null;
    newPosters: number | null;
  };
  curves: {
    usersByDay: DayCount[];
    clubsByDay: DayCcount[];
    eventsByDay: DayCcount[];
    postersByDay: DayCcount[];
  };
  exportByChannel: Record<string, number>;
  exportByFormat: Record<string, number>;
  featureCount: Record<string, number>;
  funnel: FunnelStep[];
  topTemplates: { id: string; count: number }[];
  hasAnalyticsData: boolean;
}

// fix typo in local type alias
type DayCcount = DayCcount2;
interface DayCcount2 { day: string; count: number; }

function buildDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function bucketByDay(rows: Record<string, string>[], dateField: string, days: string[]): DayCount[] {
  const map: Record<string, number> = {};
  days.forEach(d => { map[d] = 0; });
  rows.forEach(r => {
    const day = (r[dateField] || '').slice(0, 10);
    if (day in map) map[day]++;
  });
  return days.map(d => ({ day: d, count: map[d] }));
}

function pctChange(curr: number, prev: number | null): number | null {
  if (prev === null || prev === undefined) return null;
  if (!prev) return prev === 0 && curr > 0 ? 100 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export function useAdminAnalytics() {
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState<AnalyticsDashboard | null>(null);

  const fetchDashboard = useCallback(async (days = 7) => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceIso = since.toISOString();
      const dayList  = buildDays(days);

      const prevSince = new Date();
      prevSince.setDate(prevSince.getDate() - days * 2);
      const prevSinceIso = prevSince.toISOString();

      const [
        usersRes, clubsRes, eventsRes, posterExportsRes, aiUsageRes, featureUsageRes,
        kpiUsersTotal, kpiClubsTotal, activeUsersRes,
        funnelOnboarded, funnelClubFollowers, funnelEventCreators, funnelPosterCreators, funnelAnnouncers,
        templateUsageRes, prevUsersRes, prevClubsRes, prevEventsRes, activeClubsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', sinceIso),
        supabase.from('clubs').select('created_at').gte('created_at', sinceIso),
        supabase.from('events').select('created_at').gte('created_at', sinceIso),
        supabase.from('poster_exports').select('created_at, channel, format').gte('created_at', sinceIso),
        supabase.from('club_ai_usage').select('generate_count, import_count'),
        supabase.from('analytics_events').select('event_type').gte('created_at', sinceIso),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('analytics_events').select('user_id').gte('created_at', sinceIso),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_done', true),
        supabase.from('club_follows').select('user_id', { count: 'exact', head: true }),
        supabase.from('events').select('user_id', { count: 'exact', head: true }),
        supabase.from('poster_exports').select('user_id', { count: 'exact', head: true }),
        supabase.from('club_announcements').select('author_id', { count: 'exact', head: true }),
        supabase.from('poster_exports').select('template_id').not('template_id', 'is', null),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        supabase.from('clubs').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('created_at', prevSinceIso).lt('created_at', sinceIso),
        supabase.from('events').select('club_id').gte('created_at', sinceIso).not('club_id', 'is', null),
      ]);

      const usersByDay   = bucketByDay((usersRes.data ?? []) as Record<string, string>[], 'created_at', dayList);
      const clubsByDay   = bucketByDay((clubsRes.data ?? []) as Record<string, string>[], 'created_at', dayList);
      const eventsByDay  = bucketByDay((eventsRes.data ?? []) as Record<string, string>[], 'created_at', dayList);
      const postersByDay = bucketByDay((posterExportsRes.data ?? []) as Record<string, string>[], 'created_at', dayList);

      const newUsers   = usersRes.data?.length ?? 0;
      const newClubs   = clubsRes.data?.length ?? 0;
      const newEvents  = eventsRes.data?.length ?? 0;
      const newPosters = posterExportsRes.data?.length ?? 0;

      const totalAiGenerate = ((aiUsageRes.data ?? []) as { generate_count?: number }[]).reduce((s, r) => s + (r.generate_count ?? 0), 0);
      const totalAiImport   = ((aiUsageRes.data ?? []) as { import_count?: number }[]).reduce((s, r) => s + (r.import_count ?? 0), 0);

      const exportByChannel: Record<string, number> = {};
      const exportByFormat:  Record<string, number> = {};
      ((posterExportsRes.data ?? []) as { channel?: string; format?: string }[]).forEach(({ channel, format }) => {
        if (channel) exportByChannel[channel] = (exportByChannel[channel] ?? 0) + 1;
        if (format)  exportByFormat[format]   = (exportByFormat[format]   ?? 0) + 1;
      });

      const templateCount: Record<string, number> = {};
      ((templateUsageRes.data ?? []) as { template_id?: string }[]).forEach(({ template_id }) => {
        if (template_id) templateCount[template_id] = (templateCount[template_id] ?? 0) + 1;
      });
      const topTemplates = Object.entries(templateCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id, count]) => ({ id, count }));

      const featureCount: Record<string, number> = {};
      ((featureUsageRes.data ?? []) as { event_type?: string }[]).forEach(({ event_type }) => {
        if (event_type) featureCount[event_type] = (featureCount[event_type] ?? 0) + 1;
      });

      const activeSet = new Set(((activeUsersRes.data ?? []) as { user_id?: string }[]).map(r => r.user_id).filter(Boolean));
      const activeClubsSet = new Set(((activeClubsRes.data ?? []) as { club_id?: string }[]).map(r => r.club_id).filter(Boolean));

      const totalUsers = (kpiUsersTotal as { count?: number }).count ?? 0;
      const funnel: FunnelStep[] = [
        { label: 'Inscrits',                count: totalUsers,                                                     icon: '👤' },
        { label: 'Onboarding terminé',      count: (funnelOnboarded     as { count?: number }).count ?? 0,        icon: '✅' },
        { label: 'Suivent un club',         count: (funnelClubFollowers  as { count?: number }).count ?? 0,        icon: '⭐' },
        { label: 'Ont créé un événement',   count: (funnelEventCreators  as { count?: number }).count ?? 0,        icon: '📅' },
        { label: 'Ont exporté une affiche', count: (funnelPosterCreators as { count?: number }).count ?? 0,        icon: '🎨' },
        { label: 'Ont publié une annonce',  count: (funnelAnnouncers     as { count?: number }).count ?? 0,        icon: '📣' },
      ];

      setData({
        days,
        dayList,
        kpi: {
          newUsers, newClubs, newEvents, newPosters,
          totalUsers,
          totalClubs:   (kpiClubsTotal as { count?: number }).count ?? 0,
          activeUsers:  activeSet.size,
          activeClubs:  activeClubsSet.size,
          totalAiGenerate,
          totalAiImport,
        },
        trends: {
          newUsers:   pctChange(newUsers,  (prevUsersRes  as { count?: number }).count ?? 0),
          newClubs:   pctChange(newClubs,  (prevClubsRes  as { count?: number }).count ?? 0),
          newEvents:  pctChange(newEvents, (prevEventsRes as { count?: number }).count ?? 0),
          newPosters: null,
        },
        curves: { usersByDay, clubsByDay: clubsByDay as DayCcount2[], eventsByDay: eventsByDay as DayCcount2[], postersByDay: postersByDay as DayCcount2[] },
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
