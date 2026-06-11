import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackCreateAccountClicked, trackTryItUsed, trackTryItCompleted } from './demoAnalytics.js';

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
  onTryItActivate,
}) {
  const [collapsed,     setCollapsed]     = useState(() => {
    try { return sessionStorage.getItem('sl-demo-guide-collapsed') === '1'; } catch { return false; }
  });
  const [confirmExit,   setConfirmExit]   = useState(false);
  const [whyOpen,       setWhyOpen]       = useState(false);
  const [tryItActive,   setTryItActive]   = useState(false);
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [pos,           setPos]           = useState(getInitialPos);
  const isDraggingRef   = useRef(false);
  const dragOffsetRef   = useRef({ x: 0, y: 0 });

  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const GUIDE_W = 480;

  // Reset per-step state
  useEffect(() => {
    setWhyOpen(false);
    setTryItActive(false);
    setShowSuccess(false);
    setConfirmExit(false);
  }, [stepIndex]);

  // Écoute de sl-demo-action pour la validation "Essayer moi-même"
  useEffect(() => {
    if (!tryItActive || !step?.tryItAction) return;
    function onDemoAction(e) {
      if (e.detail?.type === step.tryItAction) {
        setTryItActive(false);
        onTryItActivate?.(false);
        setShowSuccess(true);
        trackTryItCompleted(stepIndex, step.tryItAction);
        setTimeout(() => {
          setShowSuccess(false);
          if (!isLast) onNext();
          else onExit();
        }, 1400);
      }
    }
    window.addEventListener('sl-demo-action', onDemoAction);
    return () => window.removeEventListener('sl-demo-action', onDemoAction);
  }, [tryItActive, step?.tryItAction, stepIndex, isLast, onNext, onExit, onTryItActivate]);

  // ── Drag handlers ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    // Seulement sur la poignée (data-drag-handle)
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

  // ── Actions ───────────────────────────────────────────────────────────────────
  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c;
      try { sessionStorage.setItem('sl-demo-guide-collapsed', next ? '1' : '0'); } catch { /* intentional */ }
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

  function handleTryIt() {
    setTryItActive(true);
    setCollapsed(true);
    try { sessionStorage.setItem('sl-demo-guide-collapsed', '1'); } catch { /* intentional */ }
    onTryItActivate?.(true);
    trackTryItUsed(stepIndex, step.tryItAction);
  }

  function handleCreateAccount() {
    trackCreateAccountClicked('guide-cta');
    window.location.assign('/#register');
  }

  if (!step) return null;

  // ── Pill mode (collapsed) ─────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <motion.div
        key="pill"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.18 }}
        style={{
          position:   'fixed',
          left:       pos.x,
          top:        pos.y,
          zIndex:     10001,
          background: tryItActive
            ? 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))'
            : 'rgba(10, 14, 28, 0.96)',
          border:       `1px solid ${tryItActive ? 'rgba(16,185,129,0.5)' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: 24,
          padding:      '10px 16px',
          display:      'flex',
          alignItems:   'center',
          gap:          10,
          cursor:       'pointer',
          backdropFilter: 'blur(16px)',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.5)',
          maxWidth:     300,
          userSelect:   'none',
        }}
        onClick={toggleCollapsed}
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{step.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tryItActive ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
              ✨ À vous de jouer !
            </span>
          ) : (
            <>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                Étape {stepIndex + 1}/{totalSteps}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {step.title}
              </span>
            </>
          )}
        </div>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>▲</span>
      </motion.div>
    );
  }

  // ── Guide complet ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      key="full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position:       'fixed',
        left:           pos.x,
        top:            pos.y,
        zIndex:         10001,
        width:          GUIDE_W,
        maxWidth:       'calc(100vw - 16px)',
        background:     'rgba(10, 14, 28, 0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border:         '1px solid rgba(99,102,241,0.25)',
        borderRadius:   16,
        overflow:       'hidden',
        boxShadow:      '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        display:        'flex',
        flexDirection:  'column',
      }}
    >
      {/* Barre de progression */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <motion.div
          initial={{ width: `${(stepIndex / totalSteps) * 100}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #818cf8)', borderRadius: '0 2px 2px 0' }}
        />
      </div>

      {/* Poignée de déplacement + actions collapse/skip */}
      <div
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{
          padding:      '10px 14px 8px',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          cursor:       'grab',
          touchAction:  'none',
          flexShrink:   0,
        }}
      >
        {/* Indicateur de step + collapse */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={toggleCollapsed}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{step.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>
            Étape {stepIndex + 1} / {totalSteps}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>▼</span>
        </div>

        {/* 3 points de drag + bouton Passer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Indicateur visuel de déplaçabilité */}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: 2 }}>⋮⋮</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleExit(); }}
            style={{
              background:   confirmExit ? 'rgba(239,68,68,0.2)' : 'transparent',
              border:       '1px solid',
              borderColor:  confirmExit ? '#ef4444' : 'rgba(255,255,255,0.12)',
              borderRadius: 8,
              color:        confirmExit ? '#fca5a5' : 'rgba(255,255,255,0.35)',
              padding:      '3px 9px',
              fontSize:     10,
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.2s',
              whiteSpace:   'nowrap',
            }}
          >
            {confirmExit ? 'Confirmer ?' : 'Passer'}
          </button>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div style={{
        padding:   '0 18px 0',
        maxHeight: 'calc(100dvh - 280px)',
        overflowY: 'auto',
        flexShrink: 1,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.3 }}>
          {step.title}
        </h3>

        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.62)', margin: '0 0 10px', lineHeight: 1.55 }}>
          {step.body}
        </p>

        {/* Section "Pourquoi ?" */}
        {step.why && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setWhyOpen(o => !o)}
              style={{
                background: 'transparent', border: 'none',
                color: 'rgba(129,140,248,0.7)', fontSize: 11, fontWeight: 600,
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
                    color: 'rgba(165,180,252,0.75)', fontStyle: 'italic',
                    borderLeft: '2px solid rgba(99,102,241,0.3)',
                    paddingLeft: 10,
                  }}>
                    {step.why}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Boutons navigation */}
      <div style={{ padding: '10px 18px 14px', flexShrink: 0, position: 'relative' }}>
        {/* Animation succès "try it" */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{
                position:   'absolute', inset: 0,
                background: 'rgba(16,185,129,0.92)',
                borderRadius: 12,
                display:    'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, fontSize: 14, fontWeight: 800, color: '#fff',
                margin: '0 18px 14px',
              }}
            >
              <span>✅</span> Parfait !
            </motion.div>
          )}
        </AnimatePresence>

        {step.isCTA ? (
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
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                color: 'rgba(255,255,255,0.55)', padding: '10px 20px',
                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Explorer librement la sandbox
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Bouton "Essayer moi-même" */}
            {step.tryItAction && !tryItActive && (
              <button
                onClick={handleTryIt}
                style={{
                  width: '100%', background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.35)', borderRadius: 10,
                  color: 'rgba(165,180,252,0.95)', padding: '9px 16px',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
              >
                <span>✨</span>
                {step.tryItLabel || 'Essayer moi-même'}
              </button>
            )}

            {/* Navigation précédent / suivant */}
            <div style={{ display: 'flex', gap: 8 }}>
              {!isFirst && (
                <button
                  onClick={onPrev}
                  style={{
                    flex: '0 0 auto', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                    color: 'rgba(255,255,255,0.55)', padding: '10px 16px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
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
                  flex: 1,
                  background: isLast ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'rgba(99,102,241,0.18)',
                  border: '1px solid',
                  borderColor: isLast ? 'transparent' : 'rgba(99,102,241,0.35)',
                  borderRadius: 10, color: '#fff', padding: '10px 18px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (!isLast) e.currentTarget.style.background = 'rgba(99,102,241,0.28)'; }}
                onMouseLeave={e => { if (!isLast) e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; }}
              >
                {isLast ? '🚀 Terminer la visite' : 'Suivant →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
