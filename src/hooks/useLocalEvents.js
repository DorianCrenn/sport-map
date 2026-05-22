import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { sanitizeText } from '../lib/sanitize.js';

// ── DB ↔ App mapping ──────────────────────────────────────────────────────────

function mapFromDB(row) {
  return {
    id:                    row.id,
    title:                 row.title,
    sport:                 row.sport,
    date:                  row.date,
    lat:                   row.lat,
    lng:                   row.lng,
    city:                  row.city                    ?? '',
    venue:                 row.venue                   ?? '',
    description:           row.description             ?? '',
    eventType:             row.event_type              ?? 'friendly',
    teamName:              row.team_name               ?? '',
    category:              row.category                ?? '',
    level:                 row.level                   ?? '',
    cupType:               row.cup_type                ?? '',
    homeOrAway:            row.home_or_away            ?? 'home',
    adversaire:            row.adversaire              ?? '',
    standings:             row.standings               ?? null,
    score:                 row.score                   ?? null,
    clubId:                row.club_id                 ?? null,
    userId:                row.user_id,
    seriesId:              row.series_id               ?? null,
    source:                row.source                  ?? 'user',
    // Tournament-specific fields
    tournamentName:        row.tournament_name         ?? '',
    tournamentType:        row.tournament_type         ?? '',
    numTeams:              row.num_teams               ?? null,
    tournamentFormat:      row.tournament_format       ?? '',
    tournamentCategories:  row.tournament_categories   ?? '',
    prize:                 row.prize                   ?? '',
    organizer:             row.organizer               ?? '',
  };
}

function mapToDB(data, userId) {
  return {
    title:                  sanitizeText(data.title),
    sport:                  data.sport,
    date:                   data.date,
    lat:                    data.lat,
    lng:                    data.lng,
    city:                   sanitizeText(data.city                  ?? ''),
    venue:                  sanitizeText(data.venue                 ?? ''),
    description:            sanitizeText(data.description           ?? ''),
    event_type:             data.eventType                          ?? 'friendly',
    team_name:              sanitizeText(data.teamName              ?? ''),
    category:               data.category                          ?? '',
    level:                  data.level                             ?? '',
    cup_type:               data.cupType                           ?? '',
    home_or_away:           data.homeOrAway                        ?? 'home',
    adversaire:             sanitizeText(data.adversaire            ?? ''),
    standings:              data.standings                         ?? null,
    score:                  data.score                             ?? null,
    club_id:                data.clubId                            ?? null,
    series_id:              data.seriesId                          ?? null,
    user_id:                userId,
    source:                 'user',
    // Tournament-specific fields (null for non-tournament events)
    tournament_name:        data.eventType === 'tournament' ? sanitizeText(data.tournamentName ?? '') || null : null,
    tournament_type:        data.eventType === 'tournament' ? (data.tournamentType || null) : null,
    num_teams:              data.eventType === 'tournament' ? (data.numTeams ? Number(data.numTeams) : null) : null,
    tournament_format:      data.eventType === 'tournament' ? (data.tournamentFormat || null) : null,
    tournament_categories:  data.eventType === 'tournament' ? sanitizeText(data.tournamentCategories ?? '') || null : null,
    prize:                  data.eventType === 'tournament' ? sanitizeText(data.prize ?? '') || null : null,
    organizer:              data.eventType === 'tournament' ? sanitizeText(data.organizer ?? '') || null : null,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLocalEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  // Track temp IDs being inserted so Realtime INSERT doesn't double-add them
  const pendingInserts = useRef(new Set());

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('[Events] fetch failed:', error.message);
        if (data) setEvents(data.map(mapFromDB));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Realtime ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, ({ new: row }) => {
        // Suppress realtime echo for events we are in the middle of inserting optimistically
        if (pendingInserts.current.has(row.id)) return;
        setEvents(prev => {
          if (prev.some(e => e.id === row.id)) return prev;
          return [...prev, mapFromDB(row)].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, ({ new: row }) => {
        setEvents(prev => prev.map(e => e.id === row.id ? mapFromDB(row) : e));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, ({ old: row }) => {
        setEvents(prev => prev.filter(e => e.id !== row.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addEvent = useCallback(async (data) => {
    const userId = currentUser?.id;
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const tempEvent = { ...mapFromDB({ ...mapToDB(data, userId), id: tempId }), id: tempId, _temp: true };

    setEvents(prev => [...prev, tempEvent].sort((a, b) => new Date(a.date) - new Date(b.date)));

    try {
      const { data: saved, error } = await supabase
        .from('events')
        .insert(mapToDB(data, userId))
        .select()
        .single();

      if (error) throw error;

      const real = mapFromDB(saved);
      // STAB-005 : sécurité anti-fuite mémoire sur imports CSV massifs
      if (pendingInserts.current.size > 500) pendingInserts.current.clear();
      // Mark real ID so Realtime INSERT handler skips it
      pendingInserts.current.add(real.id);
      setEvents(prev => prev.map(e => e.id === tempId ? real : e));
      // Give Realtime a short window then clear the guard
      setTimeout(() => pendingInserts.current.delete(real.id), 3000);
      return real;
    } catch (err) {
      console.error('[Events] addEvent failed, rolling back:', err.message);
      setEvents(prev => prev.filter(e => e.id !== tempId));
      throw err;
    }
  }, [currentUser?.id]);

  const updateEvent = useCallback(async (id, data) => {
    setEvents(evs => {
      const prev = evs.find(e => e.id === id);
      return evs.map(e => e.id === id ? { ...e, ...data } : e);
    });

    // Capture prev for rollback inside the functional updater's closure is not possible,
    // so we use a separate read here (snapshot before setState completes is fine for rollback).
    const snapshot = events.find(e => e.id === id);

    try {
      const merged = snapshot ? { ...snapshot, ...data } : data;
      const { error } = await supabase
        .from('events')
        .update(mapToDB(merged, snapshot?.userId ?? currentUser?.id))
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Events] updateEvent failed, rolling back:', err.message);
      if (snapshot) setEvents(evs => evs.map(e => e.id === id ? snapshot : e));
      throw err;
    }
  }, [currentUser?.id, events]);

  const deleteEvent = useCallback(async (id) => {
    const snapshot = events.find(e => e.id === id);
    setEvents(evs => evs.filter(e => e.id !== id));
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Events] deleteEvent failed, rolling back:', err.message);
      if (snapshot) {
        setEvents(evs => [...evs, snapshot].sort((a, b) => new Date(a.date) - new Date(b.date)));
      }
      throw err;
    }
  }, [events]);

  const addEventsBatch = useCallback(async (eventsData) => {
    const userId = currentUser?.id;
    const rows = eventsData.map(data => mapToDB(data, userId));
    const { data: saved, error } = await supabase.from('events').insert(rows).select();
    if (error) throw error;
    const realEvents = (saved ?? []).map(mapFromDB);
    // Guard all real IDs against Realtime echo
    realEvents.forEach(e => {
      pendingInserts.current.add(e.id);
      setTimeout(() => pendingInserts.current.delete(e.id), 3000);
    });
    setEvents(prev => {
      const ids = new Set(realEvents.map(e => e.id));
      return [...prev.filter(e => !ids.has(e.id)), ...realEvents]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    return realEvents;
  }, [currentUser?.id]);

  return { events, loading, addEvent, addEventsBatch, updateEvent, deleteEvent };
}
