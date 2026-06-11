import { useState, useEffect, useCallback, useRef } from 'react';
import { DemoContext } from './DemoContext.jsx';
import { loadTour }    from './tours/index.js';
import {
  startDemoSession, trackStep, trackTourCompleted,
  trackSandboxEntered, trackDemoExited,
} from './demoAnalytics.js';
import DemoBanner      from './DemoBanner.jsx';
import DemoLandingPage from './DemoLandingPage.jsx';
import DemoGuide       from './DemoGuide.jsx';

// AppInner is passed as a prop to avoid a circular import
export default function DemoApp({ AppInner }) {
  const [profile,     setProfile]     = useState(() => sessionStorage.getItem('sl-demo-profile') || null);
  const [currentStep, setCurrentStep] = useState(() => parseInt(sessionStorage.getItem('sl-demo-step') || '0', 10));
  const [isInSandbox, setIsInSandbox] = useState(false);
  const [tourSteps,   setTourSteps]   = useState(() => {
    const saved = sessionStorage.getItem('sl-demo-profile');
    return saved ? loadTour(saved) : [];
  });

  const showLanding = !profile;
  const firstNavDispatched = useRef(false);

  // Dispatch navigation when step changes (also handles first step after profile selection)
  useEffect(() => {
    if (showLanding || !tourSteps.length) return;
    const step = tourSteps[currentStep];
    if (!step) return;

    // Small delay: ensures App.jsx event listener and clubs are ready
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
    sessionStorage.setItem('sl-demo-profile', selectedProfile);
    sessionStorage.setItem('sl-demo-step',    '0');
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
  }, [tourSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => {
      const p = Math.max(prev - 1, 0);
      sessionStorage.setItem('sl-demo-step', String(p));
      return p;
    });
  }, []);

  const exitTour = useCallback(() => {
    trackTourCompleted(profile);
    setIsInSandbox(true);
    trackSandboxEntered();
    // Clear the overlay action so no modal stays open
    window.dispatchEvent(new CustomEvent('sl-demo-navigate', { detail: { action: 'close-overlay' } }));
  }, [profile]);

  const exitDemo = useCallback(() => {
    trackDemoExited(currentStep);
    sessionStorage.removeItem('sl-demo-profile');
    sessionStorage.removeItem('sl-demo-step');
    window.location.href = '/';
  }, [currentStep]);

  // ── Context value ──────────────────────────────────────────────────────────

  const contextValue = {
    profile,
    currentStep,
    tourSteps,
    isInSandbox,
    isLastStep:  currentStep === tourSteps.length - 1,
    startDemo,
    nextStep,
    prevStep,
    exitTour,
    exitDemo,
  };

  return (
    <DemoContext.Provider value={contextValue}>
      {/* AppInner always rendered — data loads in the background */}
      <AppInner />

      {/* Fixed demo banner — always visible in demo mode */}
      <DemoBanner onCreateAccount={() => {
        window.dispatchEvent(new CustomEvent('sl-demo-create-account', {}));
      }} />

      {/* Landing overlay — shown until profile is selected */}
      {showLanding && <DemoLandingPage onSelect={startDemo} />}

      {/* Guided tour overlay */}
      {!showLanding && !isInSandbox && tourSteps.length > 0 && currentStep < tourSteps.length && (
        <DemoGuide
          step={tourSteps[currentStep]}
          stepIndex={currentStep}
          totalSteps={tourSteps.length}
          position={tourSteps[currentStep]?.position ?? 'bottom'}
          onNext={nextStep}
          onPrev={prevStep}
          onExit={exitTour}
        />
      )}

      {/* Sandbox CTA — shown when tour is complete or sandbox entered */}
      {!showLanding && isInSandbox && (
        <SandboxBadge />
      )}
    </DemoContext.Provider>
  );
}

function SandboxBadge() {
  return (
    <div style={{
      position:   'fixed',
      bottom:     80,
      left:       '50%',
      transform:  'translateX(-50%)',
      zIndex:     9990,
      background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)',
      color:      '#fff',
      padding:    '8px 18px',
      borderRadius: 24,
      fontSize:   13,
      fontWeight: 600,
      boxShadow:  '0 4px 20px rgba(29,78,216,0.4)',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      display:    'flex',
      alignItems: 'center',
      gap:        8,
    }}>
      <span>🏖️</span>
      Mode sandbox — explorez librement
    </div>
  );
}
