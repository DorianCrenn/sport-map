import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sport-map-user-events';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useLocalEvents() {
  const [events, setEvents] = useState(load);

  const addEvent = useCallback((data) => {
    const newEvent = { ...data, id: Date.now(), source: 'user' };
    setEvents((prev) => {
      const updated = [...prev, newEvent];
      save(updated);
      return updated;
    });
    return newEvent;
  }, []);

  const updateEvent = useCallback((id, data) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, ...data } : e));
      save(updated);
      return updated;
    });
  }, []);

  const deleteEvent = useCallback((id) => {
    setEvents((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      save(updated);
      return updated;
    });
  }, []);

  return { events, addEvent, updateEvent, deleteEvent };
}
