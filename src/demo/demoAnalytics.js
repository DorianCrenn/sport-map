const LS_KEY     = 'sl-demo-analytics';
const SESSION_KEY = 'sl-demo-session-start';
const MAX_EVENTS  = 100;

export function trackDemo(event, data = {}) {
  try {
    const entry = { event, data, ts: Date.now() };
    const log   = _readLog();
    log.push(entry);
    localStorage.setItem(LS_KEY, JSON.stringify(log.slice(-MAX_EVENTS)));
  } catch {
    // localStorage plein ou bloqué — ignoré silencieusement
  }
}

export function startDemoSession(profile) {
  sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  trackDemo('demo_started', { profile });
}

export function trackStep(stepIndex, stepTitle) {
  trackDemo(`demo_step`, { step: stepIndex + 1, title: stepTitle });
}

export function trackTourCompleted(profile) {
  const start  = parseInt(sessionStorage.getItem(SESSION_KEY) || '0');
  const elapsed = start ? Math.round((Date.now() - start) / 1000) : 0;
  trackDemo('demo_tour_completed', { profile, elapsed_seconds: elapsed });
}

export function trackSandboxEntered() {
  trackDemo('sandbox_entered', { ts: Date.now() });
}

export function trackCreateAccountClicked(source = 'banner') {
  const start   = parseInt(sessionStorage.getItem(SESSION_KEY) || '0');
  const elapsed = start ? Math.round((Date.now() - start) / 1000) : 0;
  trackDemo('create_account_clicked', { source, elapsed_seconds: elapsed });
}

export function trackDemoExited(currentStep) {
  trackDemo('demo_exited', { at_step: currentStep });
}

export function getDemoAnalytics() {
  return _readLog();
}

function _readLog() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}
