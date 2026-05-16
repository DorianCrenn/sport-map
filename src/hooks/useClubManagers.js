import { useState, useCallback } from 'react';

function key(clubId) {
  return `club-managers-${clubId}`;
}

export function useClubManagers(clubId) {
  const [managers, setManagers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key(clubId)) ?? '[]');
    } catch { return []; }
  });

  function save(next) {
    setManagers(next);
    localStorage.setItem(key(clubId), JSON.stringify(next));
  }

  const addManager = useCallback((email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    if (managers.some(m => m.email === normalized)) return false;
    save([...managers, {
      email: normalized,
      name: normalized.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      addedAt: new Date().toISOString(),
    }]);
    return true;
  }, [managers]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeManager = useCallback((email) => {
    save(managers.filter(m => m.email !== email));
  }, [managers]); // eslint-disable-line react-hooks/exhaustive-deps

  const isManager = useCallback((userEmail) => {
    if (!userEmail) return false;
    return managers.some(m => m.email === userEmail.toLowerCase());
  }, [managers]);

  return { managers, addManager, removeManager, isManager };
}
