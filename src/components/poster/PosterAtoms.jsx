// Shared UI primitives used across PosterStudio panels

export function SLabel({ children, accent }) {
  if (accent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, marginTop: 2 }}>
        <div style={{ width: 2, height: 13, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: accent }}>{children}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--sl-border)' }} />
      </div>
    );
  }
  return (
    <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 8, marginTop: 2 }}>
      {children}
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <SLabel>{label}</SLabel>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '9px 11px', borderRadius: 10, fontSize: 12, fontWeight: 500,
          border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)',
          color: 'var(--sl-t1)', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export function ColorSwatch({ color, active, onClick, size = 28 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: 8, backgroundColor: color, border: 'none', cursor: 'pointer',
        boxShadow: active ? `0 0 0 2px var(--sl-card), 0 0 0 4px ${color}` : '0 1px 3px rgba(0,0,0,0.25)',
        transition: 'box-shadow 0.15s', flexShrink: 0,
      }}
    />
  );
}

export function MiniToggle({ value, onChange, accent }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 28, height: 16, borderRadius: 8, cursor: 'pointer', position: 'relative',
        background: value ? accent : 'rgba(255,255,255,0.1)', transition: 'background 0.15s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: value ? 13 : 2, width: 12, height: 12,
        borderRadius: '50%', background: 'white', transition: 'left 0.15s',
      }} />
    </div>
  );
}

// ── Tab icons ──────────────────────────────────────────────────────────────────

export function IcoModeles({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  );
}
export function IcoEquipes({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
export function IcoStyle({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  );
}
export function IcoFond({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  );
}
export function IcoJoueurs({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeOpacity="0.5"/>
    </svg>
  );
}
export function IcoExporter({ c }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}
