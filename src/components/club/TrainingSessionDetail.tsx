import { useState } from 'react';
import { useTrainingAttendance } from '../../hooks/useTrainingAttendance.js';
import SendTrainingMessageModal from './SendTrainingMessageModal.jsx';

const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  present: { label: 'Présent',   emoji: '✅', color: '#22c55e', bg: '#f0fdf4' },
  absent:  { label: 'Absent',    emoji: '❌', color: '#ef4444', bg: '#fef2f2' },
  unsure:  { label: 'Peut-être', emoji: '🤔', color: '#f97316', bg: '#fff7ed' },
};

const MSG_COLORS: Record<string, string> = { info: '#3b82f6', urgent: '#ef4444', cancelled: '#ef4444', rescheduled: '#f97316' };
const MSG_EMOJIS: Record<string, string> = { info: 'ℹ️', urgent: '🚨', cancelled: '❌', rescheduled: '🕐' };

interface TrainingSessionDetailProps {
  session: Record<string, any> | null;
  clubId?: string | number;
  currentUser?: Record<string, any> | null;
  isManager?: boolean;
  onClose?: () => void;
}

export default function TrainingSessionDetail({ session, clubId, currentUser, isManager, onClose }: TrainingSessionDetailProps) {
  const { attendance, counts, myStatus, messages, respond, sendMessage } = useTrainingAttendance(
    session?.id,
    currentUser?.id
  ) as any;
  const [showMsgModal, setShowMsgModal] = useState(false);

  if (!session) return null;

  const dateLabel = session.date
    ? new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(session.date))
    : '';

  const statusCancelled = session.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-lg overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-base font-poppins capitalize" style={{ color: '#0F1E3A' }}>{dateLabel}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {session.time ?? ''}{session.location ? ` · ${session.location}` : ''}
              </p>
            </div>
            {statusCancelled && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-100 text-red-600">Annulé</span>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
              <div key={s} className="flex-1 rounded-xl py-2 text-center" style={{ backgroundColor: cfg.bg }}>
                <p className="text-lg font-bold font-poppins" style={{ color: cfg.color }}>{counts[s] ?? 0}</p>
                <p className="text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
              </div>
            ))}
          </div>
        </div>

        {currentUser && !statusCancelled && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Ma présence</p>
            <div className="flex gap-2">
              {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                <button key={s} onClick={() => respond(s)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                  style={myStatus === s ? { borderColor: cfg.color, backgroundColor: cfg.bg } : { borderColor: '#e5e7eb' }}>
                  <span className="text-xl">{cfg.emoji}</span>
                  <span className="text-[10px] font-semibold" style={{ color: myStatus === s ? cfg.color : '#9ca3af' }}>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Messages</p>
            <div className="space-y-2">
              {messages.map((m: any) => (
                <div key={m.id} className="flex gap-3 p-3 rounded-xl" style={{ backgroundColor: `${MSG_COLORS[m.type]}10`, borderLeft: `3px solid ${MSG_COLORS[m.type]}` }}>
                  <span className="text-base flex-shrink-0">{MSG_EMOJIS[m.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#0F1E3A' }}>{m.content}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {m.profiles?.name ?? 'Staff'} · {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {attendance.filter(a => a.status === 'present').length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Présents ({counts.present})</p>
            <div className="flex flex-wrap gap-2">
              {attendance.filter(a => a.status === 'present').map(a => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50">
                  {a.profiles?.avatar_url
                    ? <img src={a.profiles.avatar_url} className="w-5 h-5 rounded-full object-cover" alt={a.profiles?.name ?? ''} />
                    : <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-[9px] font-bold text-green-700">{a.profiles?.name?.slice(0, 1) ?? '?'}</div>
                  }
                  <span className="text-xs font-semibold text-green-700">{a.profiles?.name ?? 'Anonyme'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 pt-5 space-y-2" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
          {isManager && (
            <button onClick={() => setShowMsgModal(true)} className="w-full py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#0F1E3A' }}>
              <span>📣</span> Envoyer un message aux participants
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-500">
            Fermer
          </button>
        </div>
      </div>

      {showMsgModal && (
        <SendTrainingMessageModal
          session={session}
          clubId={clubId}
          userId={currentUser?.id}
          onSend={sendMessage}
          onClose={() => setShowMsgModal(false)}
        />
      )}
    </div>
  );
}
