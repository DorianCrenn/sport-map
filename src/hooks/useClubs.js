import { useState, useEffect } from 'react';

const STORAGE_KEY = 'user-clubs';

export function useClubs() {
  const [userClubs, setUserClubs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userClubs));
  }, [userClubs]);

  const addClub = (data) => {
    const club = { ...data, id: `user_${Date.now()}`, isUserCreated: true };
    setUserClubs(prev => [club, ...prev]);
    return club;
  };

  const updateClub = (id, patch) =>
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

  const deleteClub = (id) =>
    setUserClubs(prev => prev.filter(c => c.id !== id));

  return { userClubs, addClub, updateClub, deleteClub };
}
