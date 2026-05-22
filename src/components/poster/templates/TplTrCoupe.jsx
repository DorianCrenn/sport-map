import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrCoupe({ event, homeTeam, championship, tagline, accentColor = '#C0A060', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const gold = '#C0A060';
  const navy = '#0B1628';
  const tName = event?.tournamentName || championship || 'COUPE NATIONALE';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: navy, boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,22,40,0.93)' }} />
      </>}

      {/* Diagonal lines — official feel */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: -200, left: `${i * 32}px`, width: 1, height: h + 400, background: gold, transform: 'rotate(15deg)' }} />
        ))}
      </div>

      {/* Sport ball watermark */}
      <div style={{ position: 'absolute', top: isStory ? '15%' : '10%', right: -20, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'handball'} size={isStory ? 170 : 130} color={gold} opacity={0.05} />
      </div>

      {/* Top ribbon */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? 5 : 4, background: `linear-gradient(90deg, ${gold}, rgba(255,255,255,0.3), ${gold})` }} />

      {/* Corner ornaments */}
      {[['top', 'left', 'M1 11 L1 1 L11 1'], ['top', 'right', 'M21 11 L21 1 L11 1'], ['bottom', 'left', 'M1 11 L1 21 L11 21'], ['bottom', 'right', 'M21 11 L21 21 L11 21']].map(([v, h2, path], i) => (
        <div key={i} style={{ position: 'absolute', [v]: 14, [h2]: 14 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d={path} stroke={`${gold}55`} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      ))}

      {/* Gold glow */}
      <div style={{ position: 'absolute', top: isStory ? '12%' : '8%', left: '50%', transform: 'translateX(-50%)', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${gold}14 0%, transparent 62%)`, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isStory ? '28px 26px 24px' : '20px 22px 18px' }}>

        {/* Shield SVG + organizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isStory ? 10 : 6 }}>
          <div style={{ filter: `drop-shadow(0 4px 18px ${gold}45)`, marginBottom: 6 }}>
            <svg width={isStory ? 54 : 40} height={isStory ? 63 : 47} viewBox="0 0 60 69" fill="none">
              <path d="M30 2L4 12V34C4 50 16 63 30 67C44 63 56 50 56 34V12L30 2Z" fill={gold} opacity="0.14" stroke={gold} strokeWidth="1.5" />
              <path d="M30 8L10 17V34C10 47 19 57 30 61C41 57 50 47 50 34V17L30 8Z" fill={gold} opacity="0.07" />
              <path d="M21 33L27 39L40 26" stroke={gold} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </svg>
          </div>
          {organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'contain' }} />}
              <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.32em', color: `${gold}85`, textTransform: 'uppercase' }}>{organizer}</span>
            </div>
          )}
        </div>

        {/* Sport + label */}
        <div style={{ textAlign: 'center', marginBottom: isStory ? 10 : 6 }}>
          {event?.sport && <div style={{ fontSize: 7.5, fontWeight: 700, color: sport.accent, letterSpacing: '0.28em', marginBottom: 4, opacity: 0.8 }}>{event.sport.toUpperCase()}</div>}
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.5em', color: `${gold}50`, textTransform: 'uppercase' }}>✦ COUPE OFFICIELLE ✦</div>
        </div>

        {/* Tournament name */}
        <div data-block="title" style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 32 : 24, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 295 }}>
            {truncate(tName, 36)}
          </div>

          {/* Gold ornament divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: isStory ? '14px auto' : '10px auto', width: '70%' }}>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, transparent, ${gold}50)` }} />
            <svg width="14" height="14" viewBox="0 0 16 16" fill={gold} opacity="0.65">
              <polygon points="8,1 10,6 16,6 11,10 13,15 8,12 3,15 5,10 0,6 6,6" />
            </svg>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${gold}50, transparent)` }} />
          </div>

          {/* Tournament type */}
          {event?.tournamentType && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.22em' }}>{event.tournamentType}</span>
            </div>
          )}

          {/* Categories */}
          {event?.tournamentCategories && (
            <div data-block="champ" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14, ...tr('champ') }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 700, color: navy, backgroundColor: gold, padding: '2px 10px', borderRadius: 14, opacity: 0.9 }}>{c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={gold} dimColor={`${gold}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ width: '100%', borderTop: `1px solid ${gold}20`, paddingTop: 13 }}>
          <div data-block="meta" style={{ textAlign: 'center', ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 800, color: gold, letterSpacing: '0.05em' }}>
              {dt.weekday} {dt.day} {dt.month}
            </div>
            <div style={{ fontSize: venueFs(event?.venue || event?.city || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.33)', marginTop: 3, fontWeight: 600 }}>
              {dt.time !== '—' ? `${dt.time} · ` : ''}{event?.venue || event?.city || '—'}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
              <span style={{ fontSize: 7.5, letterSpacing: '0.4em', color: `${gold}30`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
