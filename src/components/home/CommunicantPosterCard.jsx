import { useMemo } from 'react';
import { motion } from 'framer-motion';

// ── Chronologie relative à la date du match ───────────────────────────────────
// Retourne : 'pre_j3' | 'pre_j1' | 'post_result' | null
function getPosterWindow(event, matchScore, convocationCounts) {
  const now       = new Date();
  const matchDate = new Date(event.date);
  const diffDays  = (matchDate - now) / 86_400_000;

  // Post-match : score disponible
  const scoreAvail = matchScore?.status === 'final'
    && matchScore.score_home != null
    && matchScore.score_away != null;
  if (matchDate < now && scoreAvail) return 'post_result';

  // J-1 : convocations validées (au moins 1 acceptée)
  const hasAccepted = (convocationCounts?.accepted ?? 0) > 0;
  if (diffDays >= 0 && diffDays <= 1.5 && hasAccepted) return 'pre_j1';

  // J-3 : fenêtre communicant
  if (diffDays > 0 && diffDays <= 3.5) return 'pre_j3';

  return null;
}

function formatMatchShort(event) {
  const d = new Date(event.date);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${event.team_name || 'Mon équipe'} vs ${event.adversaire || 'Adversaire'} · ${day}`;
}

export default function CommunicantPosterCard({
  event,
  matchScore,
  convocationCounts,
  onOpenPoster,
}) {
  const window = useMemo(
    () => getPosterWindow(event, matchScore, convocationCounts),
    [event, matchScore, convocationCounts],
  );

  if (!window) return null;

  const matchInfo = formatMatchShort(event);

  if (window === 'post_result') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="rounded-2xl border border-[var(--sl-green)]/40 bg-[var(--sl-card)] overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="px-4 py-3">
          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
            ⚡ Score disponible
          </span>
          <p className="text-[13px] font-semibold text-[var(--sl-t2)] mt-0.5 mb-2">{matchInfo}</p>
          <button
            onClick={() => onOpenPoster?.({
              event,
              score: { home: matchScore.score_home, away: matchScore.score_away },
              mode: 'result',
            })}
            className="w-full py-2.5 rounded-xl bg-[var(--sl-green)] text-black
                       text-[13px] font-bold active:scale-95 transition-transform"
          >
            Générer le visuel résultat
          </button>
        </div>
      </motion.div>
    );
  }

  if (window === 'pre_j1') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="rounded-2xl border border-[var(--sl-border)] bg-[var(--sl-card)] overflow-hidden"
      >
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
        <div className="px-4 py-3">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-400">
            Affiche convocation · J-1
          </span>
          <p className="text-[13px] font-semibold text-[var(--sl-t2)] mt-0.5 mb-2">{matchInfo}</p>
          <button
            onClick={() => onOpenPoster?.({ event, mode: 'convocation' })}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-black
                       text-[13px] font-bold active:scale-95 transition-transform"
          >
            Créer l'affiche Convocation
          </button>
        </div>
      </motion.div>
    );
  }

  // pre_j3
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="rounded-2xl border border-[var(--sl-border)] bg-[var(--sl-card)] overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-[var(--sl-blue)] to-indigo-500" />
      <div className="px-4 py-3">
        <span className="text-[10px] font-black tracking-widest uppercase text-[var(--sl-blue)]">
          Affiche Jour de Match · J-3
        </span>
        <p className="text-[13px] font-semibold text-[var(--sl-t2)] mt-0.5 mb-2">{matchInfo}</p>
        <button
          onClick={() => onOpenPoster?.({ event, mode: 'matchday' })}
          className="w-full py-2.5 rounded-xl bg-[var(--sl-blue)] text-white
                     text-[13px] font-bold active:scale-95 transition-transform"
        >
          Créer l'affiche Jour de Match
        </button>
      </div>
    </motion.div>
  );
}
