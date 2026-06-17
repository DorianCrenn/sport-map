import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceButtons     from './PresenceButtons.jsx';
import CarpoolSection      from './CarpoolSection.jsx';
import AttendanceListSheet from './AttendanceListSheet.jsx';

const TYPE_CONFIG = {
  championship: { label: 'Championnat', color: '#06b6d4' },
  cup:          { label: 'Coupe',        color: '#f59e0b' },
  tournament:   { label: 'Tournoi',      color: '#a855f7' },
  friendly:     { label: 'Amical',       color: '#64748b' },
};

function TeamInitials({ name, size = 40 }) {
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
  return (
    <div
      className="rounded-full bg-[var(--sl-surface)] border-2 border-[var(--sl-border)] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-xs font-black text-[var(--sl-t2)]">{initials}</span>
    </div>
  );
}

export default function MatchPlanningCard({
  item,
  userId,
  club,
  isStaff,
  onOpenPoster,
  onConvocate,
  onOpenRides,
}) {
  const [showList, setShowList] = useState(false);

  const cfg      = TYPE_CONFIG[item.event_type] ?? TYPE_CONFIG.friendly;
  const clubName = club?.name ?? 'FC';
  const oppName  = item.adversaire || '?';
  const homeTeam = item.home_or_away === 'home' ? clubName : oppName;
  const awayTeam = item.home_or_away === 'home' ? oppName  : clubName;

  const hasScore = item.score && (item.score.home != null || item.score.away != null);

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl overflow-hidden bg-[var(--sl-card)] border border-[var(--sl-border)]"
        style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}
      >
        <div className="p-4">

          {/* ── Ligne 1 : badge + heure + rôle ────────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-black tracking-[0.14em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: `${cfg.color}25`, color: cfg.color }}
              >
                {cfg.label}
              </span>
              {item.level && (
                <span className="text-[9px] font-semibold text-[var(--sl-t3)]">{item.level}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isStaff && (
                <span
                  className="text-[9px] font-black tracking-[0.1em] uppercase px-2.5 py-1 rounded-full"
                  style={{ background: '#06b6d420', color: '#06b6d4' }}
                >
                  Rôle Staff
                </span>
              )}
              {item.time && (
                <span className="text-sm font-black text-[var(--sl-t1)]">{item.time}</span>
              )}
            </div>
          </div>

          {/* ── Équipes ────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-2">
            <TeamInitials name={homeTeam} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-[var(--sl-t1)] leading-tight">
                {homeTeam}{' '}
                <span className="font-normal text-[var(--sl-t3)] text-sm">vs</span>{' '}
                {awayTeam}
              </p>
              {item.location && (
                <p className="text-xs text-[var(--sl-t3)] mt-0.5 truncate">{item.location}</p>
              )}
              {item.category && (
                <p className="text-xs text-[var(--sl-t3)]">{item.category}</p>
              )}
            </div>
            <TeamInitials name={awayTeam} />
          </div>

          {/* ── Score si passé ─────────────────────────────────────── */}
          {hasScore && (
            <div className="flex justify-center my-3">
              <span className="text-2xl font-black text-[var(--sl-t1)]">
                {item.score.home} – {item.score.away}
              </span>
            </div>
          )}

          {/* ── PRÉSENCE ──────────────────────────────────────────── */}
          {(item.isPlayerClub || isStaff) && (item.presentCount > 0 || item.absentCount > 0) && (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">
                Présence
              </p>
              <button
                onClick={() => setShowList(true)}
                className="w-full cursor-pointer hover:bg-[var(--sl-hover)] rounded-xl bg-[var(--sl-surface)] px-3 py-2 transition-colors"
              >
                <div className="flex gap-4 text-xs items-center">
                  {item.presentCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--sl-t3)]">Présent</span>
                      <span className="font-black text-emerald-400">{item.presentCount}</span>
                    </div>
                  )}
                  {item.absentCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--sl-t3)]">Absent</span>
                      <span className="font-black text-red-400">{item.absentCount}</span>
                    </div>
                  )}
                  {item.unsureCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[var(--sl-t3)]">Incertain</span>
                      <span className="font-black text-slate-400">{item.unsureCount}</span>
                    </div>
                  )}
                  <span className="ml-auto text-[var(--sl-t3)] text-[10px]">›</span>
                </div>
              </button>
            </div>
          )}

          {/* ── Convocations staff ─────────────────────────────────── */}
          {isStaff && item.convocs && item.convocs.total > 0 && (
            <button
              onClick={() => setShowList(true)}
              className="w-full text-left mb-3 px-3 py-2 rounded-xl bg-[var(--sl-surface)] hover:bg-[var(--sl-hover)] transition-colors"
            >
              <span className="text-xs text-[var(--sl-t3)]">
                <span className="font-black text-emerald-400">{item.convocs.accepted}</span> confirmés
                {item.convocs.pending > 0 && (
                  <> · <span className="font-black text-amber-400">{item.convocs.pending}</span> en attente</>
                )}
                <span className="ml-2 text-[var(--sl-t3)]">›</span>
              </span>
            </button>
          )}

          {/* ── Vue supporter : groupe convoqué ────────────────────── */}
          {item.isSupporter && item.convocs?.accepted > 0 && (
            <button
              onClick={() => setShowList(true)}
              className="w-full text-xs font-semibold text-[var(--sl-t2)] py-2 rounded-xl bg-[var(--sl-surface)] hover:bg-[var(--sl-hover)] transition-colors mb-3"
            >
              👥 {item.convocs.accepted} joueur{item.convocs.accepted > 1 ? 's' : ''} convoqué{item.convocs.accepted > 1 ? 's' : ''}
            </button>
          )}

          {/* ── JOUEUR — boutons présence ─────────────────────────── */}
          {item.isPlayerClub && (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">
                Joueur
              </p>
              <PresenceButtons
                myStatus={item.myStatus}
                onRespond={status => item.onRespond?.('match', item.id, status)}
                size="sm"
              />
            </div>
          )}

          {/* ── ACTIONS STAFF ────────────────────────────────────────── */}
          {isStaff && !hasScore && (
            <div>
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-2">
                Actions Staff
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onConvocate?.(item)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-black transition-opacity hover:opacity-90 active:opacity-80"
                  style={{ background: '#f59e0b' }}
                >
                  <span className="flex items-center gap-2">
                    <span>📣</span>
                    <span>Convoquer l'équipe</span>
                  </span>
                  <span className="text-black/50 text-lg">≡</span>
                </button>
                <button
                  onClick={() => onOpenPoster?.({ event: item, club })}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90 active:opacity-80"
                  style={{ background: '#f97316' }}
                >
                  <span className="flex items-center gap-2">
                    <span>🎨</span>
                    <span>Créer l'affiche</span>
                  </span>
                  <span className="text-white/50 text-lg">↗</span>
                </button>
              </div>
            </div>
          )}

          {/* Post-match : affiche résultat */}
          {isStaff && hasScore && (
            <button
              onClick={() => onOpenPoster?.({ event: item, club, score: item.score })}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: '#f97316' }}
            >
              <span className="flex items-center gap-2"><span>🎨</span><span>Créer l'affiche résultat</span></span>
              <span className="text-white/50">↗</span>
            </button>
          )}

          {/* ── Covoiturage ───────────────────────────────────────── */}
          <AnimatePresence>
            {item.myStatus === 'present' && (
              <CarpoolSection
                eventId={item.id}
                myStatus={item.myStatus}
                onOpenRides={onOpenRides}
              />
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      <AttendanceListSheet
        open={showList}
        onClose={() => setShowList(false)}
        type="match"
        id={item.id}
        userId={userId}
      />
    </>
  );
}
