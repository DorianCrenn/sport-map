import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useTrainingAttendance } from '../../hooks/useTrainingAttendance.js';
import { useMatchAttendance }    from '../../hooks/useMatchAttendance.js';

const STATUS_CONFIG = {
  present: { label: 'Présents',   dot: '#22d96a', badge: 'bg-emerald-500/20 text-emerald-400' },
  absent:  { label: 'Absents',    dot: '#ef4444', badge: 'bg-red-500/20 text-red-400' },
  unsure:  { label: 'Incertains', dot: '#94a3b8', badge: 'bg-slate-500/20 text-slate-400' },
};

function Avatar({ name, avatarUrl }) {
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return avatarUrl
    ? <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    : (
      <div className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-[var(--sl-t2)]">{initials}</span>
      </div>
    );
}

function Section({ status, records }) {
  if (!records.length) return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-4">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
        <span className="text-[10px] font-black tracking-[0.12em] uppercase text-[var(--sl-t3)]">
          {cfg.label} ({records.length})
        </span>
      </div>
      <div className="space-y-px">
        {records.map((r, i) => {
          const name = r.profiles?.name ?? r.player_name ?? '—';
          const avatarUrl = r.profiles?.avatar_url ?? null;
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sl-hover)] transition-colors">
              <Avatar name={name} avatarUrl={avatarUrl} />
              <span className="flex-1 text-sm font-medium text-[var(--sl-t1)] truncate">{name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {status === 'present' ? '✓' : status === 'absent' ? '✕' : '?'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrainingSheet({ sessionId, userId, onClose }) {
  const { attendance, counts } = useTrainingAttendance(sessionId, userId);
  const byStatus = {
    present: attendance.filter(a => a.status === 'present'),
    absent:  attendance.filter(a => a.status === 'absent'),
    unsure:  attendance.filter(a => a.status === 'unsure'),
  };
  return <SheetContent title="Présences entraînement" counts={counts} byStatus={byStatus} onClose={onClose} />;
}

function MatchSheet({ eventId, userId, onClose }) {
  const { attendance, counts } = useMatchAttendance(eventId, userId);
  const byStatus = {
    present: attendance.filter(a => a.status === 'present'),
    absent:  attendance.filter(a => a.status === 'absent'),
    unsure:  attendance.filter(a => a.status === 'unsure'),
  };
  return <SheetContent title="Présences match" counts={counts} byStatus={byStatus} onClose={onClose} />;
}

function SheetContent({ title, counts, byStatus, onClose }) {
  return (
    <>
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 rounded-full bg-[var(--sl-border)]" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-[var(--sl-border)]">
        <div>
          <h2 className="font-bold text-[var(--sl-t1)] text-base">{title}</h2>
          <p className="text-xs text-[var(--sl-t3)] mt-0.5">
            {counts.present} présent{counts.present > 1 ? 's' : ''} · {counts.absent} absent{counts.absent > 1 ? 's' : ''} · {counts.unsure} incertain{counts.unsure > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)]"
        >
          ✕
        </button>
      </div>

      {/* Lists */}
      <div className="overflow-y-auto flex-1 pt-3 pb-8">
        <Section status="present" records={byStatus.present} />
        <Section status="absent"  records={byStatus.absent}  />
        <Section status="unsure"  records={byStatus.unsure}  />
        {!byStatus.present.length && !byStatus.absent.length && !byStatus.unsure.length && (
          <p className="text-center text-sm text-[var(--sl-t3)] py-8">Aucune réponse pour l'instant.</p>
        )}
      </div>
    </>
  );
}

export default function AttendanceListSheet({ open, onClose, type, id, userId }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--sl-card)] rounded-t-2xl flex flex-col max-h-[75vh]"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
          >
            {type === 'training'
              ? <TrainingSheet sessionId={id} userId={userId} onClose={onClose} />
              : <MatchSheet    eventId={id}   userId={userId} onClose={onClose} />
            }
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
