import { useState } from 'react';
import { useNextTraining } from '../hooks/useNextTraining.js';
import SendTrainingMessageModal from './club/SendTrainingMessageModal.jsx';

const STATUS_CONFIG = {
  present: { label: 'Présent',   emoji: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  absent:  { label: 'Absent',    emoji: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  unsure:  { label: 'Peut-être', emoji: '🤔', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
};

export default function NextTrainingCard({ currentUser, onNavigateClubs }) {
  const clubId    = currentUser?.clubId ?? null;
  const isManager = ['club_admin', 'admin', 'superadmin'].includes(currentUser?.role);
  const { session, counts, myStatus, loading, respond, sendMessage } = useNextTraining(clubId, currentUser?.id);
  const [showMsgModal, setShowMsgModal] = useState(false);

  if (!clubId || loading || !session) return null;

  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(session.date + 'T12:00:00'));

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--sl-border)', background: 'var(--sl-card)',
      marginBottom: 12,
    }}>
      <div style={{ height: 3, background: 'linear-gradient(to right, #6366f1, #4f46e5)' }} />

      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.15em',
            textTransform: 'uppercase', color: '#6366f1',
          }}>
            🏋️ Prochain entraînement
          </span>
          {onNavigateClubs && (
            <button
              onClick={onNavigateClubs}
              style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Tout voir →
            </button>
          )}
        </div>

        <p style={{
          fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)',
          margin: '6px 0 2px', textTransform: 'capitalize',
        }}>
          {dateLabel}
        </p>

        <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {session.time && <span>{session.time}</span>}
          {session.time && session.location && <span>·</span>}
          {session.location && <span>{session.location}</span>}
        </p>

        {/* Manager view — attendance counters + send message */}
        {isManager && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                <div key={s} style={{
                  flex: 1, textAlign: 'center', borderRadius: 10,
                  padding: '6px 4px', backgroundColor: cfg.bg,
                }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: cfg.color, lineHeight: 1.1, margin: 0 }}>
                    {counts[s] ?? 0}
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 700, color: cfg.color, margin: 0 }}>
                    {cfg.label}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMsgModal(true)}
              style={{
                width: '100%', padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: 'var(--sl-surface)', color: 'var(--sl-t1)',
                border: '1px solid var(--sl-border)', cursor: 'pointer',
                display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center',
              }}
            >
              📣 Envoyer un message
            </button>
          </div>
        )}

        {/* Player view — inline response buttons */}
        {!isManager && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
              <button
                key={s}
                onClick={() => respond(s)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                  border: `1.5px solid ${myStatus === s ? cfg.color : 'var(--sl-border)'}`,
                  backgroundColor: myStatus === s ? cfg.bg : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: myStatus === s ? cfg.color : 'var(--sl-t3)' }}>
                  {cfg.label}
                </span>
              </button>
            ))}
          </div>
        )}
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
