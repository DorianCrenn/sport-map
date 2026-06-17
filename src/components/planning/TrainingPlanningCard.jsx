import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceButtons    from './PresenceButtons.jsx';
import CarpoolSection     from './CarpoolSection.jsx';
import AttendanceListSheet from './AttendanceListSheet.jsx';

const TYPE_COLOR = '#8b5cf6'; // violet — entraînement

function CountBadge({ presentCount, absentCount, unsureCount, onClick }) {
  if (!presentCount && !absentCount && !unsureCount) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-[10px] font-semibold text-[var(--sl-t3)] hover:text-[var(--sl-t2)] transition-colors select-none"
    >
      {presentCount > 0 && <span className="text-emerald-400">✓ {presentCount}</span>}
      {absentCount  > 0 && <span className="text-red-400">✕ {absentCount}</span>}
      {unsureCount  > 0 && <span className="text-slate-400">? {unsureCount}</span>}
      <span className="opacity-50">›</span>
    </button>
  );
}

export default function TrainingPlanningCard({ item, userId, onOpenRides }) {
  const [showList, setShowList] = useState(false);
  const isStaff = item.isStaffClub;

  return (
    <>
      <motion.div
        layout
        className="bg-[var(--sl-card)] rounded-2xl overflow-hidden border border-[var(--sl-border)]"
        style={{ borderLeftWidth: 3, borderLeftColor: TYPE_COLOR }}
      >
        <div className="p-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-black tracking-[0.15em] uppercase px-2 py-0.5 rounded-full"
                  style={{ background: `${TYPE_COLOR}22`, color: TYPE_COLOR }}
                >
                  Entraînement
                </span>
                {item.status === 'rescheduled' && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                    Reporté
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[var(--sl-t1)] truncate">{item.title}</h3>
              {item.time && (
                <p className="text-xs text-[var(--sl-t3)] mt-0.5">{item.time}</p>
              )}
            </div>
          </div>

          {/* Lieu */}
          {item.location && (
            <p className="text-xs text-[var(--sl-t3)] mb-3 truncate">📍 {item.location}</p>
          )}

          {/* Compteur présences (cliquable pour staff) */}
          {(isStaff || item.presentCount > 0 || item.absentCount > 0) && (
            <div className="mb-3">
              <CountBadge
                presentCount={item.presentCount}
                absentCount={item.absentCount}
                unsureCount={item.unsureCount}
                onClick={isStaff ? () => setShowList(true) : undefined}
              />
            </div>
          )}

          {/* Boutons présence (si joueur/parent — pas pur staff sans équipe) */}
          {item.isPlayerClub && (
            <PresenceButtons
              myStatus={item.myStatus}
              onRespond={(status) => item.onRespond?.('training', item.id, status)}
              size="sm"
            />
          )}

          {/* Covoiturage inline */}
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
        type="training"
        id={item.id}
        userId={userId}
      />
    </>
  );
}
