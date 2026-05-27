import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubDashboard(clubId, clubEventIds = []) {
  const [data, setData] = useState({
    followers: 0,
    pageViews: { total: 0, weekly: 0, distinctViewers: 0, byWeek: [] },
    attendees: { total: 0, topEvents: [] },
    posterExports: 0,
    posterShares: 0,
    scheduledAnnouncements: [],
    loading: true,
  });

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;

    async function load() {
      const idsStr  = clubEventIds.map(String);
      const weekAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [followerRes, pageViewRes, attendeeRes, exportRes, shareRes, scheduledAnnRes] = await Promise.all([
        supabase
          .from('club_follower_counts')
          .select('follower_count')
          .eq('club_id', String(clubId))
          .maybeSingle(),

        supabase
          .from('club_page_views')
          .select('viewed_at, user_id')
          .eq('club_id', String(clubId)),

        idsStr.length > 0
          ? supabase
              .from('event_attendee_counts')
              .select('event_id, count')
              .in('event_id', idsStr)
          : Promise.resolve({ data: [] }),

        supabase
          .from('poster_exports')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', String(clubId))
          .gte('created_at', monthStart),

        supabase
          .from('poster_exports')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', String(clubId))
          .gte('created_at', monthStart)
          .in('channel', ['whatsapp', 'instagram', 'facebook', 'web_share', 'copy']),

        supabase
          .from('club_announcements')
          .select('id, title, message, type, scheduled_for, created_at')
          .eq('club_id', String(clubId))
          .not('scheduled_for', 'is', null)
          .gte('scheduled_for', new Date().toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(20),
      ]);

      if (cancelled) return;

      const followers = followerRes.data?.follower_count ?? 0;

      const views = pageViewRes.data ?? [];
      const totalViews      = views.length;
      const weeklyViews     = views.filter(v => v.viewed_at >= weekAgo).length;
      const distinctViewers = new Set(views.map(v => v.user_id).filter(Boolean)).size;
      const byWeek          = buildWeekBuckets(views.map(v => v.viewed_at), 8);

      const attRows        = attendeeRes.data ?? [];
      const totalAttendees = attRows.reduce((s, r) => s + r.count, 0);
      const topEvents      = [...attRows].sort((a, b) => b.count - a.count).slice(0, 5);

      setData({
        followers,
        pageViews: { total: totalViews, weekly: weeklyViews, distinctViewers, byWeek },
        attendees: { total: totalAttendees, topEvents },
        posterExports: exportRes.count ?? 0,
        posterShares: shareRes.count ?? 0,
        scheduledAnnouncements: scheduledAnnRes.data ?? [],
        loading: false,
      });
    }

    setData(d => ({ ...d, loading: true }));
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, clubEventIds.join(',')]);

  return data;
}

function buildWeekBuckets(timestamps, numWeeks) {
  const now = Date.now();
  const result = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const start = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const end   = now - i * 7 * 24 * 60 * 60 * 1000;
    const count = timestamps.filter(ts => {
      const t = new Date(ts).getTime();
      return t >= start && t < end;
    }).length;
    result.push({
      label: new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      count,
    });
  }
  return result;
}
