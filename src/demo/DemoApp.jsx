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
// Version du système démo — incrémenter pour forcer un reset chez tous les utilisateurs
const DEMO_VERSION = '4';

export default function DemoApp({ AppInner }) {
  const [profile,            setProfile]            = useState(() => {
    // Reset si version démo changée (invalide les sessions en cache navigateur)
    if (sessionStorage.getItem('sl-demo-version') !== DEMO_VERSION) {
      ['sl-demo-initialized','sl-demo-profile','sl-demo-step','sl-demo-sandbox','sl-demo-version'].forEach(k => sessionStorage.removeItem(k));
      sessionStorage.setItem('sl-demo-version', DEMO_VERSION);
      return null;
    }
    // Toujours repartir de la landing page quelle que soit la session précédente
    ['sl-demo-initialized','sl-demo-profile','sl-demo-step','sl-demo-sandbox'].forEach(k => sessionStorage.removeItem(k));
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

  const showLanding = !profile;
  const step        = tourSteps[currentStep] ?? null;

  // Le spotlight est actif sur les étapes interactives hors sandbox/landing
  const spotlightActive = isInteractiveStep(step) && !showLanding && !isInSandbox && !showSandboxWelcome;

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

      const clickedEl    = e.target.closest('[data-demo]');
      const clickedAttr  = clickedEl?.getAttribute('data-demo');

      if (clickedAttr === s.clickTarget) {
        // ✅ Bonne cible cliquée
        if (s.tryItAction) {
          // Pour les try-it, avancement déclenché par sl-demo-action, pas par le clic
          setTryItInProgress(true);
        } else {
          // Simple clic → avancer avec un léger délai (laisse l'action naturelle se faire)
          setTimeout(() => nextStepRef.current?.(), 250);
        }
      } else if (!tryItInProgress) {
        // ❌ Mauvaise cible → shake
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
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

  // ── Fermeture des overlays au changement d'étape ────────────────────────
  useEffect(() => {
    if (showLanding || !step) return;
    // Fermer les overlays ouverts (formulaire, annonces, etc.) si l'étape demande
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', {
      detail: { action: step.closeOverlayBefore ? 'close-overlay' : null },
    }));
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
      position:       'fixed', bottom: 80, left: '50%',
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
