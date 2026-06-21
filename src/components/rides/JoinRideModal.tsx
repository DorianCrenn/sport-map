import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import { useScrollInputIntoView } from '../../hooks/useScrollInputIntoView.js';
import { motion } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';

interface Ride {
  id: string | number;
  departureLocation: string;
  driverName?: string | null;
  availableSeatsLeft: number;
}

interface JoinRideModalProps {
  ride: Ride;
  onSave: (message: string | null) => Promise<void>;
  onClose: () => void;
}

export default function JoinRideModal({ ride, onSave, onClose }: JoinRideModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any);
  useAndroidBack(true, onClose);
  useScrollInputIntoView(panelRef as any);
  const [message, setMessage] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(message.trim() || null);
    } catch (err: any) {
      setError(err?.message ?? 'Erreur');
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: (Z as any).formModal, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog" aria-modal="true" aria-label="Rejoindre ce trajet"
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
        style={{ width: '100%', maxWidth: 400, borderRadius: 22, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 20px 14px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>🚗 Rejoindre ce trajet</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--sl-t2)' }}><span style={{ color: 'var(--sl-t3)' }}>Départ · </span><strong>{ride.departureLocation}</strong></div>
            <div style={{ fontSize: 12, color: 'var(--sl-t2)' }}><span style={{ color: 'var(--sl-t3)' }}>Conducteur · </span><strong>{ride.driverName}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(34,217,106,0.12)', color: 'var(--sl-green)' }}>{ride.availableSeatsLeft} place{ride.availableSeatsLeft !== 1 ? 's' : ''} libre{ride.availableSeatsLeft !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 6 }}>Message au conducteur (optionnel)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="ex. Je serai devant l'entrée principale, je préférerais partir à 14h…" rows={3} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, padding: '10px 12px', fontSize: 13, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-t1)', resize: 'none', outline: 'none' }} />
            {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6, fontWeight: 600 }}>{error}</p>}
            <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 8, lineHeight: 1.5 }}>Le conducteur recevra votre demande et pourra l'accepter ou la refuser. Le paiement se règle directement entre vous.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 20px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px 0', borderRadius: 14, border: 'none', backgroundColor: saving ? 'var(--sl-surface)' : 'var(--sl-green)', color: saving ? 'var(--sl-t3)' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 12px rgba(34,217,106,0.3)' }}>{saving ? 'Envoi…' : 'Demander à rejoindre'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
