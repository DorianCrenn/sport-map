import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase, isDemoMode } from '../../lib/supabase.js';
import { useToast } from '../../contexts/ToastContext.jsx';

interface LiveScorePupitreProps {
  event: Record<string, any>;
  matchScore?: { score_home?: number; score_away?: number } | null;
  onFinished?: (score: { home: number; away: number }) => void;
}

export default function LiveScorePupitre({ event, matchScore, onFinished }: LiveScorePupitreProps) {
  const [scoreHome, setScoreHome] = useState(matchScore?.score_home ?? 0);
  const [scoreAway, setScoreAway] = useState(matchScore?.score_away ?? 0);
  const [ending,    setEnding]    = useState(false);
  const { toast } = useToast();

  const homeTeam = event?.team_name  || 'Domicile';
  const awayTeam = event?.adversaire || 'Visiteur';

  const update = useCallback(async (newHome: number, newAway: number, prevHome: number, prevAway: number) => {
    if (isDemoMode()) return;
    const { error } = await supabase
      .from('match_scores')
      .update({ score_home: newHome, score_away: newAway })
      .eq('event_id', event.id);
    if (error) {
      setScoreHome(prevHome);
      setScoreAway(prevAway);
      toast({ message: 'Erreur de synchronisation du score' });
    }
  }, [event?.id, toast]);

  function incrementHome() { const prev = scoreHome; const next = prev + 1; setScoreHome(next); update(next, scoreAway, prev, scoreAway); }
  function decrementHome() { if (scoreHome === 0) return; const prev = scoreHome; const next = prev - 1; setScoreHome(next); update(next, scoreAway, prev, scoreAway); }
  function incrementAway() { const prev = scoreAway; const next = prev + 1; setScoreAway(next); update(scoreHome, next, scoreHome, prev); }
  function decrementAway() { if (scoreAway === 0) return; const prev = scoreAway; const next = prev - 1; setScoreAway(next); update(scoreHome, next, scoreHome, prev); }

  async function handleFinish() {
    setEnding(true);
    try {
      if (!isDemoMode()) {
        const { error } = await supabase
          .from('match_scores')
          .update({ status: 'final', score_home: scoreHome, score_away: scoreAway })
          .eq('event_id', event.id);
        if (error) throw error;
      }
      onFinished?.({ home: scoreHome, away: scoreAway });
    } catch {
      toast({ message: 'Impossible de clôturer le match' });
      setEnding(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="rounded-xl border border-red-500/30 bg-red-500/5 p-4"
      data-demo="live-score-pupitre"
    >
      <div className="flex justify-between mb-3">
        <span className="text-[11px] font-bold text-[var(--sl-t1)] truncate max-w-[45%]">{homeTeam}</span>
        <span className="text-[11px] font-bold text-[var(--sl-t1)] truncate max-w-[45%] text-right">{awayTeam}</span>
      </div>

      <div className="grid grid-cols-[1fr_2rem_1fr] items-center gap-3 mb-4">
        <div className="flex flex-col items-center gap-1.5">
          <button onClick={incrementHome} className="w-full py-2.5 rounded-xl bg-[var(--sl-green)] text-black text-[15px] font-black active:scale-95 transition-transform">+1</button>
          <span className="text-[32px] font-black text-[var(--sl-t1)] tabular-nums">{scoreHome}</span>
          <button onClick={decrementHome} disabled={scoreHome === 0} aria-label="Enlever 1 but domicile" className="w-full py-2 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)] text-[17px] font-black border border-[var(--sl-border)] active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed">−</button>
        </div>

        <span className="text-[18px] font-bold text-[var(--sl-t3)] text-center">–</span>

        <div className="flex flex-col items-center gap-1.5">
          <button onClick={incrementAway} className="w-full py-2.5 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t1)] text-[15px] font-black border border-[var(--sl-border)] active:scale-95 transition-transform">+1</button>
          <span className="text-[32px] font-black text-[var(--sl-t1)] tabular-nums">{scoreAway}</span>
          <button onClick={decrementAway} disabled={scoreAway === 0} aria-label="Enlever 1 but visiteur" className="w-full py-2 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)] text-[17px] font-black border border-[var(--sl-border)] active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed">−</button>
        </div>
      </div>

      <button onClick={handleFinish} disabled={ending} className="w-full py-2.5 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)] text-[13px] font-bold border border-[var(--sl-border)] active:scale-95 transition-transform disabled:opacity-50">
        {ending ? 'Fermeture du match…' : 'Terminer le match'}
      </button>
    </motion.div>
  );
}
