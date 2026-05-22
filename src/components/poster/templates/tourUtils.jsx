import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';
export { fmtDate, truncate, blockStyle, venueFs };

export function getSportMeta(sport = '') {
  const s = (sport || '').toLowerCase();
  if (s.includes('football') || s.includes('foot') || s.includes('soccer'))
    return { unit: 'ÉQUIPES', icon: 'football', primary: '#16a34a', accent: '#4ade80', dark: '#052e16', glow: '#22c55e' };
  if (s.includes('tennis'))
    return { unit: 'JOUEURS', icon: 'tennis', primary: '#D97706', accent: '#FCD34D', dark: '#451A03', glow: '#F59E0B' };
  if (s.includes('basket'))
    return { unit: 'ÉQUIPES', icon: 'basketball', primary: '#EA580C', accent: '#FB923C', dark: '#431407', glow: '#F97316' };
  if (s.includes('handball') || s.includes('hand'))
    return { unit: 'ÉQUIPES', icon: 'handball', primary: '#2563EB', accent: '#60A5FA', dark: '#1E1B4B', glow: '#3B82F6' };
  if (s.includes('volley'))
    return { unit: 'ÉQUIPES', icon: 'volleyball', primary: '#7C3AED', accent: '#A78BFA', dark: '#2E1065', glow: '#8B5CF6' };
  if (s.includes('padel') || s.includes('squash'))
    return { unit: 'JOUEURS', icon: 'tennis', primary: '#0EA5E9', accent: '#38BDF8', dark: '#082f49', glow: '#06B6D4' };
  if (s.includes('badminton'))
    return { unit: 'JOUEURS', icon: 'tennis', primary: '#10B981', accent: '#34D399', dark: '#064E3B', glow: '#059669' };
  if (s.includes('rugby'))
    return { unit: 'ÉQUIPES', icon: 'football', primary: '#DC2626', accent: '#F87171', dark: '#450A0A', glow: '#EF4444' };
  return { unit: 'ÉQUIPES', icon: 'generic', primary: '#6D28D9', accent: '#A78BFA', dark: '#1E1B4B', glow: '#7C3AED' };
}

function FootballSVG({ size = 70, color = '#fff', opacity = 0.12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity, display: 'block', flexShrink: 0 }}>
      <circle cx="35" cy="35" r="32" stroke={color} strokeWidth="1.5" fill="none" />
      <polygon points="35,8 43,23 27,23" fill={color} />
      <polygon points="59,26 52,37 58,48" fill={color} />
      <polygon points="48,58 40,52 40,40 30,40 30,52 22,58" fill={color} />
      <polygon points="11,26 18,37 12,48" fill={color} />
      <polygon points="35,10 43,25 49,35 43,45 27,45 21,35 27,25" fill={color} opacity="0.5" stroke={color} strokeWidth="1" />
    </svg>
  );
}

function TennisSVG({ size = 70, color = '#fff', opacity = 0.12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity, display: 'block', flexShrink: 0 }}>
      <circle cx="35" cy="35" r="32" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M5,35 Q20,10 35,35 Q50,60 65,35" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M5,35 Q20,60 35,35 Q50,10 65,35" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BasketballSVG({ size = 70, color = '#fff', opacity = 0.12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity, display: 'block', flexShrink: 0 }}>
      <circle cx="35" cy="35" r="32" stroke={color} strokeWidth="1.5" fill="none" />
      <line x1="35" y1="3" x2="35" y2="67" stroke={color} strokeWidth="2" />
      <line x1="3" y1="35" x2="67" y2="35" stroke={color} strokeWidth="2" />
      <path d="M14,14 Q35,35 14,56" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M56,14 Q35,35 56,56" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function HandballSVG({ size = 70, color = '#fff', opacity = 0.12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 70 70" fill="none" style={{ opacity, display: 'block', flexShrink: 0 }}>
      <circle cx="35" cy="35" r="32" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="35" cy="35" r="18" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="35" cy="35" r="5" fill={color} opacity="0.7" />
      <line x1="35" y1="3" x2="35" y2="17" stroke={color} strokeWidth="2" />
      <line x1="35" y1="53" x2="35" y2="67" stroke={color} strokeWidth="2" />
      <line x1="3" y1="35" x2="17" y2="35" stroke={color} strokeWidth="2" />
      <line x1="53" y1="35" x2="67" y2="35" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export function SportBall({ sport = '', size = 70, color = '#fff', opacity = 0.12 }) {
  const s = sport.toLowerCase();
  if (s.includes('tennis') || s.includes('padel') || s.includes('squash') || s.includes('badminton'))
    return <TennisSVG size={size} color={color} opacity={opacity} />;
  if (s.includes('basket')) return <BasketballSVG size={size} color={color} opacity={opacity} />;
  if (s.includes('handball') || s.includes('hand')) return <HandballSVG size={size} color={color} opacity={opacity} />;
  return <FootballSVG size={size} color={color} opacity={opacity} />;
}

function PeopleIcon({ size = 13, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ size = 13, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TrophyIcon({ size = 13, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export function InfoRow({ numTeams, tournamentFormat, prize, unit = 'ÉQUIPES', color = '#fff', dimColor, isStory = true }) {
  const dc = dimColor || color;
  const items = [];
  if (numTeams) items.push({ Icon: PeopleIcon, label: String(numTeams), sub: unit });
  if (tournamentFormat) items.push({ Icon: CalendarIcon, label: truncate(tournamentFormat, 12), sub: 'FORMAT' });
  if (prize) items.push({ Icon: TrophyIcon, label: truncate(prize, 14), sub: 'DOTATION' });
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', gap: isStory ? 16 : 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {items.map(({ Icon, label, sub }, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon size={isStory ? 13 : 11} color={color} />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: isStory ? 13 : 11, fontWeight: 900, color, whiteSpace: 'nowrap' }}>{label}</div>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', color: dc, opacity: 0.6, textTransform: 'uppercase', marginTop: 1 }}>{sub}</div>
          </div>
          {i < items.length - 1 && <span style={{ color, opacity: 0.15, fontSize: 18, marginLeft: 2 }}>·</span>}
        </div>
      ))}
    </div>
  );
}
