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
          } catch {}
        } else if (data) {
          const map = Object.fromEntries(data.map(r => [r.team_id, r.sessions]));
          setTrainingsState(map);
          latestRef.current = map;
        }
        loaded.current = true;
      });
    return () => { cancelled = true; };
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
        try { localStorage.setItem(`club-trainings-${clubIdStr}`, JSON.stringify(map)); } catch {}
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
