import { useState, useCallback } from 'react';

const KEY = 'sl_attending';

function load() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); }
  catch { return new Set(); }
}

export function useAttendees() {
  const [attending, setAttending] = useState(load);

  const toggle = useCallback((id) => {
    setAttending(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isAttending = useCallback((id) => attending.has(id), [attending]);

  return { attending, toggle, isAttending };
}
