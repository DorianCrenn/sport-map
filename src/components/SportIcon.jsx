import { SPORT_ICONS } from './sportIcons.js';
import { SPORTS } from '../data/events.js';

export default function SportIcon({ sport, size = 18, color }) {
  const icon = SPORT_ICONS[sport];
  const resolvedColor = color ?? SPORTS[sport]?.color ?? '#6b7280';
  if (!icon) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ color: resolvedColor, display: 'block', flexShrink: 0 }}
    >
      <g dangerouslySetInnerHTML={{ __html: icon }} />
    </svg>
  );
}
