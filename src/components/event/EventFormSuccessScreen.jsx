import { motion } from 'framer-motion';

export default function EventFormSuccessScreen({ createdEvent, onOpenPoster, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        borderRadius: 'inherit',
        backgroundColor: 'var(--sl-card)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 22, padding: '32px 28px', textAlign: 'center',
      }}
    >
      <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: 'rgba(34,217,106,0.12)', border: '1.5px solid rgba(34,217,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--sl-t1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Événement créé !
        </div>
        <div style={{ fontSize: 13, color: 'var(--sl-t3)', lineHeight: 1.5, maxWidth: 290 }}>
          {createdEvent.title || 'Votre événement est en ligne.'}
        </div>
      </div>
      {onOpenPoster && (
        <button
          onClick={() => { onOpenPoster(createdEvent); onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 16, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white', fontSize: 15, fontWeight: 800,
            boxShadow: '0 8px 24px rgba(99,102,241,0.32)',
            width: '100%', maxWidth: 310,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          Générer l'affiche
        </button>
      )}
      <button
        onClick={onClose}
        style={{
          padding: '11px 28px', borderRadius: 12, cursor: 'pointer',
          border: '1px solid var(--sl-border)', backgroundColor: 'transparent',
          color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600,
        }}
      >
        Fermer
      </button>
    </motion.div>
  );
}
