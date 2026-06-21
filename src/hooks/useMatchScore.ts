import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const COLS = 'id, event_id, sport, score_home, score_away, score_detail, man_of_match, status';

export interface MatchScoreRow {
  id?:          string;
  event_id?:    string;
  sport?:       string;
  score_home:   number | null;
  score_away:   number | null;
  score_detail: Record<string, unknown>;
  man_of_match?: string | null;
  status?:      string;
  updated_at?:  string;
  [key: string]: unknown;
}

interface SaveFields {
  sport?:        string;
  score_home?:   number | null;
  score_away?:   number | null;
  score_detail?: Record<string, unknown>;
  man_of_match?: string | null;
  status?:       string;
}

interface UpdatedScore { score: { home: number | null; away: number | null }; man_of_match: string | null; }

export function useMatchScore(eventId: string | null | undefined) {
  const [matchScore, setMatchScore] = useState<MatchScoreRow | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('match_scores')
      .select(COLS)
      .eq('event_id', String(eventId))
      .maybeSingle()
      .then(({ data, error: err }: { data: MatchScoreRow | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (!err) setMatchScore(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const saveScore = useCallback(async (fields: SaveFields, onUpdated?: (u: UpdatedScore) => void): Promise<boolean> => {
    if (!eventId) return false;
    setSaving(true); setError(null);

    const row: MatchScoreRow = {
      event_id:     String(eventId),
      sport:        fields.sport        ?? 'Football',
      score_home:   fields.score_home   ?? null,
      score_away:   fields.score_away   ?? null,
      score_detail: fields.score_detail ?? {},
      man_of_match: fields.man_of_match ?? null,
      status:       fields.status       ?? 'final',
      updated_at:   new Date().toISOString(),
    };

    setMatchScore(prev => ({ ...(prev ?? {} as MatchScoreRow), ...row }));

    const { data, error: upsertErr } = await supabase
      .from('match_scores')
      .upsert(row, { onConflict: 'event_id' })
      .select(COLS)
      .single() as { data: MatchScoreRow | null; error: { message: string } | null };

    if (upsertErr) { setError(upsertErr.message); setSaving(false); return false; }

    await supabase.from('events').update({
      score: row.score_home !== null && row.score_away !== null ? { home: row.score_home, away: row.score_away } : null,
      man_of_match: row.man_of_match,
    }).eq('id', String(eventId));

    setMatchScore(data ?? row);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    onUpdated?.({ score: { home: row.score_home, away: row.score_away }, man_of_match: row.man_of_match ?? null });
    return true;
  }, [eventId]);

  return { matchScore, loading, saving, saved, error, saveScore };
}
