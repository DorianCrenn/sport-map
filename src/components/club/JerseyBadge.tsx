// Maillot SVG avec le numéro dans le torse. Partagé entre l'onglet Saison et
// l'affiche partageable. Couleurs paramétrables pour s'adapter au fond (clair/sombre).
interface JerseyBadgeProps {
  number: number;
  accent: string;
  size?: number;
  numberColor?: string;
  fill?: string;
  stroke?: string;
}

const JERSEY_PATH =
  'M9 3.4 C9 4.5 10.2 5.2 12 5.2 C13.8 5.2 15 4.5 15 3.4 L18.6 5 L21.2 8.6 L18 11.1 ' +
  'L16.6 9.9 L16.6 20 C16.6 20.8 16 21.4 15.1 21.4 L8.9 21.4 C8 21.4 7.4 20.8 7.4 20 ' +
  'L7.4 9.9 L6 11.1 L2.8 8.6 L5.4 5 Z';

export default function JerseyBadge({ number, accent, size = 28, numberColor, fill, stroke }: JerseyBadgeProps) {
  const twoDigits = number > 9;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }} aria-label={`Maillot n°${number}`}>
      <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block' }} aria-hidden="true">
        <path d={JERSEY_PATH} fill={fill ?? `${accent}22`} stroke={stroke ?? accent} strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: size * 0.14, fontSize: size * (twoDigits ? 0.3 : 0.36), fontWeight: 900,
        color: numberColor ?? accent, lineHeight: 1,
      }}>
        {number}
      </span>
    </div>
  );
}
