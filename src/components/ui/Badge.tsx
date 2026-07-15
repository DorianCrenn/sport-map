interface BadgeProps { color: string; label: string; size?: 'sm' | 'md'; className?: string; }

export default function Badge({ color, label, size = 'sm', className = '' }: BadgeProps) {
  const padding  = size === 'sm' ? '2px 6px' : '4px 10px';
  const fontSize = size === 'sm' ? 10 : 12;
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', padding, borderRadius: 'var(--sl-radius-sm)', fontSize, fontWeight: 700, color, backgroundColor: `${color}20`, flexShrink: 0, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}
