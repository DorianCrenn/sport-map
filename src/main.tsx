import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AttendeeCountProvider } from './contexts/AttendeeCountContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    // N'envoyer que 10% des traces de performance en prod pour limiter le quota
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Ne pas envoyer les erreurs en dev sauf si DSN explicitement configuré
    enabled: import.meta.env.PROD || !!SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    // Ignorer les erreurs réseau inoffensives
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'NetworkError',
      'Failed to fetch',
      'Load failed',
    ],
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AttendeeCountProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AttendeeCountProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
