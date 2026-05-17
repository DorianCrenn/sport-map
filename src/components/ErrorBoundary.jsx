import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.name ?? 'page', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 10, padding: 28, textAlign: 'center',
        backgroundColor: 'var(--sl-bg)', color: 'var(--sl-t1)',
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--sl-t1)' }}>Une erreur est survenue</div>
        <div style={{ fontSize: 12, color: 'var(--sl-t3)', maxWidth: 280 }}>
          {this.state.error.message}
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          style={{
            marginTop: 6, padding: '10px 22px', borderRadius: 10, border: 'none',
            backgroundColor: 'var(--sl-green)', color: '#fff', fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }
}
