/**
 * Bouton icône réutilisable (touch target ≥ 44px).
 * Remplace les ~20 inline patterns { width:44, height:44, borderRadius:12, backgroundColor:'var(--sl-surface)', display:'flex', alignItems:'center', justifyContent:'center' }
 */
export default function IconButton({
  onClick,
  children,
  size = 44,
  radius = 12,
  color = 'var(--sl-t2)',
  bg = 'var(--sl-surface)',
  border = 'none',
  style = {},
  disabled = false,
  'aria-label': ariaLabel,
  title,
  className = '',
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        border,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        padding: 0,
        flexShrink: 0,
        transition: 'background-color 0.15s, color 0.15s',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
