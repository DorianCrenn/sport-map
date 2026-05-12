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
    user_id: userId,
    source: 'user',
  };
}

export function useLocalEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    supabase.from('events').select('*').order('date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setEvents(data.map(mapFromDB));
      });
  }, []);

  const addEvent = useCallback(async (data) => {
    const userId = currentUser?.id;
    const tempId = `temp_${Date.now()}`;
    const tempEvent = { ...mapFromDB({ ...mapToDB(data, userId), id: tempId }), id: tempId };
    setEvents(prev => [...prev, tempEvent]);

    try {
      const { data: saved, error } = await supabase
        .from('events')
        .insert(mapToDB(data, userId))
        .select()
        .single();
      if (!error && saved) {
        const real = mapFromDB(saved);
        setEvents(prev => prev.map(e => e.id === tempId ? real : e));
        return real;
      }
    } catch {}
    return tempEvent;
  }, [currentUser?.id]);

  const updateEvent = useCallback(async (id, data) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    await supabase.from('events').update(mapToDB(data, currentUser?.id)).eq('id', id);
  }, [currentUser?.id]);

  const deleteEvent = useCallback(async (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from('events').delete().eq('id', id);
  }, []);

  return { events, addEvent, updateEvent, deleteEvent };
}
