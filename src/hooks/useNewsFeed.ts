import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import type { ClubFollow } from '../types/sportlink.js';

interface Announcement {
  id: string;
  club_id: string;
  club_name?: string;
  type?: string;
  title: string;
  message?: string;
  created_at: string;
  author_name?: string;
}

interface EventRow {
  id: string | number;
  title?: string;
  sport?: string;
  date: string;
  score?: unknown;
  club_id?: string;
  venue?: string;
  city?: string;
  event_type?: string;
  level?: string;
  home_or_away?: string;
  team_name?: string;
  [key: string]: unknown;
}

interface RideRow {
  id: string;
  event_id: string;
  driver_name?: string;
  departure_location?: string;
  departure_time?: string;
  available_seats?: number;
  status?: string;
  created_at?: string;
  ride_requests?: { status: string }[];
  [key: string]: unknown;
}

function isEventVisible(
  event: EventRow,
  follows: ClubFollow[],
  managedClubIds: string[],
): boolean {
  const cid = String(event.club_id);
  if (managedClubIds.includes(cid)) return true;
  const follow = follows.find(f => String(f.clubId) === cid);
  if (!follow || follow.teams === 'all') return true;
  return Array.isArray(follow.teams) && follow.teams.includes(event.team_name ?? '');
}

interface UseNewsFeedOptions {
  followedClubIds?: string[];
  follows?: ClubFollow[];
  managedClubIds?: string[];
}

interface UseNewsFeedResult {
  announcements: Announcement[];
  results: EventRow[];
  upcoming: EventRow[];
  rides: RideRow[];
  loading: boolean;
  hasClubs: boolean;
}

export function useNewsFeed({
  followedClubIds = [],
  follows = [],
  managedClubIds = [],
}: UseNewsFeedOptions = {}): UseNewsFeedResult {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [results,       setResults]       = useState<EventRow[]>([]);
  const [upcoming,      setUpcoming]      = useState<EventRow[]>([]);
  const [rides,         setRides]         = useState<RideRow[]>([]);
  const [loading,       setLoading]       = useState(false);

  const hasClubs = followedClubIds.length > 0;

  useEffect(() => {
    if (!hasClubs) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const clubIds = followedClubIds.map(String);
      const now = new Date().toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Paralléliser les 3 premières requêtes indépendantes
      const [{ data: ann }, { data: res }, { data: ups }] = await Promise.all([
        supabase
          .from('club_announcements')
          .select('id, club_id, club_name, type, title, message, created_at, author_name')
          .in('club_id', clubIds)
          .order('created_at', { ascending: false })
          .limit(20) as Promise<{ data: Announcement[] | null }>,

        supabase
          .from('events')
          .select('id, title, sport, date, score, club_id, venue, city, event_type, level, team_name')
          .in('club_id', clubIds)
          .not('score', 'is', null)
          .lt('date', now)
          .order('date', { ascending: false })
          .limit(10) as Promise<{ data: EventRow[] | null }>,

        supabase
          .from('events')
          .select('id, title, sport, date, club_id, venue, city, event_type, level, home_or_away, team_name')
          .in('club_id', clubIds)
          .gte('date', sevenDaysAgo)
          .order('date', { ascending: true })
          .limit(10) as Promise<{ data: EventRow[] | null }>,
      ]);

      let ridesData: RideRow[] = [];
      const upcomingIds = (ups ?? []).map(e => String(e.id));
      if (upcomingIds.length > 0) {
        const { data: rds } = await supabase
          .from('rides')
          .select(`id, event_id, driver_name, departure_location, departure_time, available_seats, status, created_at, ride_requests ( status )`)
          .in('event_id', upcomingIds)
          .in('status', ['active', 'full'])
          .order('departure_time', { ascending: true })
          .limit(15) as { data: RideRow[] | null };
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
    const key = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`news-feed-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_announcements' }, (payload) => {
        const row = payload.new as Announcement;
        if (!clubIdSet.has(String(row.club_id))) return;
        setAnnouncements(prev => [row, ...prev].slice(0, 20));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
        const row = payload.new as EventRow;
        if (!clubIdSet.has(String(row.club_id))) return;
        if (row.score != null && new Date(String(row.date)) < new Date()) {
          setResults(prev => { const without = prev.filter(e => e.id !== row.id); return [row, ...without].slice(0, 10); });
        }
        if (new Date(String(row.date)) >= new Date()) {
          setUpcoming(prev => prev.map(e => e.id === row.id ? { ...e, ...row } : e));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
        const row = payload.new as EventRow;
        if (!clubIdSet.has(String(row.club_id))) return;
        if (!isEventVisible(row, follows, managedClubIds)) return;
        if (new Date(String(row.date)) >= new Date()) {
          setUpcoming(prev => [row, ...prev].sort((a, b) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime()).slice(0, 10));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides' }, (payload) => {
        const row = payload.new as RideRow;
        setUpcoming(prev => {
          const eventIds = new Set(prev.map(e => String(e.id)));
          if (!eventIds.has(String(row.event_id))) return prev;
          setRides(current => [...current, { ...row, ride_requests: [] }].slice(0, 15));
          return prev;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, (payload) => {
        const row = payload.new as RideRow;
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
