import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackCreateAccountClicked } from './demoAnalytics.js';

const BOTTOM_NAV_H = 64; // hauteur de la BottomNav en pixels

function getInitialPos() {
  const vh = window.innerHeight;
  // Positionner au-dessus de la BottomNav (64px) + marge de sécurité (16px)
  return {
    x: 8,
    y: Math.max(120, vh - 320 - BOTTOM_NAV_H - 16),
  };
}

export default function DemoGuide({
  step, stepIndex, totalSteps,
  onNext, onPrev, onExit,
  onChangeProfile,
  isInteractive,     // step.clickTarget est défini → guide en pill + spotlight actif
  tryItInProgress,   // l'utilisateur a cliqué la cible, action en cours
}) {
  const [collapsed, setCollapsed] = useState(() => {
    // Les étapes interactives (clickTarget) démarrent en mode pill
    // Les étapes informatives démarrent toujours en mode plein (sessionStorage nettoyé au montage)
    return isInteractive;
  });
  const [confirmExit,  setConfirmExit]  = useState(false);
  const [whyOpen,      setWhyOpen]      = useState(false);
  const [pos,          setPos]          = useState(getInitialPos);
  const isDraggingRef  = useRef(false);
  const dragOffsetRef  = useRef({ x: 0, y: 0 });
  const didDragRef     = useRef(false);

  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const GUIDE_W = 480;

  // ── Reset per-step ────────────────────────────────────────────────────────
  useEffect(() => {
    setWhyOpen(false);
    setConfirmExit(false);

    setCollapsed(isInteractive);
  }, [stepIndex, isInteractive]);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e) => {
    if (e.target.closest('button')) return;
    isDraggingRef.current = true;
    didDragRef.current    = false;
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [pos]);

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    didDragRef.current = true;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nx = Math.max(0, Math.min(e.clientX - dragOffsetRef.current.x, vw - GUIDE_W - 8));
    // Contrainte basse : laisser 40px (hauteur pill) + BottomNav (64px) + marge (8px)
    const ny = Math.max(48, Math.min(e.clientY - dragOffsetRef.current.y, vh - 40 - BOTTOM_NAV_H - 8));
    setPos({ x: nx, y: ny });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  function toggleCollapsed() {
    if (didDragRef.current) { didDragRef.current = false; return; }
    setCollapsed(c => !c);
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

  // ── Mode pill (bulle mini) ────────────────────────────────────────────────
  if (collapsed) {
    const pillLabel = tryItInProgress
      ? '✨ À toi de jouer !'
      : isInteractive
        ? `👆 ${step.clickLabel || step.title}`
        : step.title;

    // Si l'étape précise un onglet à rejoindre, l'afficher comme sous-titre
    const pillSub = tryItInProgress
      ? 'Complète l\'action pour continuer'
      : step.onTab
        ? `Étape ${stepIndex + 1} / ${totalSteps} · Onglet ${step.onTab}`
        : `Étape ${stepIndex + 1} / ${totalSteps}`;

    const pillBg = tryItInProgress
      ? 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(5,150,105,0.92))'
      : isInteractive
        ? 'linear-gradient(135deg, rgba(99,102,241,0.92), rgba(79,70,229,0.92))'
        : 'var(--demo-pill-bg)';

    const pillBorder = tryItInProgress ? 'rgba(16,185,129,0.5)'
      : isInteractive ? 'rgba(99,102,241,0.6)'
      : 'var(--demo-pill-border)';

    const isColored = tryItInProgress || isInteractive;

    return createPortal(
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
          background:     pillBg,
          border:         `1px solid ${pillBorder}`,
          borderRadius:   20,
          padding:        '6px 8px 6px 10px',
          display:        'flex',
          alignItems:     'center',
          gap:            6,
          cursor:         'grab',
          backdropFilter: 'blur(16px)',
          boxShadow:      '0 4px 24px rgba(0,0,0,0.35)',
          userSelect:     'none',
          touchAction:    'none',
        }}
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onClick={toggleCollapsed}
      >
        {/* Icône + compteur */}
        <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{step.emoji}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
          color: isColored ? '#fff' : 'var(--sl-t2)',
        }}>
          {stepIndex + 1}/{totalSteps}
        </span>

        {/* Bouton agrandir */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
          title="Agrandir le guide"
          style={{
            background:   'rgba(255,255,255,0.15)',
            border:       '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            color:        isColored ? '#fff' : 'var(--sl-t2)',
            padding:      '8px 10px',
            minHeight:    36,
            fontSize:     11,
            cursor:       'pointer',
            flexShrink:   0,
            lineHeight:   1,
            display:      'flex',
            alignItems:   'center',
          }}
        >
          ▲
        </button>

        {/* Bouton quitter */}
        <button
          onClick={(e) => { e.stopPropagation(); onExit(); }}
          title="Quitter le tutoriel"
          style={{
            background:   'rgba(255,255,255,0.08)',
            border:       '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color:        isColored ? 'rgba(255,255,255,0.75)' : 'var(--sl-t3)',
            padding:      '8px 9px',
            minHeight:    36,
            fontSize:     13,
            cursor:       'pointer',
            flexShrink:   0,
            lineHeight:   1,
            display:      'flex',
            alignItems:   'center',
          }}
        >
          ×
        </button>
      </motion.div>,
      document.body,
    );
  }

  // ── Guide complet ─────────────────────────────────────────────────────────
  return createPortal(
    <motion.div
      key="full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        position:             'fixed',
        left:                 Math.min(pos.x, Math.max(0, window.innerWidth - GUIDE_W - 12)),
        top:                  Math.min(pos.y, window.innerHeight - 100),
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

      {/* En-tête draggable */}
      <div
        data-drag-handle
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        style={{
          padding:     '10px 14px 8px',
          display:     'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor:      'grab', touchAction: 'none', flexShrink: 0,
        }}
      >
        {/* Gauche : emoji + compteur d'étapes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 0', minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{step.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Étape {stepIndex + 1} / {totalSteps}
          </span>
        </div>

        {/* Droite : poignée + réduire + quitter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span title="Glisser pour déplacer" style={{ fontSize: 11, color: 'var(--sl-t3)', letterSpacing: 3, lineHeight: 1 }}>⠿⠿</span>

          {/* Réduire en bulle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
            title="Réduire en bulle"
            style={{
              background:   'var(--demo-surface-bg)',
              border:       '1px solid var(--demo-surface-border)',
              borderRadius: 8,
              color:        'var(--sl-t3)',
              padding:      '6px 9px',
              minHeight:    36,
              fontSize:     10,
              fontWeight:   600,
              cursor:       'pointer',
              transition:   'all 0.2s',
              whiteSpace:   'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
          >
            ▼ Réduire
          </button>

          {/* Quitter */}
          <button
            onClick={(e) => { e.stopPropagation(); handleExit(); }}
            style={{
              background:   confirmExit ? 'rgba(239,68,68,0.2)' : 'transparent',
              border:       '1px solid', borderColor: confirmExit ? '#ef4444' : 'var(--demo-surface-border)',
              borderRadius: 8, color: confirmExit ? '#fca5a5' : 'var(--sl-t3)',
              padding:      '6px 9px', minHeight: 36, fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {confirmExit ? '✓ OK ?' : '× Quitter'}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '0 18px 0', maxHeight: 'calc(100dvh - 260px)', overflowY: 'auto', flexShrink: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', margin: '0 0 6px', lineHeight: 1.3 }}>
          {step.title}
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--sl-t2)', margin: '0 0 10px', lineHeight: 1.55 }}>
          {step.body}
        </p>

        {/* Badge interactif "À toi de jouer" */}
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

        {/* Conseil / Astuce */}
        {step.tip && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, marginBottom: 10,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
            <span style={{ fontSize: 11.5, color: 'rgba(217,119,6,0.9)', lineHeight: 1.5 }}>
              {step.tip}
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
                cursor: 'pointer', padding: '8px 0', minHeight: 36, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span>📊</span>
              <span>Pourquoi ça compte ?</span>
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

      {/* Zone de navigation */}
      <div style={{ padding: '10px 18px 14px', flexShrink: 0 }}>
        {step.isCTA ? (
          // Étape CTA finale
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
          // Étape interactive — navigation Précédent + Passer
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
          // Étape informative — navigation normale Précédent / Suivant
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
              {isLast ? '🏁 Terminer la visite' : 'Suivant →'}
            </button>
          </div>
        )}

        {onChangeProfile && (
          <button
            onClick={onChangeProfile}
            style={{
              display: 'block', width: '100%', marginTop: 6,
              background: 'none', border: 'none', padding: '8px 0', minHeight: 36,
              fontSize: 11, color: 'var(--sl-t3)', cursor: 'pointer', textAlign: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--sl-t1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-t3)'; }}
          >
            ↩ Changer de profil
          </button>
        )}
      </div>
    </motion.div>,
    document.body,
  );
}
