import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapFromDB(row) {
  return {
    id: row.id,
    name: row.name,
    sport: row.sport,
    city: row.city ?? '',
    description: row.description ?? '',
    logoUrl: row.logo_url ?? null,
    website: row.website ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    userId: row.user_id,
    isUserCreated: true,
  };
}

function mapToDB(data, userId) {
  return {
    name: data.name,
    sport: data.sport,
    city: data.city ?? '',
    description: data.description ?? '',
    logo_url: data.logoUrl ?? null,
    website: data.website ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    user_id: userId,
  };
}

export function useClubs() {
  const { currentUser } = useAuth();
  const [userClubs, setUserClubs] = useState([]);

  useEffect(() => {
    supabase.from('clubs').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setUserClubs(data.map(mapFromDB));
      });
  }, []);

  const addClub = useCallback(async (data) => {
    const userId = currentUser?.id;
    const { data: saved, error } = await supabase
      .from('clubs')
      .insert(mapToDB(data, userId))
      .select()
      .single();
    if (!error && saved) {
      const club = mapFromDB(saved);
      setUserClubs(prev => [club, ...prev]);
      return club;
    }
    const fallback = { ...data, id: `local_${Date.now()}`, isUserCreated: true };
    setUserClubs(prev => [fallback, ...prev]);
    return fallback;
  }, [currentUser?.id]);

  const updateClub = useCallback(async (id, patch) => {
    setUserClubs(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    await supabase.from('clubs').update(mapToDB(patch, currentUser?.id)).eq('id', id);
  }, [currentUser?.id]);

  const deleteClub = useCallback(async (id) => {
    setUserClubs(prev => prev.filter(c => c.id !== id));
    await supabase.from('clubs').delete().eq('id', id);
  }, []);

  return { userClubs, addClub, updateClub, deleteClub };
}
