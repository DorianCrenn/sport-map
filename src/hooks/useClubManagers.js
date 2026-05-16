import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubManagers(clubId) {
  const [managers, setManagers] = useState([]);

  // ── Load from Supabase ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('club_managers')
      .select('email, name, added_at')
      .eq('club_id', String(clubId))
      .order('added_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Managers] fetch failed, using localStorage:', error.message);
          try {
            const raw = localStorage.getItem(`club-managers-${clubId}`);
            if (raw) setManagers(JSON.parse(raw));
          } catch {}
          return;
        }
        if (data && data.length > 0) {
          setManagers(data.map(r => ({ email: r.email, name: r.name, addedAt: r.added_at })));
        } else if (data && data.length === 0) {
          // No Supabase rows yet — migrate localStorage data if any
          try {
            const raw = localStorage.getItem(`club-managers-${clubId}`);
            if (raw) {
              const local = JSON.parse(raw);
              if (local.length > 0) {
                setManagers(local);
                const inserts = local.map(m => ({ club_id: String(clubId), email: m.email, name: m.name }));
                supabase.from('club_managers').insert(inserts)
                  .then(({ error }) => { if (error) console.error('[Managers] migration insert failed:', error.message); });
              }
            }
          } catch {}
        }
      });
    return () => { cancelled = true; };
  }, [clubId]);

  // ── Add (optimistic + Supabase) ───────────────────────────────────────────

  const addManager = useCallback(async (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    if (managers.some(m => m.email === normalized)) return false;

    const name = normalized
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    const newEntry = { email: normalized, name, addedAt: new Date().toISOString() };

    setManagers(prev => [...prev, newEntry]);

    const { error } = await supabase
      .from('club_managers')
      .insert({ club_id: String(clubId), email: normalized, name });

    if (error) {
      console.error('[Managers] add failed:', error.message);
      setManagers(prev => prev.filter(m => m.email !== normalized));
      return false;
    }
    return true;
  }, [managers, clubId]);

  // ── Remove (optimistic + Supabase) ───────────────────────────────────────

  const removeManager = useCallback(async (email) => {
    const prev = managers.find(m => m.email === email);
    setManagers(p => p.filter(m => m.email !== email));

    const { error } = await supabase
      .from('club_managers')
      .delete()
      .eq('club_id', String(clubId))
      .eq('email', email);

    if (error) {
      console.error('[Managers] remove failed:', error.message);
      if (prev) setManagers(p => [...p, prev].sort((a, b) => a.addedAt.localeCompare(b.addedAt)));
    }
  }, [managers, clubId]);

  const isManager = useCallback((userEmail) => {
    if (!userEmail) return false;
    return managers.some(m => m.email === userEmail.toLowerCase());
  }, [managers]);

  return { managers, addManager, removeManager, isManager };
}
