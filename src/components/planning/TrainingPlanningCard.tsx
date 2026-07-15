import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceButtons     from './PresenceButtons.jsx';
import CarpoolSection      from './CarpoolSection.jsx';
import AttendanceListSheet from './AttendanceListSheet.jsx';
import { isEventPast }     from '../../lib/eventTime.js';

const ACCENT = '#8b5cf6';

interface TeamRow { sessionId: string; teamId: string | null; teamName: string; presentCount: number; absentCount: number; unsureCount: number; myStatus: string | null; }

interface TrainingItem {
  id: string | number;
  type: string;
  date?: string | null;
  time?: string | null;
  title?: string | null;
  location?: string | null;
  status?: string | null;
  presentCount?: number;
  absentCount?: number;
  unsureCount?: number;
  isPlayerClub?: boolean;
  isStaffClub?: boolean;
  isGuardian?: boolean;
  childPlayerName?: string;
  childPlayerId?: string;
  myStatus?: string | null;
  onRespond?: (type: string, id: string | number, status: string, playerId?: string | null) => void;
  teams?: TeamRow[];
}

interface TrainingPlanningCardProps {
  item: TrainingItem;
  userId?: string | null;
  isStaff?: boolean;
  onOpenRides?: () => void;
}

export default function TrainingPlanningCard({ item, userId, isStaff, onOpenRides }: TrainingPlanningCardProps) {
  const [showListSessionId, setShowListSessionId] = useState<string | null>(null);
  const past = isEventPast(item as any); // entraînement passé → présence figée, covoit masqué

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl overflow-hidden bg-[var(--sl-card)] border border-[var(--sl-border)]"
        style={{ borderLeftWidth: 3, borderLeftColor: ACCENT }}
      >
        <div className="p-4">
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

          <h3 className="text-base font-black text-[var(--sl-t1)] mb-1 leading-tight uppercase tracking-wide">
            {item.title}
          </h3>

          {item.location && (
            <p className="text-xs text-[var(--sl-t3)] mb-3">{item.location}</p>
          )}

          {isStaff && item.teams && item.teams.length > 1 ? (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">Présence par équipe</p>
              <div className="flex flex-col gap-1.5">
                {item.teams.map(team => (
                  <button
                    key={team.sessionId}
                    onClick={() => setShowListSessionId(team.sessionId)}
                    className="w-full cursor-pointer rounded-xl bg-[var(--sl-surface)] px-3 py-2 hover:bg-[var(--sl-hover)] transition-colors text-left"
                  >
                    <p className="text-[10px] font-black text-[var(--sl-t2)] mb-1">{team.teamName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      {team.presentCount > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Présent</span><span className="font-black text-emerald-400">{team.presentCount}</span></div>}
                      {team.absentCount  > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Absent</span><span className="font-black text-red-400">{team.absentCount}</span></div>}
                      {team.unsureCount  > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Incertain</span><span className="font-black text-slate-400">{team.unsureCount}</span></div>}
                      <span className="ml-auto text-[var(--sl-t3)] text-[10px]">›</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : ((item.presentCount ?? 0) > 0 || (item.absentCount ?? 0) > 0 || (item.unsureCount ?? 0) > 0) ? (
            <div className="mb-3">
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">Présence</p>
              <button
                onClick={isStaff ? () => setShowListSessionId(String(item.id)) : undefined}
                className={`w-full ${isStaff ? 'cursor-pointer hover:bg-[var(--sl-hover)]' : 'cursor-default'} rounded-xl bg-[var(--sl-surface)] px-3 py-2 transition-colors`}
              >
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {(item.presentCount ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Présent</span><span className="font-black text-emerald-400">{item.presentCount}</span></div>}
                  {(item.absentCount  ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Absent</span><span className="font-black text-red-400">{item.absentCount}</span></div>}
                  {(item.unsureCount  ?? 0) > 0 && <div className="flex items-center gap-1.5"><span className="font-semibold text-[var(--sl-t3)]">Incertain</span><span className="font-black text-slate-400">{item.unsureCount}</span></div>}
                  {isStaff && <span className="ml-auto text-[var(--sl-t3)] text-[10px]">›</span>}
                </div>
              </button>
            </div>
          ) : null}

          {(item.isPlayerClub || item.isGuardian) && (
            <div>
              <p className="text-[9px] font-black tracking-[0.14em] uppercase text-[var(--sl-t3)] mb-1.5">
                {item.isGuardian && item.childPlayerName
                  ? `Pour ${item.childPlayerName}`
                  : 'Joueur'}
              </p>
              <PresenceButtons
                myStatus={item.myStatus}
                onRespond={status => item.onRespond?.(
                  'training',
                  item.id,
                  status,
                  item.isGuardian ? item.childPlayerId : undefined,
                )}
                disabled={past}
                size="sm"
              />
            </div>
          )}

          <AnimatePresence>
            {!past && (item.isStaffClub || item.myStatus === 'present') && (
              <CarpoolSection eventId={item.id} myStatus={item.myStatus} isStaff={item.isStaffClub} onOpenRides={onOpenRides} event={item as any} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AttendanceListSheet
        open={!!showListSessionId}
        onClose={() => setShowListSessionId(null)}
        type="training"
        id={showListSessionId ?? item.id}
        userId={userId}
      />
    </>
  );
}
