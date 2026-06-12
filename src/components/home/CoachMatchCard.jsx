import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import LiveScorePupitre from './LiveScorePupitre.jsx';

// ── Dérivation de l'état du match ─────────────────────────────────────────────
// pre_empty   → J-2 à J-1, 0 convocations créées
// pre_filled  → J-2 à J-1, convocations publiées
// match_day   → jour J, pas encore démarré
// live        → match_scores.status = 'in_progress'
// post_pending → match passé, score absent ou status 'pending'
// post_done   → score saisi (status 'final')
function deriveMatchState(event, matchScore, convocationCounts) {
  const now      = new Date();
  const matchDate = new Date(event.date);
  const diffDays  = (matchDate - now) / 86_400_000;

  if (matchScore?.status === 'in_progress') return 'live';
  if (matchScore?.status === 'final')       return 'post_done';

  if (matchDate < now) return 'post_pending';  // passé sans score

  const hasConvocations = convocationCounts && convocationCounts.total > 0;

  if (diffDays <= 1.5) {
    // Jour J ou J-1
    if (hasConvocations) return 'pre_filled';
    return 'match_day';
  }
  if (diffDays <= 3) {
    return hasConvocations ? 'pre_filled' : 'pre_empty';
  }
  // J-3 (communicant window) — pour le coach rien d'urgent avant J-2
  return hasConvocations ? 'pre_filled' : 'pre_empty';
}

function formatMatchDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatMatchTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ── Carte pré-match (convocations en attente de réponse) ─────────────────────
function ConvocationSummary({ counts }) {
  const accepted    = counts?.accepted    ?? 0;
  const declined    = counts?.declined    ?? 0;
  const unavailable = counts?.unavailable ?? 0;
  const pending     = counts?.pending     ?? 0;

  return (
    <div className="flex gap-2 flex-wrap">
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--sl-green-dim)] text-[var(--sl-green)]">
        ✓ {accepted} Présent{accepted > 1 ? 's' : ''}
      </span>
      {declined + unavailable > 0 && (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">
          ✗ {declined + unavailable} Absent{declined + unavailable > 1 ? 's' : ''}
        </span>
      )}
      {pending > 0 && (
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
          ⏳ {pending} Sans réponse
        </span>
      )}
    </div>
  );
}

// ── Modale inline de saisie du score post-match ───────────────────────────────
function ScoreInputInline({ event, onSaved }) {
  const [home,    setHome]    = useState('');
  const [away,    setAway]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const { toast } = useToast();

  const homeTeam = event?.team_name  || 'Domicile';
  const awayTeam = event?.adversaire || 'Visiteur';

  async function handleSave() {
    if (home === '' || away === '') return;
    setSaving(true);
    setError(null);
    try {
      const { data: existing } = await supabase
        .from('match_scores')
        .select('id')
        .eq('event_id', event.id)
        .maybeSingle();

      const payload = {
        event_id:   event.id,
        score_home: Number(home),
        score_away: Number(away),
        status:     'final',
        sport:      event.sport ?? 'Football',
      };

      const { error: dbErr } = existing
        ? await supabase.from('match_scores').update(payload).eq('event_id', event.id)
        : await supabase.from('match_scores').insert(payload);

      if (dbErr) throw dbErr;
      onSaved?.({ home: Number(home), away: Number(away) });
    } catch {
      setError('Erreur lors de la sauvegarde — réessayez');
      toast({ message: 'Impossible de sauvegarder le score' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="pt-3 border-t border-[var(--sl-border)] mt-3">
        <p className="text-[11px] font-bold text-[var(--sl-t3)] uppercase tracking-wider mb-2">
          Score final
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[var(--sl-t3)] mb-1 truncate">{homeTeam}</p>
            <input
              type="number" min="0" max="99"
              value={home}
              onChange={e => setHome(e.target.value)}
              className="w-full py-2 text-center text-[22px] font-black rounded-xl
                         bg-[var(--sl-card-hi)] text-[var(--sl-t1)] border border-[var(--sl-border)]
                         outline-none focus:border-[var(--sl-blue)]"
            />
          </div>
          <span className="text-[20px] font-bold text-[var(--sl-t3)] pb-5">–</span>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[var(--sl-t3)] mb-1 truncate">{awayTeam}</p>
            <input
              type="number" min="0" max="99"
              value={away}
              onChange={e => setAway(e.target.value)}
              className="w-full py-2 text-center text-[22px] font-black rounded-xl
                         bg-[var(--sl-card-hi)] text-[var(--sl-t1)] border border-[var(--sl-border)]
                         outline-none focus:border-[var(--sl-blue)]"
            />
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-red-400 mt-2 text-center">{error}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving || home === '' || away === ''}
          className="mt-3 w-full py-2.5 rounded-xl bg-[var(--sl-blue)] text-white
                     text-[13px] font-bold active:scale-95 transition-transform
                     disabled:opacity-40"
        >
          {saving ? 'Enregistrement…' : 'Valider le score'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function CoachMatchCard({
  event,
  matchScore,
  convocationCounts,
  onNavigate,
  onOpenPoster,
  onConvocate,
}) {
  const [showScoreInput,  setShowScoreInput]  = useState(false);
  const [localScore,      setLocalScore]      = useState(null);
  const [launching,       setLaunching]       = useState(false);
  const { toast } = useToast();

  const effectiveScore = localScore ?? matchScore;
  const state = useMemo(
    () => deriveMatchState(event, effectiveScore, convocationCounts),
    [event, effectiveScore, convocationCounts],
  );

  const homeTeam = event?.team_name  || 'Mon équipe';
  const awayTeam = event?.adversaire || 'Adversaire';
  const isLive   = state === 'live';

  // ── Relancer les convocations ─────────────────────────────────────────────
  const handleRelance = useCallback(async () => {
    try {
      await supabase.functions.invoke('send-push', {
        body: {
          club_id:  event.club_id,
          event_id: event.id,
          type:     'convocation_reminder',
          title:    `Rappel convocation — ${formatMatchDate(event.date)}`,
          body:     `Vous n'avez pas encore répondu à votre convocation. Merci de confirmer votre présence.`,
        },
      });
      toast({ message: 'Rappels envoyés aux joueurs en attente' });
    } catch {
      toast({ message: 'Erreur lors de l\'envoi des rappels' });
    }
  }, [event, toast]);

  // ── Démarrer le Live ─────────────────────────────────────────────────────
  const handleStartLive = useCallback(async () => {
    setLaunching(true);
    try {
      const { data: existing } = await supabase
        .from('match_scores')
        .select('id')
        .eq('event_id', event.id)
        .maybeSingle();

      const payload = { event_id: event.id, status: 'in_progress', score_home: 0, score_away: 0, sport: event.sport ?? 'Football' };
      const { error } = existing
        ? await supabase.from('match_scores').update({ status: 'in_progress' }).eq('event_id', event.id)
        : await supabase.from('match_scores').insert(payload);

      if (error) toast({ message: 'Impossible de démarrer le live' });
    } catch {
      toast({ message: 'Impossible de démarrer le live' });
    } finally {
      setLaunching(false);
    }
  }, [event, toast]);

  function handleScoreSaved(score) {
    setLocalScore({ status: 'final', score_home: score.home, score_away: score.away });
    setShowScoreInput(false);
    onOpenPoster?.({ event, score, mode: 'result' });
  }

  function handleLiveDone(score) {
    setLocalScore({ status: 'final', score_home: score.home, score_away: score.away });
  }

  const accentGradient = isLive
    ? 'from-red-500 to-orange-500'
    : state === 'post_done'
      ? 'from-emerald-500 to-teal-500'
      : 'from-[var(--sl-blue)] to-indigo-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      className="rounded-2xl border border-[var(--sl-border)] bg-[var(--sl-card)] overflow-hidden"
      data-demo="coach-match-card"
      style={isLive ? { borderColor: 'rgba(239,68,68,0.4)' } : {}}
    >
      {/* Accent bar */}
      <div className={`h-1 bg-gradient-to-r ${accentGradient}`} />

      <div className="px-4 pt-3 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isLive && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 tracking-wider"
                >
                  🔴 EN COURS
                </motion.span>
              )}
              {!isLive && (
                <span className="text-[10px] font-black tracking-widest uppercase text-[var(--sl-blue)]">
                  {state === 'post_done' || state === 'post_pending' ? 'Post-match' : 'Avant-match'}
                </span>
              )}
              <span className="text-[10px] text-[var(--sl-t3)]">
                {formatMatchDate(event.date)} · {formatMatchTime(event.date)}
              </span>
            </div>
            <p className="text-[15px] font-bold text-[var(--sl-t1)] leading-snug">
              {homeTeam}
              <span className="font-normal text-[var(--sl-t3)]"> vs </span>
              {awayTeam}
            </p>
          </div>
        </div>

        {/* Corps selon l'état */}
        <AnimatePresence mode="wait">
          {state === 'pre_empty' && (
            <motion.div key="pre_empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[12px] text-[var(--sl-t3)] mb-2">
                Aucune convocation créée pour ce match.
              </p>
              <button
                onClick={() => onConvocate ? onConvocate(event) : onNavigate?.('mon-club')}
                data-demo="convocation-btn"
                className="w-full py-2.5 rounded-xl bg-[var(--sl-blue)] text-white
                           text-[13px] font-bold active:scale-95 transition-transform"
              >
                Créer la convocation
              </button>
            </motion.div>
          )}

          {state === 'pre_filled' && (
            <motion.div key="pre_filled" className="space-y-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ConvocationSummary counts={convocationCounts} />
              <div className="flex gap-2">
                <button
                  onClick={handleRelance}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)]
                             text-[12px] font-bold border border-[var(--sl-border)]
                             active:scale-95 transition-transform"
                >
                  Relancer
                </button>
                <button
                  onClick={() => onNavigate?.('mon-club')}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--sl-blue)] text-white
                             text-[12px] font-bold active:scale-95 transition-transform"
                >
                  Voir les détails
                </button>
              </div>
            </motion.div>
          )}

          {state === 'match_day' && (
            <motion.div key="match_day" className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {convocationCounts?.total > 0 && <ConvocationSummary counts={convocationCounts} />}
              <button
                onClick={handleStartLive}
                disabled={launching}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white
                           text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-50"
              >
                {launching ? 'Démarrage…' : '🔴 Lancer le Live'}
              </button>
            </motion.div>
          )}

          {state === 'live' && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveScorePupitre
                event={event}
                matchScore={effectiveScore}
                onFinished={handleLiveDone}
              />
            </motion.div>
          )}

          {state === 'post_pending' && (
            <motion.div key="post_pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                onClick={() => setShowScoreInput(v => !v)}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-black
                           text-[13px] font-bold active:scale-95 transition-transform"
              >
                Saisir le score
              </button>
              <AnimatePresence>
                {showScoreInput && (
                  <ScoreInputInline event={event} onSaved={handleScoreSaved} />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {state === 'post_done' && (
            <motion.div key="post_done" className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-center gap-4 py-1">
                <span className="text-[28px] font-black text-[var(--sl-t1)] tabular-nums">
                  {effectiveScore?.score_home ?? '—'}
                </span>
                <span className="text-[var(--sl-t3)] font-bold">–</span>
                <span className="text-[28px] font-black text-[var(--sl-t1)] tabular-nums">
                  {effectiveScore?.score_away ?? '—'}
                </span>
              </div>
              <button
                onClick={() => onOpenPoster?.({
                  event,
                  score: { home: effectiveScore?.score_home, away: effectiveScore?.score_away },
                  mode: 'result',
                })}
                className="w-full py-2.5 rounded-xl bg-[var(--sl-green)] text-black
                           text-[13px] font-bold active:scale-95 transition-transform"
              >
                ⚡ Générer l'affiche résultat
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
