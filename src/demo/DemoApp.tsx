import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DemoContext } from './DemoContext.jsx';
import { loadTour }    from './tours/index.js';
import {
  startDemoSession, trackStep, trackTourCompleted,
  trackSandboxEntered, trackDemoExited,
} from './demoAnalytics.js';
import DemoBanner       from './DemoBanner.jsx';
import DemoLandingPage  from './DemoLandingPage.jsx';
import DemoGuide        from './DemoGuide.jsx';
import DemoSpotlight    from './DemoSpotlight.jsx';
import SandboxWelcome   from './SandboxWelcome.jsx';

const PROFILE_EMOJIS = {
  president:    '👑',
  coach:        '🎯',
  communication:'📣',
  parent:       '👨‍👧',
  player:       '⚽',
  supporter:    '🏟️',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isInteractiveStep(step) {
  return !!step?.clickTarget;
}

// AppInner est passé en prop pour éviter l'import circulaire
// Toutes les clés sessionStorage utilisées par le système démo
const DEMO_SS_KEYS = [
  'sl-demo-initialized', 'sl-demo-profile', 'sl-demo-step', 'sl-demo-sandbox',
  'sl-demo-guide-pos', 'sl-demo-guide-collapsed',
];

function clearDemoSession() {
  try { DEMO_SS_KEYS.forEach(k => sessionStorage.removeItem(k)); } catch { /* private browsing */ }
}

export default function DemoApp({ AppInner }) {
  const [profile,            setProfile]            = useState(() => {
    // Toujours repartir de la landing page — efface toute session précédente
    // (position du guide incluse pour éviter qu'il soit hors écran)
    clearDemoSession();
    return null;
  });
  const [currentStep,        setCurrentStep]        = useState(0);
  const [isInSandbox,        setIsInSandbox]        = useState(false);
  const [showSandboxWelcome, setShowSandboxWelcome] = useState(false);
  const [tourSteps,          setTourSteps]          = useState([]);
  // Shake state — passé à DemoSpotlight pour l'animation
  const [shaking,            setShaking]            = useState(false);
  // En cours d'action tryIt (entre le clic sur le bouton et l'action complétée)
  const [tryItInProgress,    setTryItInProgress]    = useState(false);
  // Délai d'activation du spotlight — false pendant 350ms quand closeOverlayBefore pour laisser l'overlay se fermer
  const [spotlightReady,     setSpotlightReady]     = useState(true);

  const showLanding = !profile;
  const step        = tourSteps[currentStep] ?? null;

  // Le spotlight est actif sur les étapes interactives hors sandbox/landing
  const spotlightActive = isInteractiveStep(step) && !showLanding && !isInSandbox && !showSandboxWelcome && spotlightReady;

  // ── nextStep stable via ref ───────────────────────────────────────────────
  const nextStepRef = useRef(null);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, tourSteps.length - 1);
      sessionStorage.setItem('sl-demo-step', String(next));
      const nextS = tourSteps[next];
      if (nextS) trackStep(next, nextS.title);
      return next;
    });
    setTryItInProgress(false);
    setShaking(false);
  }, [tourSteps]);

  useEffect(() => { nextStepRef.current = nextStep; }, [nextStep]);

  // ── Détection des clics utilisateur (tutoriel interactif) ────────────────
  useEffect(() => {
    if (showLanding || isInSandbox || showSandboxWelcome) return;

    function onDocumentClick(e) {
      const s = tourSteps[currentStep];
      if (!s?.clickTarget) return; // étape info → pas de détection de clic

      // Cherche le clickTarget dans TOUTE la chaîne d'ancêtres (pas seulement le plus proche)
      // → un clic sur un enfant d'un conteneur data-demo (ex: agenda-section) est accepté
      function isInsideTarget(el) {
        let cur = el;
        while (cur) {
          if (cur.getAttribute?.('data-demo') === s.clickTarget) return true;
          cur = cur.parentElement;
        }
        return false;
      }

      if (isInsideTarget(e.target)) {
        // ✅ Bonne cible cliquée (directement ou via un enfant du conteneur)
        if (s.tryItAction) {
          setTryItInProgress(true);
        } else {
          setTimeout(() => nextStepRef.current?.(), 250);
        }
      } else if (!tryItInProgress) {
        // Ne secouer QUE si l'utilisateur a cliqué un AUTRE élément data-demo explicite
        // (ignorer les clics sur des éléments sans data-demo : boutons intermédiaires, Admin, Voir la page, etc.)
        const otherDemoEl = e.target.closest?.('[data-demo]');
        if (otherDemoEl && otherDemoEl.getAttribute('data-demo') !== s.clickTarget) {
          setShaking(true);
          setTimeout(() => setShaking(false), 600);
        }
      }
    }

    document.addEventListener('click', onDocumentClick, { capture: true });
    return () => document.removeEventListener('click', onDocumentClick, { capture: true });
   
  }, [currentStep, tourSteps, showLanding, isInSandbox, showSandboxWelcome, tryItInProgress]);

  // ── Détection des actions tryItAction (sl-demo-action) ───────────────────
  useEffect(() => {
    function onDemoAction(e) {
      const s = tourSteps[currentStep];
      if (s?.tryItAction && e.detail?.type === s.tryItAction) {
        setTryItInProgress(false);
        nextStepRef.current?.();
      }
    }
    window.addEventListener('sl-demo-action', onDemoAction);
    return () => window.removeEventListener('sl-demo-action', onDemoAction);
  }, [currentStep, tourSteps]);

  // ── Fermeture des overlays + navigation onglet au changement d'étape ────
  useEffect(() => {
    if (showLanding || !step) return;
    const TAB_ID: Record<string, string> = {
      agenda: 'home', accueil: 'home', home: 'home',
      carte: 'map', map: 'map',
      clubs: 'clubs',
      favoris: 'favoris',
      profil: 'profil',
    };
    const tabId = step.onTab ? TAB_ID[step.onTab.toLowerCase()] ?? null : null;

    if (step.closeOverlayBefore) {
      // 1) Désactiver le spotlight immédiatement (évite qu'il flotte sur l'overlay encore ouvert)
      setSpotlightReady(false);
      // 2) Fermer tous les overlays
      window.dispatchEvent(new CustomEvent('sl-demo-navigate', {
        detail: { action: 'close-overlay' },
      }));
      let tTab: ReturnType<typeof setTimeout> | null = null;
      // 3) Naviguer vers l'onglet (si défini) après la fermeture de l'overlay
      if (tabId) {
        tTab = setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sl-demo-navigate', {
            detail: { action: 'tab', tab: tabId },
          }));
        }, 120);
      }
      // 4) Réactiver le spotlight après que l'overlay soit fermé (animation ~200ms)
      const t = setTimeout(() => setSpotlightReady(true), 350);
      return () => { clearTimeout(t); if (tTab) clearTimeout(tTab); };
    } else if (tabId) {
      window.dispatchEvent(new CustomEvent('sl-demo-navigate', {
        detail: { action: 'tab', tab: tabId },
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // ── Actions principales ──────────────────────────────────────────────────

  const startDemo = useCallback((selectedProfile) => {
    const steps = loadTour(selectedProfile);
    setProfile(selectedProfile);
    setTourSteps(steps);
    setCurrentStep(0);
    setTryItInProgress(false);
    setShaking(false);
    sessionStorage.setItem('sl-demo-initialized', 'true');
    sessionStorage.setItem('sl-demo-profile', selectedProfile);
    sessionStorage.setItem('sl-demo-step', '0');
    window.dispatchEvent(new CustomEvent('sl-demo-profile-selected', { detail: { profile: selectedProfile } }));
    // Forcer la navigation vers l'onglet home — la landing peut avoir été ouverte depuis n'importe quel onglet
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'tab', tab: 'home' } }));
    }, 50);
    startDemoSession(selectedProfile);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = Math.max(prev - 1, 0);
      sessionStorage.setItem('sl-demo-step', String(p));
      return p;
    });
    setTryItInProgress(false);
    setShaking(false);
  }, []);

  const exitTour = useCallback(() => {
    trackTourCompleted(profile);
    setTryItInProgress(false);
    setShaking(false);
    setShowSandboxWelcome(true);
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'close-overlay' } }));
  }, [profile]);

  const enterSandbox = useCallback(() => {
    setShowSandboxWelcome(false);
    setIsInSandbox(true);
    sessionStorage.setItem('sl-demo-sandbox', 'true');
    trackSandboxEntered();
  }, []);

  const exitDemo = useCallback(() => {
    trackDemoExited(currentStep);
    ['sl-demo-initialized','sl-demo-profile','sl-demo-step','sl-demo-sandbox'].forEach(k => sessionStorage.removeItem(k));
    window.location.href = '/';
  }, [currentStep]);

  const replayTour = useCallback(() => {
    setIsInSandbox(false);
    setCurrentStep(0);
    setTryItInProgress(false);
    setShaking(false);
    sessionStorage.setItem('sl-demo-step', '0');
    sessionStorage.removeItem('sl-demo-sandbox');
    startDemoSession(profile);
  }, [profile]);

  const changeProfile = useCallback(() => {
    ['sl-demo-initialized','sl-demo-profile','sl-demo-step','sl-demo-sandbox'].forEach(k => sessionStorage.removeItem(k));
    setProfile(null);
    setTourSteps([]);
    setCurrentStep(0);
    setIsInSandbox(false);
    setShowSandboxWelcome(false);
    setTryItInProgress(false);
    setShaking(false);
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'close-overlay' } }));
  }, []);

  // ── Context ───────────────────────────────────────────────────────────────

  const contextValue = {
    profile, currentStep, tourSteps, isInSandbox,
    isLastStep:      currentStep === tourSteps.length - 1,
    spotlightTarget: step?.clickTarget ?? null,
    spotlightActive,
    startDemo, nextStep, prevStep, exitTour, exitDemo,
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {/* App complète en arrière-plan */}
      <AppInner />

      {/* Bandeau fixe */}
      <DemoBanner onCreateAccount={() => {
        window.dispatchEvent(new CustomEvent('sl-demo-create-account', {}));
      }} />

      {/* Sélection de profil */}
      <AnimatePresence>
        {showLanding && <DemoLandingPage onSelect={startDemo} />}
      </AnimatePresence>

      {/* Spotlight interactif */}
      <DemoSpotlight
        target={step?.clickTarget ?? null}
        active={spotlightActive}
        shaking={shaking}
      />

      {/* Guide guidé */}
      {!showLanding && !isInSandbox && !showSandboxWelcome && tourSteps.length > 0 && currentStep < tourSteps.length && (
        <DemoGuide
          step={step}
          stepIndex={currentStep}
          totalSteps={tourSteps.length}
          isInteractive={isInteractiveStep(step)}
          tryItInProgress={tryItInProgress}
          onNext={nextStep}
          onPrev={prevStep}
          onExit={exitTour}
          onChangeProfile={changeProfile}
        />
      )}

      {/* Écran post-tour */}
      <AnimatePresence>
        {showSandboxWelcome && (
          <SandboxWelcome
            profile={profile}
            completedSteps={tourSteps.length}
            onEnterSandbox={enterSandbox}
            onChangeProfile={changeProfile}
            onCreateAccount={() => { window.location.assign('/#register'); }}
          />
        )}
      </AnimatePresence>

      {/* Badge sandbox (mode libre) */}
      {!showLanding && isInSandbox && (
        <SandboxBadge
          profile={profile}
          onCreateAccount={() => window.location.assign('/#register')}
          onReplayTour={replayTour}
          onChangeProfile={changeProfile}
        />
      )}
    </DemoContext.Provider>
  );
}

// ── SandboxBadge ─────────────────────────────────────────────────────────────

function SandboxBadge({ profile, onCreateAccount, onReplayTour, onChangeProfile }) {
  const emoji = PROFILE_EMOJIS[profile] || '🏖️';
  return (
    <div style={{
      position:       'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))', left: '50%',
      transform:      'translateX(-50%)', zIndex: 9990,
      display:        'flex', alignItems: 'center', gap: 6,
      background:     'var(--demo-pill-bg)', backdropFilter: 'blur(16px)',
      border:         '1px solid var(--demo-pill-border)', borderRadius: 28,
      padding:        '8px 8px 8px 14px', boxShadow: 'var(--demo-badge-shadow)',
      whiteSpace:     'nowrap',
      flexWrap:       'wrap',
      maxWidth:       'calc(100vw - 32px)',
      justifyContent: 'center',
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)' }}>Sandbox libre</span>

      <button
        onClick={onReplayTour}
        title="Revoir le tutoriel du profil actuel"
        style={{
          background: 'var(--demo-surface-bg)', border: '1px solid var(--demo-surface-border)',
          borderRadius: 20, color: 'var(--sl-t3)', padding: '5px 12px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
      >
        ↺ Revoir
      </button>

      <button
        onClick={onChangeProfile}
        title="Choisir un autre profil de tutoriel"
        style={{
          background: 'var(--demo-surface-bg)', border: '1px solid var(--demo-surface-border)',
          borderRadius: 20, color: 'var(--sl-t3)', padding: '5px 12px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--demo-surface-bg-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--demo-surface-bg)'; }}
      >
        ← Autre profil
      </button>

      <button
        onClick={onCreateAccount}
        style={{
          background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)', border: 'none',
          borderRadius: 20, color: '#fff', padding: '6px 14px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        🚀 Créer mon club
      </button>
    </div>
  );
}
