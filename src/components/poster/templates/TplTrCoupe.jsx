import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function ShieldSvg({ size = 60, color = '#C0A060' }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 60 69" fill="none">
      <path d="M30 2L4 12V34C4 50 16 63 30 67C44 63 56 50 56 34V12L30 2Z" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5" opacity2="0.6"/>
      <path d="M30 8L10 17V34C10 47 19 57 30 61C41 57 50 47 50 34V17L30 8Z" fill={color} opacity="0.08"/>
      <path d="M21 33L27 39L40 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
    </svg>
  );
}

export default function TplTrCoupe({ event, homeTeam, championship, tagline, accentColor = '#C0A060', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'COUPE NATIONALE';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;
  const prize = event?.prize;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#0B1628', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,22,40,0.93)' }} />
      </>}

      {/* Subtle diagonal lines — official feel */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: -200, left: `${i * 35}px`, width: 1, height: h + 400, background: a, transform: 'rotate(15deg)' }} />
        ))}
      </div>

      {/* Top ribbon */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? 6 : 5, background: `linear-gradient(90deg, ${a}, #fff5, ${a})` }} />

      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 14, left: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M1 11 L1 1 L11 1" stroke={`${a}60`} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M21 11 L21 1 L11 1" stroke={`${a}60`} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M1 11 L1 21 L11 21" stroke={`${a}60`} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M21 11 L21 21 L11 21" stroke={`${a}60`} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Gold glow */}
      <div style={{ position: 'absolute', top: isStory ? '15%' : '10%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${a}15 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isStory ? '30px 26px 26px' : '22px 24px 20px' }}>

        {/* Shield + organizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isStory ? 12 : 8 }}>
          <div style={{ marginBottom: 6, filter: `drop-shadow(0 4px 20px ${a}50)` }}>
            <ShieldSvg size={isStory ? 58 : 44} color={a} />
          </div>
          {organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'contain' }} />}
              <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.32em', color: `${a}90`, textTransform: 'uppercase' }}>{organizer}</span>
            </div>
          )}
        </div>

        {/* Label */}
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.5em', color: `${a}55`, textTransform: 'uppercase', marginBottom: 10 }}>
          ✦ COUPE OFFICIELLE ✦
        </div>

        {/* Name */}
        <div data-block="title" style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 32 : 23, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 300 }}>
            {truncate(tName, 36)}
          </div>

          {/* Gold ornament divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: isStory ? '16px auto' : '10px auto', width: '75%' }}>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, transparent, ${a}55)` }} />
            <svg width="16" height="16" viewBox="0 0 16 16" fill={a} opacity="0.7">
              <polygon points="8,1 10,6 16,6 11,10 13,15 8,12 3,15 5,10 0,6 6,6"/>
            </svg>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${a}55, transparent)` }} />
          </div>

          {/* Pills */}
          <div data-block="champ" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 7, ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#0B1628', backgroundColor: a, padding: '3px 12px', borderRadius: 16 }}>{numTeams} ÉQUIPES</span>
            )}
            {tType && (
              <span style={{ fontSize: 9, fontWeight: 600, color: `${a}CC`, border: `1px solid ${a}40`, padding: '3px 10px', borderRadius: 16 }}>{tType}</span>
            )}
            {cats.slice(0, 2).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 16 }}>{c}</span>
            ))}
            {prize && (
              <span style={{ fontSize: 9, fontWeight: 600, color: `${a}BB`, padding: '3px 10px', border: `1px solid ${a}30`, borderRadius: 16 }}>🏆 {prize}</span>
            )}
          </div>
        </div>

        {/* Bottom ribbon */}
        <div style={{ width: '100%', borderTop: `1px solid ${a}22`, paddingTop: 14 }}>
          <div data-block="meta" style={{ textAlign: 'center', ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 16 : 12, fontWeight: 800, color: a, letterSpacing: '0.06em' }}>
              {dt.weekday} {dt.day} {dt.month}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.36)', marginTop: 4 }}>
              {dt.time} · {event?.venue || event?.city || '—'}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
              <span style={{ fontSize: 8, letterSpacing: '0.4em', color: `${a}32`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
