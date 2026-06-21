
interface EmptyStateProps { emoji?: string; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void; }

export default function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 8 }}>
      {emoji && <span style={{ fontSize: 40, lineHeight: 1, marginBottom: 4, userSelect: 'none' }}>{emoji}</span>}
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', margin: 0, fontFamily: 'Poppins, sans-serif' }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: 0, maxWidth: 220, lineHeight: 1.5 }}>{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} style={{ marginTop: 8, padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', backgroundColor: 'var(--sl-green)', boxShadow: 'var(--sl-green-glow)' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
