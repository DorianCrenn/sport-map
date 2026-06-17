import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceButtons     from './PresenceButtons.jsx';
import CarpoolSection      from './CarpoolSection.jsx';
import AttendanceListSheet from './AttendanceListSheet.jsx';

const ACCENT = '#8b5cf6'; // violet — entraînement

export default function TrainingPlanningCard({ item, userId, isStaff, onOpenRides }) {
  const [showList, setShowList] = useState(false);

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl overflow-hidden bg-[var(--sl-card)] border border-[var(--sl-border)]"
        style={{ borderLeftWidth: 3, borderLeftColor: ACCENT }}
      >
        <div className="p-4">

          {/* ── Ligne 1 : badge + heure ────────────────────────────── */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[9px] font-black tracking-[0.14em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${ACCENT}25`, color: ACCENT }}
            >
              Entraînement
            </span>
            <div className="flex items-center gap-2">
              {item.status === 'rescheduled' && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  Reporté
                </span>
              )}
              {item.time && (
                <span className="text-sm font-black text-[var(--sl-t1)]">{item.time}</span>
              )}
            </div>
          </div>

          {/* ── Titre ─────────────────────────────────────────────── */}
          <h3 className="text-base font-black text-[var(--sl-t1)] mb-1 leading-tight uppercase tracking-wide">
            {item.title}
          </h3>

          {/* ── Lieu ──────────────────────────────────────────────── */}
          {item.location && (
            <p className="text-xs text-[var(--sl-t3)] mb-3">{item.location}</p>
          )}

          {/* ── PRÉSENCE ─────────────────────────────────────────── */}
          {(item.presentCount > 0 || item.absentCount > 0 || item.unsureCount > 0) && (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">
                Présence
              </p>
              <button
                onClick={isStaff ? () => setShowList(true) : undefined}
                className={`w-full ${isStaff ? 'cursor-pointer hover:bg-[var(--sl-hover)]' : 'cursor-default'} rounded-xl bg-[var(--sl-surface)] px-3 py-2 transition-colors`}
              >
                <div className="flex gap-4 text-xs">
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
                  {isStaff && (
                    <span className="ml-auto text-[var(--sl-t3)] text-[10px]">›</span>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* ── JOUEUR — boutons présence ─────────────────────────── */}
          {item.isPlayerClub && (
            <div>
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">
                Joueur
              </p>
              <PresenceButtons
                myStatus={item.myStatus}
                onRespond={status => item.onRespond?.('training', item.id, status)}
                size="sm"
              />
            </div>
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
        type="training"
        id={item.id}
        userId={userId}
      />
    </>
  );
}
