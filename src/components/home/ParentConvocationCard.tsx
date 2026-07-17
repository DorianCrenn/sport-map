import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';

type Phase = 'idle' | 'absent_reason' | 'transport_choice' | 'drive_seats';

interface Convocation {
  id: string | number;
  event?: Record<string, any> | null;
  player?: { name?: string | null } | null;
}

interface ParentConvocationCardProps {
  convocation: Convocation;
  onDismiss: (id: string | number) => void;
  onRespond: (id: string | number, status: string, reason?: string | null, transport?: string, seats?: number) => Promise<void>;
}

export default function ParentConvocationCard({ convocation, onDismiss, onRespond }: ParentConvocationCardProps) {
  const { toast } = useToast();
  const [phase, setPhase]   = useState<Phase>('idle');
  const [reason, setReason] = useState('');
  const [seats,  setSeats]  = useState(3);
  const [busy,   setBusy]   = useState(false);

  const { id, event, player } = convocation;

  const eventDate = event?.date
    ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  async function handleAbsentConfirm() {
    setBusy(true);
    await onRespond(id, 'declined', reason || null);
    toast({ message: 'Absence enregistrée', type: 'info' });
    onDismiss(id);
  }

  async function handleDriveConfirm() {
    setBusy(true);
    await onRespond(id, 'accepted', null, 'driving', seats);
    toast({ message: `Trajet ajouté · ${seats} place${seats > 1 ? 's' : ''}` });
    onDismiss(id);
  }

  async function handlePassenger() {
    setBusy(true);
    await onRespond(id, 'accepted', null, 'passenger');
    toast({ message: "En attente d'un chauffeur", type: 'info' });
    onDismiss(id);
  }

  async function handleOwnMeans() {
    setBusy(true);
    await onRespond(id, 'accepted');
    toast({ message: 'Présence confirmée' });
    onDismiss(id);
  }

  return (
    <div style={{ borderRadius: 'var(--sl-radius-3xl)', background: 'var(--sl-card)', border: '1px solid rgba(99,102,241,0.22)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          📋
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Convocation</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', margin: 0, lineHeight: 1.3 }}>
            {player?.name ?? 'Joueur'}{event?.team_name ? ` — ${event.team_name}` : ''}
          </p>
          <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '3px 0 0' }}>
            {event?.adversaire ? `vs ${event.adversaire}` : ''}{eventDate ? ` · ${eventDate}` : ''}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 16px 14px' }}>
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} style={{ display: 'flex', gap: 8 }}>
              <button data-testid="convoc-absent" onClick={() => setPhase('absent_reason')} style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Absent</button>
              <button data-testid="convoc-present" data-demo="convocation-respond" onClick={() => setPhase('transport_choice')} style={{ flex: 2, padding: '10px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>Présent ✓</button>
            </motion.div>
          )}

          {phase === 'absent_reason' && (
            <motion.div key="absent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Raison de l'absence (optionnel)" autoFocus
                onKeyDown={e => e.key === 'Enter' && !busy && handleAbsentConfirm()}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button data-testid="convoc-cancel-absent" onClick={() => setPhase('idle')} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', background: 'none', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                <button data-testid="convoc-confirm-absent" onClick={handleAbsentConfirm} disabled={busy} style={{ flex: 2, padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Envoi…' : "Confirmer l'absence"}</button>
              </div>
            </motion.div>
          )}

          {phase === 'transport_choice' && (
            <motion.div key="transport" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--sl-t3)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 2px' }}>Transport pour {player?.name ?? 'le joueur'}</p>
              <button data-testid="convoc-drive" onClick={() => setPhase('drive_seats')} style={{ padding: '12px 14px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', border: '1px solid rgba(34,217,106,0.22)', background: 'rgba(34,217,106,0.07)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>🚗</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>Je conduis</div><div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Ajoute des places disponibles pour les autres</div></div>
              </button>
              <button data-testid="convoc-passenger" onClick={handlePassenger} disabled={busy} style={{ padding: '12px 14px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', border: '1px solid rgba(77,166,255,0.18)', background: 'rgba(77,166,255,0.05)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, opacity: busy ? 0.6 : 1 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>🙋</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>Je cherche une place</div><div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Vous serez mis en attente de covoiturage</div></div>
              </button>
              <button data-testid="convoc-own-means" onClick={handleOwnMeans} disabled={busy} style={{ padding: '12px 14px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', border: '1px solid var(--sl-border)', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, opacity: busy ? 0.6 : 1 }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>🏡</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t2)' }}>Par mes propres moyens</div><div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Je n'ai pas besoin de transport</div></div>
              </button>
              <button data-testid="convoc-back-transport" onClick={() => setPhase('idle')} style={{ padding: '6px 0', background: 'none', border: 'none', color: 'var(--sl-t3)', fontSize: 12, cursor: 'pointer' }}>← Retour</button>
            </motion.div>
          )}

          {phase === 'drive_seats' && (
            <motion.div key="drive_seats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)', margin: 0 }}>Combien de places disponibles ?</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', padding: '8px 0' }}>
                <button data-testid="convoc-seats-minus" onClick={() => setSeats(s => Math.max(1, s - 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--sl-t1)', minWidth: 44, textAlign: 'center' }}>{seats}</span>
                <button data-testid="convoc-seats-plus" onClick={() => setSeats(s => Math.min(8, s + 1))} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPhase('transport_choice')} style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', background: 'none', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Retour</button>
                <button data-testid="convoc-drive-validate" onClick={handleDriveConfirm} disabled={busy} style={{ flex: 2, padding: '10px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', background: '#22d96a', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>{busy ? 'Envoi…' : `Valider · ${seats} place${seats > 1 ? 's' : ''}`}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
