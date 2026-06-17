import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function LiveScorePupitre({ event, matchScore, onFinished }) {
  const [scoreHome, setScoreHome] = useState(matchScore?.score_home ?? 0);
  const [scoreAway, setScoreAway] = useState(matchScore?.score_away ?? 0);
  const [ending,    setEnding]    = useState(false);
  const { toast } = useToast();

  const homeTeam = event?.team_name  || 'Domicile';
  const awayTeam = event?.adversaire || 'Visiteur';

  const update = useCallback(async (newHome, newAway, prevHome, prevAway) => {
    const { error } = await supabase
      .from('match_scores')
      .update({ score_home: newHome, score_away: newAway })
      .eq('event_id', event.id);
    if (error) {
      // Rollback optimiste
      setScoreHome(prevHome);
      setScoreAway(prevAway);
      toast({ message: 'Erreur de synchronisation du score' });
    }
  }, [event?.id, toast]);

  function incrementHome() {
    const prev = scoreHome;
    const next = prev + 1;
    setScoreHome(next);
    update(next, scoreAway, prev, scoreAway);
  }

  function decrementHome() {
    if (scoreHome === 0) return;
    const prev = scoreHome;
    const next = prev - 1;
    setScoreHome(next);
    update(next, scoreAway, prev, scoreAway);
  }

  function incrementAway() {
    const prev = scoreAway;
    const next = prev + 1;
    setScoreAway(next);
    update(scoreHome, next, scoreHome, prev);
  }

  function decrementAway() {
    if (scoreAway === 0) return;
    const prev = scoreAway;
    const next = prev - 1;
    setScoreAway(next);
    update(scoreHome, next, scoreHome, prev);
  }

  async function handleFinish() {
    setEnding(true);
    try {
      const { error } = await supabase
        .from('match_scores')
        .update({ status: 'final', score_home: scoreHome, score_away: scoreAway })
        .eq('event_id', event.id);
      if (error) throw error;
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
      {/* Teams + score */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-[12px] font-bold text-[var(--sl-t1)] flex-1 truncate text-right">
          {homeTeam}
        </span>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[32px] font-black text-[var(--sl-t1)] tabular-nums w-8 text-center">
            {scoreHome}
          </span>
          <span className="text-[18px] font-bold text-[var(--sl-t3)]">–</span>
          <span className="text-[32px] font-black text-[var(--sl-t1)] tabular-nums w-8 text-center">
            {scoreAway}
          </span>
        </div>

        <span className="text-[12px] font-bold text-[var(--sl-t1)] flex-1 truncate text-left">
          {awayTeam}
        </span>
      </div>

      {/* Boutons ± par équipe */}
      <div className="flex gap-3 mb-3">
        {/* Domicile */}
        <div className="flex-1 flex gap-1.5">
          <button
            onClick={incrementHome}
            className="flex-1 py-3 rounded-xl bg-[var(--sl-green)] text-black
                       text-[15px] font-black active:scale-95 transition-transform"
          >
            +1 {homeTeam.split(' ')[0]}
          </button>
          <button
            onClick={decrementHome}
            disabled={scoreHome === 0}
            className="w-11 py-3 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)]
                       text-[17px] font-black border border-[var(--sl-border)]
                       active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Enlever 1 but domicile"
          >
            −
          </button>
        </div>

        {/* Visiteur */}
        <div className="flex-1 flex gap-1.5">
          <button
            onClick={incrementAway}
            className="flex-1 py-3 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t1)]
                       text-[15px] font-black border border-[var(--sl-border)]
                       active:scale-95 transition-transform"
          >
            +1 {awayTeam.split(' ')[0]}
          </button>
          <button
            onClick={decrementAway}
            disabled={scoreAway === 0}
            className="w-11 py-3 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)]
                       text-[17px] font-black border border-[var(--sl-border)]
                       active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Enlever 1 but visiteur"
          >
            −
          </button>
        </div>
      </div>

      {/* Terminer */}
      <button
        onClick={handleFinish}
        disabled={ending}
        className="w-full py-2.5 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)]
                   text-[13px] font-bold border border-[var(--sl-border)]
                   active:scale-95 transition-transform disabled:opacity-50"
      >
        {ending ? 'Fermeture du match…' : 'Terminer le match'}
      </button>
    </motion.div>
  );
}
