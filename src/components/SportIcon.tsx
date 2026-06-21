import { SPORT_ICONS } from './sportIcons.js';
import { useSports } from '../hooks/useSports.js';

interface SportIconProps { sport?: string | null; size?: number; color?: string; }

export default function SportIcon({ sport, size = 18, color }: SportIconProps) {
  const { allSports } = useSports();
  const sportData     = sport ? (allSports as Record<string, { iconId?: string; color?: string }>)[sport] : undefined;
  const icon          = sport ? ((SPORT_ICONS as Record<string, string>)[sport] ?? (sportData?.iconId ? (SPORT_ICONS as Record<string, string>)[sportData.iconId] : undefined)) : undefined;
  const resolvedColor = color ?? sportData?.color ?? '#6b7280';
  if (!icon) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ color: resolvedColor, display: 'block', flexShrink: 0 }}>
      {/* SECURITY: safe uniquement car SPORT_ICONS est une constante hardcodée dans sportIcons.js */}
      <g dangerouslySetInnerHTML={{ __html: icon }} />
    </svg>
  );
}
