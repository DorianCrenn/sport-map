import { Component, type ReactNode, type ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';

interface Props { children: ReactNode; name?: string; onReport?: (info: { type: string; title: string; description: string; category: string }) => void; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { error: null }; }

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const boundary = this.props.name ?? 'page';
    console.error('[ErrorBoundary]', boundary, error, info.componentStack);
    // Remontée automatique à Sentry (no-op si VITE_SENTRY_DSN absent).
    // Sans ça, un crash non signalé manuellement par l'utilisateur reste invisible.
    Sentry.captureException(error, {
      tags: { boundary },
      extra: { componentStack: info.componentStack },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 28, textAlign: 'center', backgroundColor: 'var(--sl-bg)', color: 'var(--sl-t1)' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--sl-t1)' }}>Une erreur est survenue</div>
        <div style={{ fontSize: 12, color: 'var(--sl-t3)', maxWidth: 280 }}>{this.state.error.message}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={() => this.setState({ error: null })} style={{ padding: '10px 22px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: 'var(--sl-green)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Réessayer</button>
          {this.props.onReport && (
            <button onClick={() => this.props.onReport!({ type: 'bug', title: `Erreur : ${this.state.error?.message ?? 'inconnue'}`, description: this.state.error?.stack ?? '', category: 'crash' })} style={{ padding: '10px 18px', borderRadius: 'var(--sl-radius-lg)', border: '1.5px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Signaler le problème</button>
          )}
        </div>
      </div>
    );
  }
}
