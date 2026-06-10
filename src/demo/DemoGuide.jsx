import { useState } from 'react';
import { motion } from 'framer-motion';
import { trackCreateAccountClicked } from './demoAnalytics.js';

export default function DemoGuide({ step, stepIndex, totalSteps, onNext, onPrev, onExit }) {
  const [confirmExit, setConfirmExit] = useState(false);
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  function handleExit() {
    if (confirmExit) {
      onExit();
    } else {
      setConfirmExit(true);
      setTimeout(() => setConfirmExit(false), 3000);
    }
  }

  function handleCreateAccount() {
    trackCreateAccountClicked('guide-cta');
    window.location.assign('/');
  }

  if (!step) return null;

  return (
    // ── Wrapper div : gère UNIQUEMENT position:fixed + centrage ─────────────────
    // Ne pas mettre transform ici — il resterait intact et n'interférerait
    // pas avec les transforms Framer Motion du motion.div enfant.
    <div style={{
      position:   'fixed',
      bottom:     76,
      left:       0,
      right:      0,
      zIndex:     9995,
      display:    'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      padding:    '0 12px',
      pointerEvents: 'none',
    }}>
      {/* motion.div : UNIQUEMENT animation (opacity + y). Aucun positionnement. */}
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          width:          '100%',
          maxWidth:       480,
          pointerEvents:  'all',
          background:     'rgba(10, 14, 28, 0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border:         '1px solid rgba(99,102,241,0.25)',
          borderRadius:   16,
          overflow:       'hidden',
          boxShadow:      '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              height:     '100%',
              background: 'linear-gradient(90deg, #3b82f6, #818cf8)',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>

        <div style={{
          padding:   '14px 18px 16px',
          maxHeight: 'calc(100dvh - 180px)',
          overflowY: 'auto',
        }}>
          {/* Header row */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            marginBottom:   12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{step.emoji}</span>
              <span style={{
                fontSize:   11,
                fontWeight: 600,
                color:      'rgba(255,255,255,0.35)',
                letterSpacing: 0.5,
              }}>
                Étape {stepIndex + 1} / {totalSteps}
              </span>
            </div>

            <button
              onClick={handleExit}
              title={confirmExit ? 'Cliquer pour confirmer' : 'Passer la visite guidée'}
              style={{
                background:   confirmExit ? 'rgba(239,68,68,0.2)' : 'transparent',
                border:       '1px solid',
                borderColor:  confirmExit ? '#ef4444' : 'rgba(255,255,255,0.12)',
                borderRadius: 8,
                color:        confirmExit ? '#fca5a5' : 'rgba(255,255,255,0.35)',
                padding:      '4px 10px',
                fontSize:     11,
                fontWeight:   600,
                cursor:       'pointer',
                transition:   'all 0.2s',
                whiteSpace:   'nowrap',
              }}
            >
              {confirmExit ? 'Confirmer ?' : 'Passer'}
            </button>
          </div>

          <h3 style={{
            fontSize:   16,
            fontWeight: 700,
            color:      '#fff',
            margin:     '0 0 7px',
            lineHeight: 1.3,
          }}>
            {step.title}
          </h3>

          <p style={{
            fontSize:   13,
            color:      'rgba(255,255,255,0.62)',
            margin:     '0 0 16px',
            lineHeight: 1.55,
          }}>
            {step.body}
          </p>

          {step.isCTA ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleCreateAccount}
                style={{
                  width:        '100%',
                  background:   'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                  border:       'none',
                  borderRadius: 12,
                  color:        '#fff',
                  padding:      '12px 20px',
                  fontSize:     14,
                  fontWeight:   700,
                  cursor:       'pointer',
                  transition:   'opacity 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                🚀 Créer mon club gratuitement
              </button>
              <button
                onClick={onExit}
                style={{
                  width:        '100%',
                  background:   'rgba(255,255,255,0.05)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  color:        'rgba(255,255,255,0.55)',
                  padding:      '10px 20px',
                  fontSize:     13,
                  cursor:       'pointer',
                  transition:   'all 0.2s',
                }}
              >
                Explorer librement la sandbox
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirst && (
                <button
                  onClick={onPrev}
                  style={{
                    flex:         '0 0 auto',
                    background:   'rgba(255,255,255,0.05)',
                    border:       '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color:        'rgba(255,255,255,0.55)',
                    padding:      '10px 16px',
                    fontSize:     13,
                    fontWeight:   600,
                    cursor:       'pointer',
                    transition:   'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  ← Précédent
                </button>
              )}
              <button
                onClick={isLast ? onExit : onNext}
                style={{
                  flex:         1,
                  background:   isLast
                    ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)'
                    : 'rgba(99,102,241,0.18)',
                  border:       '1px solid',
                  borderColor:  isLast ? 'transparent' : 'rgba(99,102,241,0.35)',
                  borderRadius: 10,
                  color:        '#fff',
                  padding:      '10px 18px',
                  fontSize:     13,
                  fontWeight:   700,
                  cursor:       'pointer',
                  transition:   'all 0.2s',
                }}
                onMouseEnter={e => { if (!isLast) e.currentTarget.style.background = 'rgba(99,102,241,0.28)'; }}
                onMouseLeave={e => { if (!isLast) e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
              >
                {isLast ? '🚀 Terminer la visite' : 'Suivant →'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
