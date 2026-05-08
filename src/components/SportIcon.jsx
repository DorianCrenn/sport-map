import { SPORT_ICONS } from './sportIcons.js';
import { useSports } from '../hooks/useSports.js';

export default function SportIcon({ sport, size = 18, color }) {
  const { allSports } = useSports();
  const icon = SPORT_ICONS[sport];
  const resolvedColor = color ?? allSports[sport]?.color ?? '#6b7280';
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
