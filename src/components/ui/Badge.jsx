/**
 * Composant Badge coloré réutilisable.
 * Remplace les ~20 inline patterns { fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:6, color:meta.color, bg:${color}20 }
 */
export default function Badge({ color, label, size = 'sm', className = '' }) {
  const padding = size === 'sm' ? '2px 6px' : '4px 10px';
  const fontSize = size === 'sm' ? 10 : 12;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: 6,
        fontSize,
        fontWeight: 700,
        color,
        backgroundColor: `${color}20`,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
