import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const COLS = 'id, event_id, sport, score_home, score_away, score_detail, man_of_match, status';

/**
 * Hook de gestion du score d'un événement.
 * Lit depuis match_scores, écrit dans match_scores + events.score (compat).
 */
export function useMatchScore(eventId) {
  const [matchScore, setMatchScore] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('match_scores')
      .select(COLS)
      .eq('event_id', String(eventId))
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (!err) setMatchScore(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  /**
   * Sauvegarde le score.
   * @param {Object} fields — { score_home, score_away, score_detail, man_of_match, sport }
   * @param {Function} [onUpdated] — callback appelé après succès (ex: pour màj l'état parent)
   */
  const saveScore = useCallback(async (fields, onUpdated) => {
    if (!eventId) return false;
    setSaving(true);
    setError(null);

    const row = {
      event_id:     String(eventId),
      sport:        fields.sport        ?? 'Football',
      score_home:   fields.score_home   ?? null,
      score_away:   fields.score_away   ?? null,
      score_detail: fields.score_detail ?? {},
      man_of_match: fields.man_of_match ?? null,
      status:       fields.status       ?? 'final',
      updated_at:   new Date().toISOString(),
    };

    // Optimistic local update
    setMatchScore(prev => ({ ...prev, ...row }));

    const { data, error: upsertErr } = await supabase
      .from('match_scores')
      .upsert(row, { onConflict: 'event_id' })
      .select(COLS)
      .single();

    if (upsertErr) {
      setError(upsertErr.message);
      setSaving(false);
      return false;
    }

    // Fallback compat : mise à jour directe events.score si le trigger n'est pas actif
    await supabase
      .from('events')
      .update({
        score: row.score_home !== null && row.score_away !== null
          ? { home: row.score_home, away: row.score_away }
          : null,
        man_of_match: row.man_of_match,
      })
      .eq('id', String(eventId));

    setMatchScore(data ?? row);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    // Notifier le parent (pour mise à jour optimiste dans l'état global)
    onUpdated?.({
      score: { home: row.score_home, away: row.score_away },
      man_of_match: row.man_of_match,
    });

    return true;
  }, [eventId]);

  return { matchScore, loading, saving, saved, error, saveScore };
}
