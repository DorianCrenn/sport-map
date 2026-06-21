import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getSportConfig } from '../config/sportMatchConfig.js';

const COLS = 'id, event_id, encounter_type, encounter_order, winner_side, score_detail, home_player1_id, home_player1_data, home_player2_id, home_player2_data, away_player1_id, away_player1_data, away_player2_id, away_player2_data';

export interface Encounter {
  id:                string | null;
  event_id:          string;
  encounter_type:    string;
  encounter_order:   number;
  winner_side:       'home' | 'away' | null;
  score_detail:      Record<string, unknown>;
  home_player1_id?:  string | null;
  home_player1_data: Record<string, unknown>;
  home_player2_id?:  string | null;
  home_player2_data: Record<string, unknown>;
  away_player1_id?:  string | null;
  away_player1_data: Record<string, unknown>;
  away_player2_id?:  string | null;
  away_player2_data: Record<string, unknown>;
}

export function useMatchEncounters(eventId: string | null | undefined, sport = 'tennis') {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading,    setLoading]    = useState(false);
  const config = getSportConfig(sport) as { encounterTypes?: { key: string; order: number }[] };

  function buildEmpty(): Encounter[] {
    return (config.encounterTypes ?? []).map(type => ({
      id: null, event_id: String(eventId), encounter_type: type.key, encounter_order: type.order,
      winner_side: null, score_detail: { sets: [], sets_won: { home: 0, away: 0 } },
      home_player1_id: null, home_player1_data: {}, home_player2_id: null, home_player2_data: {},
      away_player1_id: null, away_player1_data: {}, away_player2_id: null, away_player2_data: {},
    }));
  }

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    supabase.from('match_encounters').select(COLS).eq('event_id', String(eventId)).order('encounter_order')
      .then(({ data }: { data: Encounter[] | null }) => {
        if (cancelled) return;
        setEncounters(data && data.length > 0 ? data : buildEmpty());
        setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const upsertEncounter = useCallback(async (encounter: Partial<Encounter>): Promise<Encounter | null> => {
    const row: Omit<Encounter, 'id'> = {
      event_id: String(eventId), encounter_type: encounter.encounter_type!, encounter_order: encounter.encounter_order ?? 0,
      winner_side: encounter.winner_side ?? null, score_detail: encounter.score_detail ?? {},
      home_player1_id: encounter.home_player1_id ?? null, home_player1_data: encounter.home_player1_data ?? {},
      home_player2_id: encounter.home_player2_id ?? null, home_player2_data: encounter.home_player2_data ?? {},
      away_player1_id: encounter.away_player1_id ?? null, away_player1_data: encounter.away_player1_data ?? {},
      away_player2_id: encounter.away_player2_id ?? null, away_player2_data: encounter.away_player2_data ?? {},
    };
    setEncounters(prev => prev.map(e => e.encounter_type === row.encounter_type ? { ...e, ...row } : e));
    const { data, error } = await supabase.from('match_encounters').upsert(row, { onConflict: 'event_id,encounter_type' }).select(COLS).single() as { data: Encounter | null; error: { message: string } | null };
    if (!error && data) { setEncounters(prev => prev.map(e => e.encounter_type === data.encounter_type ? data : e)); return data; }
    return null;
  }, [eventId]);

  function computeTotalScore(encs = encounters): { home: number; away: number } {
    let home = 0, away = 0;
    for (const e of encs) { if (e.winner_side === 'home') home++; else if (e.winner_side === 'away') away++; }
    return { home, away };
  }

  const isComplete = encounters.length > 0 && encounters.every(e => e.winner_side != null);
  return { encounters, loading, upsertEncounter, computeTotalScore, isComplete };
}
