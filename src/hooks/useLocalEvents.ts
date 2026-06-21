import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { sanitizeText } from '../lib/sanitize.js';
import { dispatchError } from '../lib/errorBus.js';
import type { EventType, EventSource, EventScore } from '../types/sportlink.js';
import type { SportLinkEvent } from '../types/sportlink.js';

async function pushClubFollowers(
  clubId: string,
  title: string,
  body: string,
  url: string,
  tag: string,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const base = import.meta.env.VITE_SUPABASE_URL ?? '';
    await fetch(`${base}/functions/v1/notify-club-followers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ club_id: String(clubId), title, body, url, tag }),
    });
  } catch { /* best-effort */ }
}

type DBRow = Record<string, unknown>;

function mapFromDB(row: DBRow): SportLinkEvent {
  return {
    id:                    String(row.id),
    title:                 (row.title as string) ?? '',
    sport:                 (row.sport as string) ?? '',
    date:                  (row.date as string) ?? '',
    lat:                   row.lat as number | undefined,
    lng:                   row.lng as number | undefined,
    city:                  (row.city as string)                 ?? '',
    venue:                 (row.venue as string)                ?? '',
    description:           (row.description as string)          ?? '',
    eventType:             (row.event_type as EventType)        ?? 'friendly',
    teamName:              (row.team_name as string)            ?? '',
    category:              (row.category as string)             ?? '',
    level:                 (row.level as string)                ?? '',
    cupType:               (row.cup_type as string)             ?? '',
    homeOrAway:            (row.home_or_away as 'home' | 'away') ?? 'home',
    adversaire:            (row.adversaire as string)           ?? '',
    standings:             row.standings                        ?? null,
    score:                 (row.score as EventScore | null)     ?? null,
    manOfMatch:            (row.man_of_match as string)         ?? '',
    clubId:                (row.club_id as string | null)       ?? null,
    userId:                row.user_id as string,
    seriesId:              (row.series_id as string | null)     ?? null,
    source:                (row.source as EventSource)          ?? 'user',
    updatedAt:             (row.updated_at as string | null)    ?? null,
    tournamentName:        (row.tournament_name as string)      ?? '',
    tournamentType:        (row.tournament_type as string)      ?? '',
    numTeams:              (row.num_teams as number | null)     ?? null,
    tournamentFormat:      (row.tournament_format as string)    ?? '',
    tournamentCategories:  (row.tournament_categories as string) ?? '',
    prize:                 (row.prize as string)                ?? '',
    organizer:             (row.organizer as string)            ?? '',
  };
}

function mapToDB(data: Partial<SportLinkEvent>, userId: string | null | undefined): Record<string, unknown> {
  return {
    title:                  sanitizeText(data.title),
    sport:                  data.sport,
    date:                   data.date,
    lat:                    data.lat,
    lng:                    data.lng,
    city:                   sanitizeText(data.city                ?? ''),
    venue:                  sanitizeText(data.venue               ?? ''),
    description:            sanitizeText(data.description         ?? ''),
    event_type:             data.eventType                        ?? 'friendly',
    team_name:              sanitizeText(data.teamName            ?? ''),
    category:               data.category                        ?? '',
    level:                  data.level                           ?? '',
    cup_type:               data.cupType                         ?? '',
    home_or_away:           data.homeOrAway                      ?? 'home',
    adversaire:             sanitizeText(data.adversaire          ?? ''),
    standings:              data.standings                       ?? null,
    score:                  data.score                           ?? null,
    man_of_match:           sanitizeText(data.manOfMatch         ?? '') || null,
    club_id:                data.clubId                          ?? null,
    series_id:              data.seriesId                        ?? null,
    user_id:                userId,
    source:                 'user',
    tournament_name:        data.eventType === 'tournament' ? sanitizeText(data.tournamentName ?? '') || null : null,
    tournament_type:        data.eventType === 'tournament' ? (data.tournamentType || null) : null,
    num_teams:              data.eventType === 'tournament' ? (data.numTeams ? Number(data.numTeams) : null) : null,
    tournament_format:      data.eventType === 'tournament' ? (data.tournamentFormat || null) : null,
    tournament_categories:  data.eventType === 'tournament' ? sanitizeText(data.tournamentCategories ?? '') || null : null,
    prize:                  data.eventType === 'tournament' ? sanitizeText(data.prize ?? '') || null : null,
    organizer:              data.eventType === 'tournament' ? sanitizeText(data.organizer ?? '') || null : null,
  };
}

interface UseLocalEventsResult {
  events: SportLinkEvent[];
  loading: boolean;
  addEvent: (data: Partial<SportLinkEvent>) => Promise<SportLinkEvent>;
  addEventsBatch: (eventsData: Partial<SportLinkEvent>[]) => Promise<SportLinkEvent[]>;
  updateEvent: (id: string, data: Partial<SportLinkEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  archiveSeason: (clubId: string) => Promise<void>;
}

export function useLocalEvents(): UseLocalEventsResult {
  const { currentUser } = useAuth();
  const [events, setEvents]   = useState<SportLinkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const eventsRef             = useRef<SportLinkEvent[]>([]);
  useEffect(() => { eventsRef.current = events; }, [events]);

  const pendingInserts = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_archived', false)
          .order('date', { ascending: true })
          .limit(500) as { data: DBRow[] | null; error: { message: string } | null };
        if (error) {
          console.warn('[Events] fetch (1/2) failed:', error.message);
          ({ data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true })
            .limit(500) as { data: DBRow[] | null; error: { message: string } | null });
        }
        if (cancelled) return;
        if (error) { console.error('[Events] fetch failed:', error.message); dispatchError('Impossible de charger les événements.'); }
        if (data) setEvents(data.map(mapFromDB));
      } catch (err) {
        if (cancelled) return;
        console.error('[Events] load() threw:', (err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    function onOnline() { if (!cancelled) load(); }
    window.addEventListener('online', onOnline);
    return () => { cancelled = true; window.removeEventListener('online', onOnline); };
  }, []);

  useEffect(() => {
    const key = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`events-rt-${key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, ({ new: row }) => {
        if (pendingInserts.current.has(String((row as DBRow).id))) return;
        setEvents(prev => {
          if (prev.some(e => e.id === String((row as DBRow).id))) return prev;
          return [...prev, mapFromDB(row as DBRow)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, ({ new: row }) => {
        setEvents(prev => prev.map(e => e.id === String((row as DBRow).id) ? mapFromDB(row as DBRow) : e));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, ({ old: row }) => {
        setEvents(prev => prev.filter(e => e.id !== String((row as DBRow).id)));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addEvent = useCallback(async (data: Partial<SportLinkEvent>): Promise<SportLinkEvent> => {
    const userId = currentUser?.id;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const tempEvent = { ...mapFromDB({ ...mapToDB(data, userId), id: tempId }), id: tempId, _temp: true } as SportLinkEvent;

    setEvents(prev => [...prev, tempEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    try {
      const { data: saved, error } = await supabase
        .from('events')
        .insert(mapToDB(data, userId))
        .select()
        .single() as { data: DBRow | null; error: { message: string } | null };

      if (error) throw new Error(error.message);

      const real = mapFromDB(saved!);
      if (pendingInserts.current.size > 500) pendingInserts.current.clear();
      pendingInserts.current.add(real.id);
      setEvents(prev => prev.map(e => e.id === tempId ? real : e));
      setTimeout(() => pendingInserts.current.delete(real.id), 3000);
      return real;
    } catch (err) {
      console.error('[Events] addEvent failed, rolling back:', (err as Error).message);
      setEvents(prev => prev.filter(e => e.id !== tempId));
      throw err;
    }
  }, [currentUser?.id]);

  const updateEvent = useCallback(async (id: string, data: Partial<SportLinkEvent>) => {
    setEvents(evs => evs.map(e => e.id === id ? { ...e, ...data } : e));
    const snapshot = eventsRef.current.find(e => e.id === id);
    const scoreBeingPublished =
      data.score != null &&
      snapshot?.score == null &&
      snapshot?.clubId;
    try {
      const merged = snapshot ? { ...snapshot, ...data } : data;
      const { error } = await supabase
        .from('events')
        .update(mapToDB(merged, snapshot?.userId ?? currentUser?.id))
        .eq('id', id) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
      if (scoreBeingPublished && snapshot?.clubId) {
        const score = data.score as { home?: number; away?: number };
        const home = score.home ?? '?';
        const away = score.away ?? '?';
        const teams = (snapshot as { homeTeam?: string; awayTeam?: string }).homeTeam && (snapshot as { homeTeam?: string; awayTeam?: string }).awayTeam
          ? `${(snapshot as { homeTeam?: string }).homeTeam} ${home}–${away} ${(snapshot as { awayTeam?: string }).awayTeam}`
          : `Score : ${home}–${away}`;
        pushClubFollowers(snapshot.clubId, 'Résultat publié', teams, '/', `score-${id}`);
      }
    } catch (err) {
      console.error('[Events] updateEvent failed, rolling back:', (err as Error).message);
      if (snapshot) setEvents(evs => evs.map(e => e.id === id ? snapshot : e));
      throw err;
    }
  }, [currentUser?.id]);

  const deleteEvent = useCallback(async (id: string) => {
    const snapshot = eventsRef.current.find(e => e.id === id);
    setEvents(evs => evs.filter(e => e.id !== id));
    try {
      const { error } = await supabase.from('events').delete().eq('id', id) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error('[Events] deleteEvent failed, rolling back:', (err as Error).message);
      if (snapshot) {
        setEvents(evs => [...evs, snapshot].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
      throw err;
    }
  }, []);

  const addEventsBatch = useCallback(async (eventsData: Partial<SportLinkEvent>[]): Promise<SportLinkEvent[]> => {
    const userId = currentUser?.id;
    const rows = eventsData.map(data => mapToDB(data, userId));
    const { data: saved, error } = await supabase.from('events').insert(rows).select() as { data: DBRow[] | null; error: { message: string } | null };
    if (error) throw new Error(error.message);
    const realEvents = (saved ?? []).map(mapFromDB);
    realEvents.forEach(e => {
      pendingInserts.current.add(e.id);
      setTimeout(() => pendingInserts.current.delete(e.id), 3000);
    });
    setEvents(prev => {
      const ids = new Set(realEvents.map(e => e.id));
      return [...prev.filter(e => !ids.has(e.id)), ...realEvents]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    return realEvents;
  }, [currentUser?.id]);

  const archiveSeason = useCallback(async (clubId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('events')
      .update({ is_archived: true })
      .eq('club_id', String(clubId))
      .lt('date', today)
      .eq('is_archived', false) as { error: { message: string } | null };
    if (error) throw new Error(error.message);
    setEvents(evs => evs.filter(e => !(String(e.clubId) === String(clubId) && e.date < today)));
  }, []);

  return { events, loading, addEvent, addEventsBatch, updateEvent, deleteEvent, archiveSeason };
}
