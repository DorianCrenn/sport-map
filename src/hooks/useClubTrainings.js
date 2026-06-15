import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export function useClubTrainings(clubId) {
  const [trainings, setTrainingsState] = useState({});
  const loaded     = useRef(false);
  const saveTimer  = useRef(null);
  const latestRef  = useRef({});
  const clubIdStr  = String(clubId);

  // ── Load from Supabase ────────────────────────────────────────────────────

  useEffect(() => {
    // STAB-002 : annuler tout save en attente avant le fetch du nouveau club
    loaded.current = false;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    let cancelled = false;
    supabase
      .from('club_trainings')
      .select('team_id, sessions')
      .eq('club_id', clubIdStr)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[Trainings] fetch failed, using localStorage:', error.message);
          try {
            const raw = localStorage.getItem(`club-trainings-${clubIdStr}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              setTrainingsState(parsed);
              latestRef.current = parsed;
            }
          } catch { /* ignore */ }
        } else if (data && data.length > 0) {
          const map = Object.fromEntries(data.map(r => [r.team_id, r.sessions]));
          setTrainingsState(map);
          latestRef.current = map;
        } else if (data && data.length === 0) {
          // No Supabase rows yet — migrate localStorage data if any
          try {
            const raw = localStorage.getItem(`club-trainings-${clubIdStr}`);
            if (raw) {
              const map = JSON.parse(raw);
              if (Object.keys(map).length > 0) {
                setTrainingsState(map);
                latestRef.current = map;
                const upserts = Object.entries(map).map(([teamId, sessions]) => ({
                  club_id: clubIdStr, team_id: teamId, sessions,
                }));
                supabase.from('club_trainings').upsert(upserts, { onConflict: 'club_id,team_id' })
                  .then(({ error }) => { if (error) console.error('[Trainings] migration upsert failed:', error.message); });
              }
            }
          } catch { /* ignore */ }
        }
        loaded.current = true;
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [clubIdStr]);

  // ── Debounced save ────────────────────────────────────────────────────────

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const map = latestRef.current;
      const upserts = Object.entries(map).map(([teamId, sessions]) => ({
        club_id: clubIdStr,
        team_id: teamId,
        sessions,
        updated_at: new Date().toISOString(),
      }));
      if (upserts.length === 0) return;
      const { error } = await supabase
        .from('club_trainings')
        .upsert(upserts, { onConflict: 'club_id,team_id' });
      if (error) {
        console.error('[Trainings] save failed:', error.message);
        try { localStorage.setItem(`club-trainings-${clubIdStr}`, JSON.stringify(map)); } catch { /* ignore */ }
      }
    }, 1200);
  }, [clubIdStr]);

  // ── Setter (drop-in replacement for useState setter) ─────────────────────

  const setTrainings = useCallback((updater) => {
    setTrainingsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      latestRef.current = next;
      if (loaded.current) scheduleSave();
      return next;
    });
  }, [scheduleSave]);

  return [trainings, setTrainings];
}
