import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackCreateAccountClicked } from './demoAnalytics.js';

function getInitialPos() {
  try {
    const saved = sessionStorage.getItem('sl-demo-guide-pos');
    if (saved) return JSON.parse(saved);
  } catch { /* sessionStorage indisponible */ }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.max(8, Math.min(vw / 2 - 240, vw - 496)),
    y: Math.max(56, vh - 340),
  };
}

export default function DemoGuide({
  step, stepIndex, totalSteps,
  onNext, onPrev, onExit,
  onChangeProfile,
  isInteractive,      // step.clickTarget est défini → guide en pill + spotlight actif
  tryItInProgress,    // l'utilisateur a cliqué la cible, action en cours
  autoAdvanceMs,      // ms avant auto-avancement (info steps) — null si pas d'auto
}) {
  // Les étapes interactives (clickTarget) → pill automatique
  const [collapsed, setCollapsed] = useState(() => {
    if (isInteractive) return true;
    try { return sessionStorage.getItem('sl-demo-guide-collapsed') === '1'; } catch { return false; }
  });
  const [confirmExit,  setConfirmExit]  = useState(false);
  const [whyOpen,      setWhyOpen]      = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [timerPct,     setTimerPct]     = useState(100); // countdown 100→0
  const [pos,          setPos]          = useState(getInitialPos);
  const isDraggingRef  = useRef(false);
  const dragOffsetRef  = useRef({ x: 0, y: 0 });
  const timerRef       = useRef(null);

  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const GUIDE_W = 480;

  // ── Reset per-step ────────────────────────────────────────────────────────
  useEffect(() => {
    setWhyOpen(false);
    setShowSuccess(false);
    setConfirmExit(false);
    setTimerPct(100);

    // Étapes interactives → collapsé automatiquement
    if (isInteractive) {
      setCollapsed(true);
    } else {
      // Étapes info → restaurer la préférence utilisateur
      try {
        setCollapsed(sessionStorage.getItem('sl-demo-guide-collapsed') === '1');
      } catch {
        setCollapsed(false);
      }
    }
  }, [stepIndex, isInteractive]);

  // ── Timer countdown pour étapes informatives ──────────────────────────────
  useEffect(() => {
    if (!autoAdvanceMs || isInteractive) return;
    const INTERVAL = 50; // ms entre chaque tick
    const steps    = autoAdvanceMs / INTERVAL;
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick++;
      setTimerPct(Math.max(0, 100 - (tick / steps) * 100));
      if (tick >= steps) clearInterval(timerRef.current);
    }, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [stepIndex, autoAdvanceMs, isInteractive]);

  // ── Afficher ✅ quand action tryIt réussie (depuis DemoApp) ──────────────
  useEffect(() => {
    if (tryItInProgress === false && showSuccess) {
      // tryItInProgress passé à false → action terminée
    }
  }, [tryItInProgress, showSuccess]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    if (!e.currentTarget.hasAttribute('data-drag-handle')) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = Math.max(0, Math.min(e.clientX - dragOffsetRef.current.x, vw - GUIDE_W - 8));
    const ny = Math.max(48, Math.min(e.clientY - dragOffsetRef.current.y, vh - 80));
    setPos({ x: nx, y: ny });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try { sessionStorage.setItem('sl-demo-guide-pos', JSON.stringify(pos)); } catch { /* intentional */ }
  }, [pos]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c;
      if (!isInteractive) {
        try { sessionStorage.setItem('sl-demo-guide-collapsed', next ? '1' : '0'); } catch { /* intentional */ }
      }
      return next;
    });
  }

  function handleExit() {
    if (confirmExit) { onExit(); }
    else {
      setConfirmExit(true);
      setTimeout(() => setConfirmExit(false), 3000);
    }
  }

  function handleCreateAccount() {
    trackCreateAccountClicked('guide-cta');
    window.location.assign('/#register');
  }

  if (!step) return null;

  // ── Mode pill ─────────────────────────────────────────────────────────────
  if (collapsed) {
    const pillLabel = tryItInProgress
      ? '✨ À toi de jouer !'
      : isInteractive
        ? `👆 ${step.clickLabel || step.title}`
        : step.title;

    const pillSub = tryItInProgress
      ? 'Complète l\'action pour continuer'
      : isInteractive
        ? 'Tape pour rouvrir le guide'
        : `Étape ${stepIndex + 1}/${totalSteps}`;

    return (
      <motion.div
        key="pill"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        style={{
          position:       'fixed',
          left:           pos.x,
          top:            pos.y,
          zIndex:         10001,
          background:     tryItInProgress
            ? 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.92))'
            : isInteractive
              ? 'linear-gradient(135deg, rgba(99,102,241,0.92), rgba(79,70,229,0.92))'
              : 'var(--demo-pill-bg)',
          border:         `1px solid ${
            tryItInProgress ? 'rgba(16,185,129,0.5)'
            : isInteractive ? 'rgba(99,102,241,0.6)'
            : 'var(--demo-pill-border)'
          }`,
          borderRadius:   24,
          padding:        '10px 16px',
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          cursor:         'pointer',
          backdropFilter: 'blur(16px)',
          boxShadow:      'var(--demo-pill-shadow)',
          maxWidth:       320,
          userSelect:     'none',
        }}
        onClick={toggleCollapsed}
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{step.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: tryItInProgress || isInteractive ? 'rgba(255,255,255,0.7)' : 'var(--sl-t3)',
            display: 'block',
          }}>
            {pillSub}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: tryItInProgress || isInteractive ? '#fff' : 'var(--sl-t1)',
            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pillLabel}
          </span>
        </div>
        <span style={{
          fontSize: 14,
          color: tryItInProgress || isInteractive ? 'rgba(255,255,255,0.6)' : 'var(--sl-t3)',
          flexShrink: 0,
        }}>▲</span>
      </motion.div>
    );
  }

  // ── Guide complet ─────────────────────────────────────────────────────────
  return (
    <motion.div
      key="full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position:             'fixed',
        left:                 pos.x,
        top:                  pos.y,
        zIndex:               10001,
        width:                GUIDE_W,
        maxWidth:             'calc(100vw - 16px)',
        background:           'var(--demo-card-bg)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:               '1px solid var(--demo-card-border)',
        borderRadius:         16,
        overflow:             'hidden',
        boxShadow:            'var(--demo-card-shadow)',
        display:              'flex',
        flexDirection:        'column',
      }}
    >
      {/* Barre de progression du tour */}
      <div style={{ height: 3, background: 'var(--demo-progress-bg)', flexShrink: 0 }}>
        <motion.div
          initial={{ width: `${(stepIndex / totalSteps) * 100}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #818cf8)', borderRadius: '0 2px 2px 0' }}
        />
      </div>

      {/* Timer countdown pour étapes info (barre verte qui défile) */}
      {autoAdvanceMs && !isInteractive && (
        <div style={{ height: 2, background: 'rgba(34,217,106,0.15)', flexShrink: 0 }}>
          <motion.div
            key={`timer-${stepIndex}`}
            initial={{ width: '100%' }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
            style={{ height: '100%', background: 'rgba(34,217,106,0.7)', borderRadius: '0 1px 1px 0' }}
          />
        </div>
      )}

      {/* Poignée déplaçable + collapse/skip */}
      <div
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{
          padding:        '10px 14px 8px',
          display:        'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor:         'grab', touchAction: 'none', flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={toggleCollapsed}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{step.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', letterSpacing: 0.5 }}>
            Étape {stepIndex + 1} / {totalSteps}
          </span>
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>▼</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span title="Glisser pour déplacer" style={{ fontSize: 11, color: 'var(--sl-t3)', letterSpacing: 3, lineHeight: 1 }}>⠿⠿</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleExit(); }}
            style={{
              background:  confirmExit ? 'rgba(239,68,68,0.2)' : 'transparent',
              border:      '1px solid', borderColor: confirmExit ? '#ef4444' : 'var(--demo-surface-border)',
              borderRadius: 8, color: confirmExit ? '#fca5a5' : 'var(--sl-t3)',
              padding: '3px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {confirmExit ? 'Confirmer ?' : 'Passer'}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '0 18px 0', maxHeight: 'calc(100dvh - 280px)', overflowY: 'auto', flexShrink: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 6px', lineHeight: 1.3 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--sl-t2)', margin: '0 0 10px', lineHeight: 1.55 }}>
          {step.body}
        </p>

        {/* Badge "À toi de jouer" quand guide ouvert en mode interactif */}
        {isInteractive && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: tryItInProgress ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.1)',
            border: `1px solid ${tryItInProgress ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.25)'}`,
            borderRadius: 10, marginBottom: 10,
          }}>
            <span style={{ fontSize: 16 }}>{tryItInProgress ? '✅' : '👆'}</span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: tryItInProgress ? '#22c55e' : 'var(--demo-indigo-text)',
            }}>
              {tryItInProgress
                ? 'Action en cours... complète-la !'
                : step.clickLabel || 'Clique sur l\'élément mis en valeur'}
            </span>
          </div>
        )}

        {/* Pourquoi cette étape */}
        {step.why && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setWhyOpen(o => !o)}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--demo-indigo-text-dim)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>💡</span>
              <span>Pourquoi cette étape ?</span>
              <span style={{ transition: 'transform 0.2s', transform: whyOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            <AnimatePresence>
              {whyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{
                    margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.5,
                    color: 'var(--demo-indigo-why)', fontStyle: 'italic',
                    borderLeft: '2px solid var(--demo-indigo-why-border)', paddingLeft: 10,
                  }}>
                    {step.why}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 18px 14px', flexShrink: 0, position: 'relative' }}>
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.92)',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 18px 14px',
              }}
            >
              <span>✅</span> Parfait !
            </motion.div>
          )}
        </AnimatePresence>

        {step.isCTA ? (
          // Étape CTA finale — boutons inscription / sandbox
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleCreateAccount}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
                border: 'none', borderRadius: 10, color: '#fff',
                padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              🚀 Créer mon club gratuitement
            </button>
            <button
              onClick={onExit}
              style={{
                width: '100%', background: 'var(--demo-surface-bg)',
                border: '1px solid var(--demo-surface-border)', borderRadius: 10,
                color: 'var(--sl-t3)', padding: '10px 20px', fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
            >
              Explorer librement la sandbox
            </button>
          </div>
        ) : isInteractive ? (
          // Étape interactive — le "Suivant" n'existe pas, l'utilisateur doit cliquer la cible
          // On montre seulement "Précédent" (si pas premier) et un lien "Passer"
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button
                onClick={onPrev}
                style={{
                  flex: '0 0 auto', background: 'var(--demo-surface-bg)',
                  border: '1px solid var(--demo-surface-border)', borderRadius: 10,
                  color: 'var(--sl-t3)', padding: '10px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
              >
                ← Précédent
              </button>
            )}
            <button
              onClick={isLast ? onExit : onNext}
              style={{
                flex: 1, background: 'var(--demo-surface-bg)',
                border: '1px solid var(--demo-surface-border)', borderRadius: 10,
                color: 'var(--sl-t3)', padding: '10px 18px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                opacity: 0.7,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; }}
            >
              Passer cette étape →
            </button>
          </div>
        ) : (
          // Étape informative — navigation normale
          <div style={{ display: 'flex', gap: 8 }}>
            {!isFirst && (
              <button
                onClick={onPrev}
                style={{
                  flex: '0 0 auto', background: 'var(--demo-surface-bg)',
                  border: '1px solid var(--demo-surface-border)', borderRadius: 10,
                  color: 'var(--sl-t3)', padding: '10px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
              >
                ← Précédent
              </button>
            )}
            <button
              onClick={isLast ? onExit : onNext}
              style={{
                flex: 1,
                background: isLast ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'var(--demo-indigo-bg-next)',
                border: '1px solid', borderColor: isLast ? 'transparent' : 'var(--demo-indigo-border)',
                borderRadius: 10, color: isLast ? '#fff' : 'var(--demo-indigo-text)',
                padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!isLast) e.currentTarget.style.background = 'var(--demo-indigo-bg-next-h)'; }}
              onMouseLeave={e => { if (!isLast) e.currentTarget.style.background = 'var(--demo-indigo-bg-next)'; }}
            >
              {isLast ? '🚀 Terminer la visite' : autoAdvanceMs ? `Continuer (${Math.ceil(autoAdvanceMs / 1000)}s) →` : 'Suivant →'}
            </button>
          </div>
        )}

        {onChangeProfile && (
          <button
            onClick={onChangeProfile}
            style={{
              display: 'block', width: '100%', marginTop: 6,
              background: 'none', border: 'none', padding: '2px 0',
              fontSize: 11, color: 'var(--sl-t3)', cursor: 'pointer', textAlign: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sl-t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-t3)'; }}
          >
            ↩ Changer de profil
          </button>
        )}
      </div>
    </motion.div>
  );
}
