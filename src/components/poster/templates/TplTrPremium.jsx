import { fmtDate, truncate, blockStyle, venueFs, initials } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function TrophySvg({ size = 64, color = '#C9A84C' }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" fill="none">
      <path d="M22 8H58V38C58 56 40 66 40 66C40 66 22 56 22 38Z" fill={color} opacity="0.92"/>
      <path d="M22 16C14 16 8 24 8 30C8 38 16 43 22 39" stroke={color} strokeWidth="4.5" fill="none" opacity="0.65"/>
      <path d="M58 16C66 16 72 24 72 30C72 38 64 43 58 39" stroke={color} strokeWidth="4.5" fill="none" opacity="0.65"/>
      <rect x="35" y="66" width="10" height="14" fill={color} opacity="0.8"/>
      <rect x="24" y="80" width="32" height="8" rx="4" fill={color} opacity="0.9"/>
      <path d="M32 18C32 18 36 32 34 44" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="40" cy="12" r="5" fill={color} opacity="0.75"/>
    </svg>
  );
}

export default function TplTrPremium({ event, homeTeam, championship, tagline, accentColor = '#C9A84C', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const prize = event?.prize;
  const organizer = event?.organizer || homeTeam?.name;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#07080D', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,8,13,0.91)' }} />
      </>}

      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `linear-gradient(${a}80 1px, transparent 1px), linear-gradient(90deg, ${a}80 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />

      {/* Gold radial glow */}
      <div style={{ position: 'absolute', top: isStory ? '14%' : '10%', left: '50%', transform: 'translateX(-50%)', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${a}1A 0%, transparent 62%)`, pointerEvents: 'none' }} />

      {/* Corner brackets */}
      {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h2], i) => (
        <div key={i} style={{ position: 'absolute', [v]: 18, [h2]: 18, width: 28, height: 28, borderTop: v === 'top' ? `1.5px solid ${a}60` : 'none', borderBottom: v === 'bottom' ? `1.5px solid ${a}60` : 'none', borderLeft: h2 === 'left' ? `1.5px solid ${a}60` : 'none', borderRight: h2 === 'right' ? `1.5px solid ${a}60` : 'none' }} />
      ))}

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isStory ? '36px 28px 28px' : '24px 24px 22px' }}>

        {/* Organizer row */}
        {organizer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 14 : 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain' }} />}
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.34em', color: `${a}80`, textTransform: 'uppercase' }}>{organizer}</span>
          </div>
        )}

        {/* Trophy */}
        <div style={{ marginBottom: isStory ? 12 : 6, filter: `drop-shadow(0 6px 28px ${a}55)` }}>
          <TrophySvg size={isStory ? 66 : 50} color={a} />
        </div>

        {/* Grand Tournoi label */}
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.55em', color: `${a}65`, textTransform: 'uppercase', marginBottom: 14 }}>◆ GRAND TOURNOI ◆</div>

        {/* Tournament name */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', width: '100%', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 36 : 26, fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-0.025em', maxWidth: 300, margin: '0 auto' }}>
            {truncate(tName, 34)}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: isStory ? '20px auto' : '14px auto', width: '70%' }}>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, transparent, ${a}55)` }} />
            <span style={{ fontSize: 11, color: a }}>◆</span>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${a}55, transparent)` }} />
          </div>

          {/* Pills */}
          <div data-block="champ" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#07080D', backgroundColor: a, padding: '4px 14px', borderRadius: 20 }}>{numTeams} ÉQUIPES</span>
            )}
            {tType && (
              <span style={{ fontSize: 9, fontWeight: 600, color: `${a}CC`, border: `1px solid ${a}40`, padding: '3px 12px', borderRadius: 20 }}>{tType}</span>
            )}
            {cats.slice(0,2).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
            ))}
            {prize && (
              <span style={{ fontSize: 9, fontWeight: 600, color: `${a}BB`, border: `1px solid ${a}30`, padding: '3px 12px', borderRadius: 20 }}>🏆 {prize}</span>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ width: '100%', borderTop: `1px solid ${a}22`, paddingTop: 14 }}>
          <div data-block="meta" style={{ textAlign: 'center', ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 800, color: a, letterSpacing: '0.04em' }}>
              {dt.weekday} {dt.day} {dt.month}
            </div>
            <div style={{ fontSize: isStory ? 11 : 10, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>
              {dt.time} · {event?.venue || event?.city || '—'}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
              <span style={{ fontSize: 8, letterSpacing: '0.38em', color: `${a}35`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
