import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EventFormStepConvocation = lazy(() => import('./EventFormStepConvocation.jsx'));

interface EventFormSuccessScreenProps {
  createdEvent: Record<string, any>;
  onOpenPoster?: (event: Record<string, any>) => void;
  onClose: () => void;
  isCoach?: boolean;
}

export default function EventFormSuccessScreen({ createdEvent, onOpenPoster, onClose, isCoach = false }: EventFormSuccessScreenProps) {
  const [showConvocation, setShowConvocation] = useState(false);
  const isMatchEvent = createdEvent?.eventType !== 'tournament' && !createdEvent?.isTraining;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          borderRadius: 'inherit',
          backgroundColor: 'var(--sl-card)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 18, padding: '32px 28px', textAlign: 'center',
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

        {((isCoach && isMatchEvent) || onOpenPoster) && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--sl-t3)', margin: 0 }}>
              Et maintenant ?
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: (isCoach && isMatchEvent && onOpenPoster) ? '1fr 1fr' : '1fr',
              gap: 10, width: '100%', maxWidth: 340,
            }}>
              {isCoach && isMatchEvent && (
                <button
                  data-demo="convocation-popup-btn"
                  onClick={() => setShowConvocation(true)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '14px 12px', borderRadius: 'var(--sl-radius-3xl)', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white', fontSize: 13, fontWeight: 800,
                    boxShadow: '0 6px 20px rgba(99,102,241,0.30)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Convoquer
                </button>
              )}
              {onOpenPoster && (
                <button
                  onClick={() => { onOpenPoster(createdEvent); onClose(); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '14px 12px', borderRadius: 'var(--sl-radius-3xl)', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    color: 'white', fontSize: 13, fontWeight: 800,
                    boxShadow: '0 6px 20px rgba(124,58,237,0.28)',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                  Créer l'affiche
                </button>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          style={{
            padding: '11px 28px', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer',
            border: '1px solid var(--sl-border)', backgroundColor: 'transparent',
            color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600,
          }}
        >
          Fermer
        </button>
      </motion.div>

      <AnimatePresence>
        {showConvocation && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{ position: 'absolute', inset: 0, zIndex: 30, borderRadius: 'inherit', backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column' }}
          >
            <Suspense fallback={null}>
              <EventFormStepConvocation
                event={createdEvent}
                onDone={onClose}
                onClose={() => setShowConvocation(false)}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
