import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function mapFromDB(row) {
  return {
    id:          row.id,
    name:        row.name,
    sport:       row.sport,
    city:        row.city        ?? '',
    description: row.description ?? '',
    logoUrl:     row.logo_url    ?? null,
    website:     row.website     ?? '',
    phone:       row.phone       ?? '',
    email:       row.email       ?? '',
    categories:  row.categories  ?? [],
    userId:      row.user_id,
    isUserCreated: true,
  };
}

function mapToDB(data, userId) {
  return {
    name:        data.name,
    sport:       data.sport,
    city:        data.city        ?? '',
    description: data.description ?? '',
    logo_url:    data.logoUrl     ?? null,
    website:     data.website     ?? '',
    phone:       data.phone       ?? '',
    email:       data.email       ?? '',
    categories:  data.categories  ?? [],
    user_id:     userId,
  };
}

export function useClubs() {
  const { currentUser } = useAuth();
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading]    = useState(true);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    supabase
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('[Clubs] fetch failed:', error.message); }
        if (data) setUserClubs(data.map(mapFromDB));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Realtime (fixed channel name — no Math.random leak) ──────────────────
  useEffect(() => {
    const channel = supabase
      .channel('clubs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.some(c => c.id === row.id) ? prev : [mapFromDB(row), ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clubs' }, ({ new: row }) => {
        setUserClubs(prev => prev.map(c => c.id === row.id ? mapFromDB(row) : c));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clubs' }, ({ old: row }) => {
        setUserClubs(prev => prev.filter(c => c.id !== row.id));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addClub = useCallback(async (data) => {
    const userId = currentUser?.id;
    const { data: saved, error } = await supabase
      .from('clubs')
      .insert(mapToDB(data, userId))
      .select()
      .single();

    if (error) {
      console.error('[Clubs] addClub failed:', error.message);
      throw error;
    }
    const club = mapFromDB(saved);
    setUserClubs(prev => (prev.some(c => c.id === club.id) ? prev : [club, ...prev]));
    return club;
  }, [currentUser?.id]);

  const updateClub = useCallback(async (id, patch) => {
    const snapshot = userClubs.find(c => c.id === id);
    setUserClubs(clubs => clubs.map(c => c.id === id ? { ...c, ...patch } : c));
    try {
      const merged = snapshot ? { ...snapshot, ...patch } : patch;
      const { error } = await supabase
        .from('clubs')
        .update(mapToDB(merged, currentUser?.id))
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Clubs] updateClub failed, rolling back:', err.message);
      if (snapshot) setUserClubs(clubs => clubs.map(c => c.id === id ? snapshot : c));
      throw err;
    }
  }, [currentUser?.id, userClubs]);

  const deleteClub = useCallback(async (id) => {
    const snapshot  = userClubs.find(c => c.id === id);
    const snapshotIdx = userClubs.findIndex(c => c.id === id);
    setUserClubs(clubs => clubs.filter(c => c.id !== id));
    try {
      const { error } = await supabase.from('clubs').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[Clubs] deleteClub failed, rolling back:', err.message);
      if (snapshot) {
        setUserClubs(clubs => {
          const next = [...clubs];
          next.splice(snapshotIdx, 0, snapshot); // restore original position
          return next;
        });
      }
      throw err;
    }
  }, [userClubs]);

  return { userClubs, loading, addClub, updateClub, deleteClub };
}
