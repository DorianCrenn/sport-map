import { SPORT_ICONS } from './sportIcons.js';
import { useSports } from '../hooks/useSports.js';

export default function SportIcon({ sport, size = 18, color }) {
  const { allSports } = useSports();
  const sportData = allSports[sport];
  const icon = SPORT_ICONS[sport] ?? SPORT_ICONS[sportData?.iconId];
  const resolvedColor = color ?? sportData?.color ?? '#6b7280';
  if (!icon) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ color: resolvedColor, display: 'block', flexShrink: 0 }}
    >
      {/* SECURITY: safe uniquement car SPORT_ICONS est une constante hardcodée dans sportIcons.js.
          Si les icônes deviennent éditables par des utilisateurs, passer par DOMPurify avec USE_PROFILES:{svg:true}. */}
      <g dangerouslySetInnerHTML={{ __html: icon }} />
    </svg>
  );
}
