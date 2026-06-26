import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase }          from '../../lib/supabase.js';
import { useToast }          from '../../contexts/ToastContext.jsx';
import PresenceButtons       from './PresenceButtons.jsx';
import CarpoolSection        from './CarpoolSection.jsx';
import AttendanceListSheet   from './AttendanceListSheet.jsx';
import LiveScorePupitre      from '../home/LiveScorePupitre.jsx';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  championship: { label: 'Championnat', color: '#06b6d4' },
  cup:          { label: 'Coupe',        color: '#f59e0b' },
  tournament:   { label: 'Tournoi',      color: '#a855f7' },
  friendly:     { label: 'Amical',       color: '#64748b' },
  match:        { label: 'Match',        color: '#06b6d4' },
};

type CardState = 'live' | 'post_done' | 'post_pending' | 'match_day' | 'pre_match';

function deriveCardState(item: Record<string, any>, localMatchScore: Record<string, any> | null): CardState {
  const ms = localMatchScore ?? item.matchScore;
  if (ms?.status === 'in_progress') return 'live';
  if (ms?.status === 'final')       return 'post_done';
  if (item.score?.home != null || item.score?.away != null) return 'post_done';

  const now       = new Date();
  const timeStr   = item.time ? `T${item.time}:00` : 'T12:00:00';
  const matchDate = new Date(item.date + timeStr);
  if (isNaN(matchDate.getTime())) return 'pre_match';
  if (matchDate < now) return 'post_pending';
  return matchDate.toDateString() === now.toDateString() ? 'match_day' : 'pre_match';
}

function getEffectiveScore(item: Record<string, any>, localMatchScore: Record<string, any> | null) {
  const ms = localMatchScore ?? item.matchScore;
  if (ms?.status === 'final') return { home: ms.score_home, away: ms.score_away };
  if (item.score?.home != null || item.score?.away != null) return item.score;
  return null;
}

function TeamAvatar({ name, logoUrl, size = 40 }: { name?: string | null; logoUrl?: string | null; size?: number }) {
  const initials = ((name ?? '?').split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase()) || '?';
  return (
    <div
      className="rounded-full bg-[var(--sl-surface)] border-2 border-[var(--sl-border)] flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      {logoUrl
        ? <img src={logoUrl} alt={name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span className="text-xs font-black text-[var(--sl-t2)]">{initials}</span>
      }
    </div>
  );
}

interface ConvocationCounts { accepted?: number; declined?: number; unavailable?: number; pending?: number; total?: number }

function ConvocationSummary({ counts }: { counts?: ConvocationCounts | null }) {
  const accepted    = counts?.accepted    ?? 0;
  const declined    = counts?.declined    ?? 0;
  const unavailable = counts?.unavailable ?? 0;
  const pending     = counts?.pending     ?? 0;
  return (
    <div className="flex gap-2 flex-wrap">
      <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--sl-green-dim)] text-[var(--sl-green)]">✓ {accepted} Présent{accepted > 1 ? 's' : ''}</span>
      {declined + unavailable > 0 && <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">✗ {declined + unavailable} Absent{declined + unavailable > 1 ? 's' : ''}</span>}
      {pending > 0 && <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">⏳ {pending} Sans réponse</span>}
    </div>
  );
}

function ScoreInputInline({ eventId, sport, homeTeam, awayTeam, onSaved }: { eventId: string | number; sport?: string | null; homeTeam: string; awayTeam: string; onSaved: (s: { home: number; away: number }) => void }) {
  const [home,   setHome]   = useState('');
  const [away,   setAway]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const { toast } = useToast() as any;

  async function handleSave() {
    if (home === '' || away === '') return;
    setSaving(true); setError(null);
    try {
      const { data: existing } = await supabase.from('match_scores').select('id').eq('event_id', eventId).maybeSingle();
      const payload = { event_id: eventId, score_home: Number(home), score_away: Number(away), status: 'final', sport: sport ?? 'Football' };
      const { error: dbErr } = existing
        ? await supabase.from('match_scores').update(payload).eq('event_id', eventId)
        : await supabase.from('match_scores').insert(payload);
      if (dbErr) throw dbErr;
      onSaved?.({ home: Number(home), away: Number(away) });
    } catch {
      setError('Erreur lors de la sauvegarde — réessayez');
      toast({ message: 'Impossible de sauvegarder le score' });
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="pt-3 border-t border-[var(--sl-border)] mt-3">
        <p className="text-[11px] font-bold text-[var(--sl-t3)] uppercase tracking-wider mb-2">Score final</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[var(--sl-t3)] mb-1 truncate">{homeTeam}</p>
            <input type="number" min="0" max="99" value={home} onChange={e => setHome(e.target.value)} className="w-full py-2 text-center text-[22px] font-black rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t1)] border border-[var(--sl-border)] outline-none focus:border-[var(--sl-blue)]" />
          </div>
          <span className="text-[20px] font-bold text-[var(--sl-t3)] pb-5">–</span>
          <div className="flex-1 text-center">
            <p className="text-[10px] text-[var(--sl-t3)] mb-1 truncate">{awayTeam}</p>
            <input type="number" min="0" max="99" value={away} onChange={e => setAway(e.target.value)} className="w-full py-2 text-center text-[22px] font-black rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t1)] border border-[var(--sl-border)] outline-none focus:border-[var(--sl-blue)]" />
          </div>
        </div>
        {error && <p className="text-[11px] text-red-400 mt-2 text-center">{error}</p>}
        <button onClick={handleSave} disabled={saving || home === '' || away === ''} className="mt-3 w-full py-2.5 rounded-xl bg-[var(--sl-blue)] text-white text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-40">
          {saving ? 'Enregistrement…' : 'Valider le score'}
        </button>
      </div>
    </motion.div>
  );
}

interface MatchItem extends Record<string, any> {
  id: string | number;
  event_type?: string;
  date?: string;
  time?: string | null;
  location?: string | null;
  category?: string | null;
  level?: string | null;
  sport?: string | null;
  adversaire?: string | null;
  home_or_away?: string;
  matchScore?: Record<string, any> | null;
  score?: { home?: number; away?: number } | null;
  myStatus?: string | null;
  isPlayerClub?: boolean;
  isStaffClub?: boolean;
  isSupporter?: boolean;
  presentCount?: number;
  absentCount?: number;
  unsureCount?: number;
  convocs?: ConvocationCounts & { total: number };
  onRespond?: (type: string, id: string | number, status: string) => void;
}

interface MatchPlanningCardProps {
  item: MatchItem;
  userId?: string | null;
  club?: Record<string, any> | null;
  isStaff?: boolean;
  isCoach?: boolean;
  isCommunicant?: boolean;
  onOpenPoster?: (opts: Record<string, any>) => void;
  onConvocate?: (item: MatchItem) => void;
  onOpenRides?: () => void;
  onScoreSaved?: (id: string | number, score: Record<string, any>) => void;
  showClubBadge?: boolean;
}

export default function MatchPlanningCard({ item, userId, club, isStaff, isCoach, isCommunicant, onOpenPoster, onConvocate, onOpenRides, onScoreSaved, showClubBadge }: MatchPlanningCardProps) {
  const [showList,        setShowList]        = useState(false);
  const [showScoreInput,  setShowScoreInput]  = useState(false);
  const [localMatchScore, setLocalMatchScore] = useState<Record<string, any> | null>(null);
  const [launching,       setLaunching]       = useState(false);
  const { toast } = useToast() as any;

  const cardState     = deriveCardState(item, localMatchScore);
  const effectiveScore = getEffectiveScore(item, localMatchScore);
  const effectiveMs   = localMatchScore ?? item.matchScore;

  const cfg      = TYPE_CONFIG[item.event_type ?? ''] ?? TYPE_CONFIG.friendly;
  const clubName = club?.name ?? 'FC';
  const oppName  = item.adversaire || '?';
  const homeTeam = item.home_or_away === 'home' ? clubName : oppName;
  const awayTeam = item.home_or_away === 'home' ? oppName  : clubName;

  const todayStr = new Date().toISOString().slice(0, 10);
  const isPast   = (item.date ?? '') < todayStr;

  const handleStartLive = useCallback(async () => {
    setLaunching(true);
    try {
      const { data: existing } = await supabase.from('match_scores').select('id').eq('event_id', item.id).maybeSingle();
      const payload = { event_id: item.id, status: 'in_progress', score_home: 0, score_away: 0, sport: item.sport ?? 'Football' };
      const { error } = existing
        ? await supabase.from('match_scores').update({ status: 'in_progress' }).eq('event_id', item.id)
        : await supabase.from('match_scores').insert(payload);
      if (error) throw error;
      setLocalMatchScore({ status: 'in_progress', score_home: 0, score_away: 0 });
    } catch {
      toast({ message: 'Impossible de démarrer le live' });
    } finally { setLaunching(false); }
  }, [item.id, item.sport, toast]);

  function handleScoreSaved(score: { home: number; away: number }) {
    const scoreData = { status: 'final', score_home: score.home, score_away: score.away };
    setLocalMatchScore(scoreData);
    setShowScoreInput(false);
    onScoreSaved?.(item.id, scoreData);
    onOpenPoster?.({ event: item, club, score: { home: score.home, away: score.away }, mode: 'result' });
  }

  function handleLiveDone(score: { home: number; away: number }) {
    const scoreData = { status: 'final', score_home: score.home, score_away: score.away };
    setLocalMatchScore(scoreData);
    onScoreSaved?.(item.id, scoreData);
    onOpenPoster?.({ event: item, club, score: { home: score.home, away: score.away }, mode: 'result' });
  }

  const isLive = cardState === 'live';

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl overflow-hidden bg-[var(--sl-card)] border border-[var(--sl-border)]"
        data-demo="coach-match-card"
        style={{ borderLeftWidth: 3, borderLeftColor: isLive ? 'rgba(239,68,68,0.7)' : cfg.color, ...(isLive ? { borderColor: 'rgba(239,68,68,0.35)' } : {}) }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isLive ? (
                <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }} className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 tracking-wider">🔴 EN COURS</motion.span>
              ) : (
                <span className="text-[9px] font-black tracking-[0.14em] uppercase px-2.5 py-1 rounded-full" style={{ background: `${cfg.color}25`, color: cfg.color }}>{cfg.label}</span>
              )}
              {item.level && <span className="text-[9px] font-semibold text-[var(--sl-t3)]">{item.level}</span>}
              {showClubBadge && club?.name && <span className="text-[9px] font-semibold text-[var(--sl-t3)] truncate max-w-[80px]">{club.name}</span>}
            </div>
            <div className="flex items-center gap-2">
              {isStaff && <span className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 rounded-full" style={{ background: '#06b6d420', color: '#06b6d4' }}>{isCoach ? 'Coach' : 'Comm'}</span>}
              {!isStaff && !isPast && (
                <button
                  data-demo="favorite-btn"
                  onClick={() => { window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'event-favorited' } })); }}
                  aria-label="Sauvegarder ce match"
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--sl-surface)]"
                >
                  <span style={{ fontSize: 16, color: 'var(--sl-t3)' }}>☆</span>
                </button>
              )}
              {item.time && <span className="text-sm font-black text-[var(--sl-t1)]">{item.time}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <TeamAvatar name={homeTeam} logoUrl={item.home_or_away === 'home' ? (club?.logo_url ?? club?.logoUrl) : null} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-[var(--sl-t1)] leading-tight">
                {homeTeam} <span className="font-normal text-[var(--sl-t3)] text-sm">vs</span> {awayTeam}
              </p>
              {item.location && <p className="text-xs text-[var(--sl-t3)] mt-0.5 truncate">{item.location}</p>}
              {item.category && <p className="text-xs text-[var(--sl-t3)]">{item.category}</p>}
            </div>
            <TeamAvatar name={awayTeam} logoUrl={item.home_or_away === 'away' ? (club?.logo_url ?? club?.logoUrl) : null} />
          </div>

          {cardState === 'post_done' && effectiveScore && (
            <div className="flex justify-center my-3">
              <span className="text-2xl font-black text-[var(--sl-t1)] tabular-nums">{effectiveScore.home} – {effectiveScore.away}</span>
            </div>
          )}

          {(item.isPlayerClub || isStaff) && ((item.presentCount ?? 0) > 0 || (item.absentCount ?? 0) > 0) && (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">Présence</p>
              <button onClick={() => setShowList(true)} className="w-full cursor-pointer hover:bg-[var(--sl-hover)] rounded-xl bg-[var(--sl-surface)] px-3 py-2 transition-colors">
                <div className="flex gap-4 text-xs items-center">
                  {(item.presentCount ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Présent</span><span className="font-black text-emerald-400">{item.presentCount}</span></div>}
                  {(item.absentCount ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Absent</span><span className="font-black text-red-400">{item.absentCount}</span></div>}
                  {(item.unsureCount ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Incertain</span><span className="font-black text-slate-400">{item.unsureCount}</span></div>}
                  <span className="ml-auto text-[var(--sl-t3)] text-[10px]">›</span>
                </div>
              </button>
            </div>
          )}

          {isStaff && item.convocs && item.convocs.total > 0 && (
            <button onClick={() => setShowList(true)} className="w-full text-left mb-3 px-3 py-2 rounded-xl bg-[var(--sl-surface)] hover:bg-[var(--sl-hover)] transition-colors">
              <span className="text-xs text-[var(--sl-t3)]">
                <span className="font-black text-emerald-400">{item.convocs.accepted}</span> confirmés
                {(item.convocs.pending ?? 0) > 0 && <> · <span className="font-black text-amber-400">{item.convocs.pending}</span> en attente</>}
                <span className="ml-2 text-[var(--sl-t3)]">›</span>
              </span>
            </button>
          )}

          {item.isSupporter && (item.convocs?.accepted ?? 0) > 0 && (
            <div className="w-full text-xs font-semibold text-[var(--sl-t2)] py-2 px-3 rounded-xl bg-[var(--sl-surface)] mb-3">
              👥 {item.convocs!.accepted} joueur{(item.convocs!.accepted ?? 0) > 1 ? 's' : ''} convoqué{(item.convocs!.accepted ?? 0) > 1 ? 's' : ''}
            </div>
          )}

          {item.isPlayerClub && (
            <div className="mb-3" data-demo="convocation-respond">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">Ma présence</p>
              <PresenceButtons myStatus={item.myStatus} onRespond={status => item.onRespond?.('match', item.id, status)} disabled={isPast} size="sm" />
            </div>
          )}

          <AnimatePresence mode="wait">
            {cardState === 'live' && (
              <motion.div key="live" className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isCoach ? (
                  <LiveScorePupitre event={item} matchScore={effectiveMs} onFinished={handleLiveDone} />
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/25">
                    <motion.span animate={{ opacity: [1, 0.35, 1] }} transition={{ repeat: Infinity, duration: 1.4 }} className="text-[12px] font-black text-red-400">🔴 EN COURS</motion.span>
                    <span className="text-[22px] font-black text-[var(--sl-t1)] tabular-nums">{effectiveMs?.score_home ?? 0} – {effectiveMs?.score_away ?? 0}</span>
                  </div>
                )}
              </motion.div>
            )}

            {cardState === 'match_day' && isCoach && (
              <motion.div key="match_day" className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {item.convocs && item.convocs.total > 0 && <ConvocationSummary counts={item.convocs} />}
                <button onClick={handleStartLive} disabled={launching} className="w-full py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold active:scale-95 transition-transform disabled:opacity-50">{launching ? 'Démarrage…' : '🔴 Lancer le Live'}</button>
                <button onClick={() => onConvocate?.(item)} data-demo="convocation-btn" className="w-full py-2 rounded-xl bg-[var(--sl-card-hi)] text-[var(--sl-t2)] text-[12px] font-bold border border-[var(--sl-border)] active:scale-95 transition-transform">📣 Gérer les convocations</button>
              </motion.div>
            )}

            {cardState === 'pre_match' && (isCoach || isCommunicant) && (
              <motion.div key="pre_match" className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {isCoach && (
                  <button onClick={() => onConvocate?.(item)} data-demo="convocation-btn" className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-black active:opacity-80 transition-opacity" style={{ background: '#f59e0b' }}>
                    <span className="flex items-center gap-2"><span>📣</span><span>Convoquer l'équipe</span></span>
                    <span className="text-black/50 text-lg">≡</span>
                  </button>
                )}
                <button onClick={() => onOpenPoster?.({ event: item, club })} className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-white active:opacity-80 transition-opacity" style={{ background: '#f97316' }}>
                  <span className="flex items-center gap-2"><span>🎨</span><span>Créer l'affiche</span></span>
                  <span className="text-white/50 text-lg">↗</span>
                </button>
              </motion.div>
            )}

            {cardState === 'post_pending' && isCoach && (
              <motion.div key="post_pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => setShowScoreInput(v => !v)} className="w-full py-2.5 rounded-xl text-[13px] font-bold active:scale-95 transition-transform text-black" style={{ background: '#f59e0b' }}>{showScoreInput ? 'Annuler' : '📊 Saisir le score final'}</button>
                <AnimatePresence>
                  {showScoreInput && <ScoreInputInline key="score-form" eventId={item.id} sport={item.sport} homeTeam={homeTeam} awayTeam={awayTeam} onSaved={handleScoreSaved} />}
                </AnimatePresence>
              </motion.div>
            )}

            {cardState === 'post_done' && isStaff && (
              <motion.div key="post_done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button onClick={() => onOpenPoster?.({ event: item, club, score: { home: effectiveScore?.home, away: effectiveScore?.away }, mode: 'result' })} className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-black active:opacity-80 transition-opacity" style={{ background: '#22d96a' }}>
                  <span className="flex items-center gap-2"><span>⚡</span><span>Générer l'affiche résultat</span></span>
                  <span className="text-black/50 text-lg">↗</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {item.myStatus === 'present' && (
              <CarpoolSection eventId={item.id} myStatus={item.myStatus} onOpenRides={onOpenRides} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AttendanceListSheet open={showList} onClose={() => setShowList(false)} type="match" id={item.id} userId={userId} />
    </>
  );
}
