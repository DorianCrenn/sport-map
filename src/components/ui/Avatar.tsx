interface AvatarProps { name?: string | null; size?: number; }

export default function Avatar({ name, size = 28 }: AvatarProps) {
  const initials = (name ?? '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const hue = [...(name ?? '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.36), fontWeight: 800, color: '#fff', backgroundColor: `hsl(${hue},55%,45%)` }}>
      {initials}
    </div>
  );
}
