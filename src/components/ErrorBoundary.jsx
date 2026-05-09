import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: 32, background: '#f8fafc', textAlign: 'center' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 20 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Une erreur est survenue</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, maxWidth: 280 }}>
          Quelque chose s'est mal passé. Essaie de recharger la page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: '#22C55E', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Recharger l'application
        </button>
      </div>
    );
  }
}
