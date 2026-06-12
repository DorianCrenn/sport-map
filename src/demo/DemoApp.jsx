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

// AppInner est passé en prop pour éviter l'import circulaire
export default function DemoApp({ AppInner }) {
  const [profile,           setProfile]           = useState(() => {
    // Ne reprendre une session que si elle a été initialisée dans CETTE navigation
    if (!sessionStorage.getItem('sl-demo-initialized')) {
      sessionStorage.removeItem('sl-demo-profile');
      sessionStorage.removeItem('sl-demo-step');
      return null;
    }
    return sessionStorage.getItem('sl-demo-profile') || null;
  });
  const [currentStep,       setCurrentStep]       = useState(() => {
    if (!sessionStorage.getItem('sl-demo-initialized')) return 0;
    return parseInt(sessionStorage.getItem('sl-demo-step') || '0', 10);
  });
  const [isInSandbox,       setIsInSandbox]       = useState(false);
  const [showSandboxWelcome,setShowSandboxWelcome] = useState(false);
  const [spotlightActive,   setSpotlightActive]   = useState(false);
  const [tourSteps,         setTourSteps]         = useState(() => {
    const saved = sessionStorage.getItem('sl-demo-profile');
    return saved ? loadTour(saved) : [];
  });

  const showLanding        = !profile;
  const firstNavDispatched = useRef(false);

  const currentTarget = tourSteps[currentStep]?.target ?? null;
  // Auto-spotlight sur les étapes avec target mais sans tryItAction
  const autoSpotlight = !!currentTarget && !tourSteps[currentStep]?.tryItAction;
  const showSpotlight = (autoSpotlight || spotlightActive) && !showLanding && !isInSandbox && !showSandboxWelcome;

  // Dispatch navigation à chaque changement d'étape
  useEffect(() => {
    if (showLanding || !tourSteps.length) return;
    const step = tourSteps[currentStep];
    if (!step) return;

    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sl-demo-navigate', {
        detail: { tab: step.tab, action: step.action, stepId: step.id },
      }));
    }, firstNavDispatched.current ? 80 : 400);

    firstNavDispatched.current = true;
    return () => clearTimeout(timer);
  }, [currentStep, tourSteps, showLanding]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const startDemo = useCallback((selectedProfile) => {
    const steps = loadTour(selectedProfile);
    setProfile(selectedProfile);
    setTourSteps(steps);
    setCurrentStep(0);
    firstNavDispatched.current = false;
    sessionStorage.setItem('sl-demo-initialized', 'true');
    sessionStorage.setItem('sl-demo-profile', selectedProfile);
    sessionStorage.setItem('sl-demo-step', '0');
    window.dispatchEvent(new CustomEvent('sl-demo-profile-selected', { detail: { profile: selectedProfile } }));
    startDemoSession(selectedProfile);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, tourSteps.length - 1);
      sessionStorage.setItem('sl-demo-step', String(next));
      const step = tourSteps[next];
      if (step) trackStep(next, step.title);
      return next;
    });
    setSpotlightActive(false);
  }, [tourSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = Math.max(prev - 1, 0);
      sessionStorage.setItem('sl-demo-step', String(p));
      return p;
    });
    setSpotlightActive(false);
  }, []);

  const exitTour = useCallback(() => {
    trackTourCompleted(profile);
    setSpotlightActive(false);
    setShowSandboxWelcome(true);
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'close-overlay' } }));
  }, [profile]);

  const enterSandbox = useCallback(() => {
    setShowSandboxWelcome(false);
    setIsInSandbox(true);
    trackSandboxEntered();
  }, []);

  const exitDemo = useCallback(() => {
    trackDemoExited(currentStep);
    sessionStorage.removeItem('sl-demo-initialized');
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    window.location.href = '/';
  }, [currentStep]);

  const replayTour = useCallback(() => {
    setIsInSandbox(false);
    setCurrentStep(0);
    firstNavDispatched.current = false;
    sessionStorage.setItem('sl-demo-step', '0');
    startDemoSession(profile);
  }, [profile]);

  const changeProfile = useCallback(() => {
    sessionStorage.removeItem('sl-demo-initialized');
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    setProfile(null);
    setTourSteps([]);
    setCurrentStep(0);
    setIsInSandbox(false);
    setShowSandboxWelcome(false);
    setSpotlightActive(false);
    firstNavDispatched.current = false;
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'close-overlay' } }));
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const contextValue = {
    profile, currentStep, tourSteps, isInSandbox,
    isLastStep:     currentStep === tourSteps.length - 1,
    spotlightTarget: currentTarget,
    spotlightActive: showSpotlight,
    startDemo, nextStep, prevStep, exitTour, exitDemo,
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {/* App complète — les données chargent en arrière-plan */}
      <AppInner />

      {/* Bandeau fixe — toujours visible */}
      <DemoBanner onCreateAccount={() => {
        window.dispatchEvent(new CustomEvent('sl-demo-create-account', {}));
      }} />

      {/* Overlay de sélection de profil */}
      <AnimatePresence>
        {showLanding && <DemoLandingPage onSelect={startDemo} />}
      </AnimatePresence>

      {/* Spotlight sur l'élément cible */}
      <DemoSpotlight target={currentTarget} active={showSpotlight} />

      {/* Guide guidé */}
      {!showLanding && !isInSandbox && !showSandboxWelcome && tourSteps.length > 0 && currentStep < tourSteps.length && (
        <DemoGuide
          step={tourSteps[currentStep]}
          stepIndex={currentStep}
          totalSteps={tourSteps.length}
          position={tourSteps[currentStep]?.position ?? 'bottom'}
          onNext={nextStep}
          onPrev={prevStep}
          onExit={exitTour}
          onChangeProfile={changeProfile}
          onTryItActivate={(active) => {
            setSpotlightActive(active);
          }}
        />
      )}

      {/* Écran de félicitations post-tour */}
      <AnimatePresence>
        {showSandboxWelcome && (
          <SandboxWelcome
            profile={profile}
            completedSteps={tourSteps.length}
            onEnterSandbox={enterSandbox}
            onChangeProfile={changeProfile}
            onCreateAccount={() => {
              window.location.assign('/#register');
            }}
          />
        )}
      </AnimatePresence>

      {/* Badge sandbox */}
      {!showLanding && isInSandbox && (
        <SandboxBadge
          profile={profile}
          stepCount={tourSteps.length}
          onCreateAccount={() => window.location.assign('/#register')}
          onReplayTour={replayTour}
        />
      )}
    </DemoContext.Provider>
  );
}

function SandboxBadge({ profile, onCreateAccount, onReplayTour }) {
  const emoji = PROFILE_EMOJIS[profile] || '🏖️';

  return (
    <div style={{
      position:     'fixed',
      bottom:       80,
      left:         '50%',
      transform:    'translateX(-50%)',
      zIndex:       9990,
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      background:   'rgba(10,14,28,0.96)',
      backdropFilter: 'blur(16px)',
      border:       '1px solid rgba(99,102,241,0.3)',
      borderRadius: 28,
      padding:      '8px 8px 8px 14px',
      boxShadow:    '0 4px 24px rgba(0,0,0,0.5)',
      whiteSpace:   'nowrap',
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>
        Sandbox
      </span>

      <button
        onClick={onReplayTour}
        style={{
          background:   'rgba(255,255,255,0.06)',
          border:       '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20,
          color:        'rgba(255,255,255,0.5)',
          padding:      '5px 12px',
          fontSize:     11,
          fontWeight:   600,
          cursor:       'pointer',
          transition:   'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      >
        Revoir la visite
      </button>

      <button
        onClick={onCreateAccount}
        style={{
          background:   'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          border:       'none',
          borderRadius: 20,
          color:        '#fff',
          padding:      '6px 14px',
          fontSize:     12,
          fontWeight:   700,
          cursor:       'pointer',
          transition:   'opacity 0.2s',
          animation:    'sl-demo-pulse 2.5s ease-in-out infinite',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        🚀 Créer mon club
      </button>
    </div>
  );
}
