import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapFromDB(row) {
  return {
    id: row.id,
    title: row.title,
    sport: row.sport,
    date: row.date,
    lat: row.lat,
    lng: row.lng,
    city: row.city ?? '',
    description: row.description ?? '',
    eventType: row.event_type ?? 'friendly',
    teamName: row.team_name ?? '',
    category: row.category ?? '',
    clubId: row.club_id ?? null,
    userId: row.user_id,
    score: row.score ?? null,
    source: 'user',
  };
}

function mapToDB(data, userId) {
  return {
    title: data.title,
    sport: data.sport,
    date: data.date,
    lat: data.lat,
    lng: data.lng,
    city: data.city ?? '',
    description: data.description ?? '',
    event_type: data.eventType ?? 'friendly',
    team_name: data.teamName ?? '',
    category: data.category ?? '',
    club_id: data.clubId ?? null,
    score: data.score ?? null,
    user_id: userId,
    source: 'user',
  };
}

export function useLocalEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    supabase.from('events').select('*').order('date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('[Events] fetch failed:', error.message); return; }
        if (data) setEvents(data.map(mapFromDB));
      });
    return () => { cancelled = true; };
  }, []);

  const addEvent = useCallback(async (data) => {
    const userId = currentUser?.id;
    const tempId = `temp_${Date.now()}`;
    const tempEvent = { ...mapFromDB({ ...mapToDB(data, userId), id: tempId }), id: tempId };
    setEvents(prev => [...prev, tempEvent]);

    try {
      const { data: saved, error } = await supabase
        .from('events').insert(mapToDB(data, userId)).select().single();
      if (error) throw error;
      const real = mapFromDB(saved);
      setEvents(prev => prev.map(e => e.id === tempId ? real : e));
      return real;
    } catch (err) {
      console.error('[Events] addEvent failed, rolling back:', err.message);
      setEvents(prev => prev.filter(e => e.id !== tempId));
      throw err;
    }
  }, [currentUser?.id]);

  const updateEvent = useCallback(async (id, data) => {
    const prev = events.find(e => e.id === id);
    setEvents(evs => evs.map(e => e.id === id ? { ...e, ...data } : e));
    try {
      const { error } = await supabase
        .from('events').update(mapToDB({ ...prev, ...data }, currentUser?.id)).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Events] updateEvent failed, rolling back:', err.message);
      if (prev) setEvents(evs => evs.map(e => e.id === id ? prev : e));
      throw err;
    }
  }, [currentUser?.id, events]);

  const deleteEvent = useCallback(async (id) => {
    const prev = events.find(e => e.id === id);
    setEvents(evs => evs.filter(e => e.id !== id));
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Events] deleteEvent failed, rolling back:', err.message);
      if (prev) setEvents(evs => [...evs, prev].sort((a, b) => new Date(a.date) - new Date(b.date)));
      throw err;
    }
  }, [events]);

  return { events, addEvent, updateEvent, deleteEvent };
}
