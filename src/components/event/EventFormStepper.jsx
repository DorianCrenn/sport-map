import { AnimatePresence, motion } from 'framer-motion';

const STEPS = ['Type', 'Équipe', 'Quand & Où'];

export default function EventFormStepper({ step, setStep, setStepDir }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px 12px', gap: 0 }}>
      {STEPS.map((label, i) => (
        <AnimatePresence key={i} mode="wait">
          <>
            <button
              type="button"
              onClick={() => { if (i + 1 < step) { setStepDir(-1); setStep(i + 1); } }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', padding: 0,
                cursor: i + 1 < step ? 'pointer' : 'default',
              }}
              aria-label={`Étape ${i + 1} : ${label}${i + 1 < step ? ' (revenir)' : ''}`}
            >
              <motion.div
                animate={{
                  backgroundColor: i + 1 < step ? 'var(--sl-green)' : i + 1 === step ? '#6366f1' : 'var(--sl-surface)',
                  borderColor: i + 1 <= step ? (i + 1 < step ? 'var(--sl-green)' : '#6366f1') : 'var(--sl-border)',
                }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: '2px solid',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  color: i + 1 <= step ? '#fff' : 'var(--sl-t3)',
                }}
              >
                {i + 1 < step
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : i + 1}
              </motion.div>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                color: i + 1 === step ? '#6366f1' : i + 1 < step ? 'var(--sl-green)' : 'var(--sl-t3)',
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </button>
            {i < 2 && (
              <motion.div
                animate={{ backgroundColor: i + 1 < step ? 'var(--sl-green)' : 'var(--sl-border)' }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1, height: 2, margin: '0 6px 14px' }}
              />
            )}
          </>
        </AnimatePresence>
      ))}
    </div>
  );
}
