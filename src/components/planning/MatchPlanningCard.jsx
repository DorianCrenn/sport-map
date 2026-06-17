import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceButtons     from './PresenceButtons.jsx';
import CarpoolSection      from './CarpoolSection.jsx';
import AttendanceListSheet from './AttendanceListSheet.jsx';

const TYPE_COLORS = {
  championship: '#06b6d4',
  cup:          '#f59e0b',
  tournament:   '#a855f7',
  friendly:     '#64748b',
};

const TYPE_LABELS = {
  championship: 'Championnat',
  cup:          'Coupe',
  tournament:   'Tournoi',
  friendly:     'Amical',
};

function TeamBadge({ name }) {
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--sl-surface)] border-2 border-[var(--sl-border)] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-black text-[var(--sl-t2)]">{initials}</span>
    </div>
  );
}

function ConvocBadge({ convocs, onClick }) {
  if (!convocs) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--sl-t3)] hover:text-[var(--sl-t2)] transition-colors"
    >
      <span className="text-emerald-400">✓ {convocs.accepted}</span>
      {convocs.pending > 0 && <span className="text-amber-400">⏳ {convocs.pending}</span>}
      {convocs.declined > 0 && <span className="text-red-400">✕ {convocs.declined}</span>}
      <span className="opacity-50">›</span>
    </button>
  );
}

export default function MatchPlanningCard({
  item,
  userId,
  club,
  onOpenPoster,
  onConvocate,
  onOpenRides,
  showClubBadge = false,
}) {
  const [showList, setShowList] = useState(false);

  const typeColor = TYPE_COLORS[item.event_type] ?? '#64748b';
  const typeLabel = TYPE_LABELS[item.event_type] ?? item.event_type;
  const isStaff   = item.isStaffClub;
  const isPlayer  = item.isPlayerClub;

  const clubName  = club?.name ?? 'FC';
  const oppName   = item.adversaire || '?';
  const homeLabel = item.home_or_away === 'home' ? clubName : oppName;
  const awayLabel = item.home_or_away === 'home' ? oppName  : clubName;
  const timeStr   = item.time
    ? item.time
    : null;

  return (
    <>
      <motion.div
        layout
        className="bg-[var(--sl-card)] rounded-2xl overflow-hidden border border-[var(--sl-border)]"
        style={{ borderLeftWidth: 3, borderLeftColor: typeColor }}
      >
        <div className="p-3.5">
          {/* Header badges */}
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span
              className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
              style={{ background: `${typeColor}22`, color: typeColor }}
            >
              {typeLabel}
            </span>
            {item.level && (
              <span className="text-[9px] font-semibold text-[var(--sl-t3)]">{item.level}</span>
            )}
            {isStaff && (
              <span className="text-[9px] font-black tracking-[0.12em] uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 ml-auto">
                Rôle Staff
              </span>
            )}
            {showClubBadge && club && (
              <span className="text-[9px] font-semibold text-[var(--sl-t3)] ml-auto truncate max-w-[100px]">
                {club.name}
              </span>
            )}
          </div>

          {/* Équipes */}
          <div className="flex items-center gap-3 mb-2.5">
            <TeamBadge name={homeLabel} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-[var(--sl-t1)] leading-tight">
                {homeLabel} <span className="font-normal text-[var(--sl-t3)]">vs</span> {awayLabel}
              </p>
              {item.location && (
                <p className="text-xs text-[var(--sl-t3)] truncate mt-0.5">📍 {item.location}</p>
              )}
              {timeStr && (
                <p className="text-xs font-semibold text-[var(--sl-t2)] mt-0.5">{timeStr}</p>
              )}
            </div>
            <TeamBadge name={awayLabel} />
          </div>

          {/* Score si passé */}
          {item.score && (
            <div className="flex justify-center mb-3">
              <span className="text-lg font-black text-[var(--sl-t1)]">
                {item.score.home} – {item.score.away}
              </span>
            </div>
          )}

          {/* Convocations staff */}
          {isStaff && item.convocs && (
            <div className="mb-3">
              <ConvocBadge convocs={item.convocs} onClick={() => setShowList(true)} />
            </div>
          )}

          {/* Compteurs présence (pour joueurs) */}
          {isPlayer && (item.presentCount > 0 || item.absentCount > 0) && (
            <button
              onClick={() => setShowList(true)}
              className="flex items-center gap-2 mb-3 text-[10px] font-semibold text-[var(--sl-t3)] hover:text-[var(--sl-t2)] transition-colors"
            >
              {item.presentCount > 0 && <span className="text-emerald-400">✓ {item.presentCount}</span>}
              {item.absentCount  > 0 && <span className="text-red-400">✕ {item.absentCount}</span>}
              {item.unsureCount  > 0 && <span className="text-slate-400">? {item.unsureCount}</span>}
              <span className="opacity-50">›</span>
            </button>
          )}

          {/* Vue supporter : groupe convoqué (lecture) */}
          {item.isSupporter && item.convocs?.accepted > 0 && (
            <button
              onClick={() => setShowList(true)}
              className="w-full text-xs font-semibold text-[var(--sl-t2)] py-2 rounded-xl bg-[var(--sl-surface)] hover:bg-[var(--sl-hover)] transition-colors mb-3"
            >
              👥 {item.convocs.accepted} joueur{item.convocs.accepted > 1 ? 's' : ''} convoqué{item.convocs.accepted > 1 ? 's' : ''}
            </button>
          )}

          {/* Boutons présence joueur/parent */}
          {isPlayer && (
            <PresenceButtons
              myStatus={item.myStatus}
              onRespond={(status) => item.onRespond?.('match', item.id, status)}
              size="sm"
            />
          )}

          {/* Actions staff */}
          {isStaff && !item.score && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onConvocate?.(item)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-black bg-amber-400 dark:bg-amber-500 hover:opacity-90 transition-opacity"
              >
                <span>📣</span> Convoquer l'équipe
              </button>
              <button
                onClick={() => onOpenPoster?.({ event: item, club })}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:opacity-90 transition-opacity"
              >
                <span>🎨</span> Créer l'affiche
              </button>
            </div>
          )}

          {/* Post-match : affiche résultat */}
          {isStaff && item.score && (
            <button
              onClick={() => onOpenPoster?.({ event: item, club, score: item.score })}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:opacity-90 transition-opacity"
            >
              🎨 Créer l'affiche résultat
            </button>
          )}

          {/* Covoiturage inline si présent */}
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
