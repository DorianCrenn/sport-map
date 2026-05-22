import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrNeon({ event, homeTeam, championship, tagline, accentColor = '#00E5FF', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.glow : accentColor;
  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const organizer = event?.organizer || homeTeam?.name;
  const vLines = 9;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#030B18', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,11,24,0.93)' }} />
      </>}

      {/* Perspective grid — bottom half */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '42%' : '36%', overflow: 'hidden', opacity: 0.2 }}>
        {Array.from({ length: vLines }).map((_, i) => {
          const x = 180 + (i - Math.floor(vLines / 2)) * 50;
          const angle = (i - Math.floor(vLines / 2)) * 3.5;
          return <div key={i} style={{ position: 'absolute', bottom: 0, left: x, width: 1, height: '100%', background: `linear-gradient(0deg, ${a} 0%, transparent 100%)`, transform: `rotate(${angle}deg)`, transformOrigin: 'bottom center' }} />;
        })}
        {[0.1, 0.3, 0.55, 0.82].map((pct, i) => (
          <div key={i} style={{ position: 'absolute', left: '-20%', right: '-20%', bottom: `${pct * 100}%`, height: 1, background: `linear-gradient(90deg, transparent 5%, ${a}50 50%, transparent 95%)` }} />
        ))}
      </div>

      {/* Neon glow — top */}
      <div style={{ position: 'absolute', top: isStory ? '-10%' : '-14%', left: '50%', transform: 'translateX(-50%)', width: 330, height: 330, borderRadius: '50%', background: `radial-gradient(circle, ${a}22 0%, ${a}08 40%, transparent 68%)`, pointerEvents: 'none' }} />

      {/* Sport ball — upper right subtle */}
      <div style={{ position: 'absolute', top: isStory ? '8%' : '5%', right: -10, opacity: 1, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'basketball'} size={isStory ? 140 : 110} color={a} opacity={0.07} />
      </div>

      {/* Accent bars */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, transparent, ${a}, transparent)`, opacity: 0.9 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, transparent, ${a}55, transparent)` }} />

      {/* Scan line */}
      <div style={{ position: 'absolute', top: isStory ? '30%' : '26%', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}80, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '26px 22px 22px 28px' : '18px 20px 18px 26px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', border: `1px solid ${a}40` }} />}
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: a, letterSpacing: '0.24em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
              {event?.tournamentType && <div style={{ fontSize: 7, color: `${a}70`, letterSpacing: '0.2em', marginTop: 1 }}>{event.tournamentType.toUpperCase()}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 7.5, color: `${a}45`, letterSpacing: '0.18em' }}>SAISON</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: `${a}AA` }}>{event?.date ? new Date(event.date).getFullYear() : '2025'}</div>
          </div>
        </div>

        {/* Sport + TOURNAMENT badge */}
        <div style={{ marginBottom: isStory ? 10 : 6 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', color: a, textTransform: 'uppercase' }}>
            ▶ {event?.sport ? event.sport.toUpperCase() + ' · ' : ''}TOURNOI
          </span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 50 : 36, fontWeight: 900, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.045em', textTransform: 'uppercase', textShadow: `0 0 40px ${a}45`, marginBottom: 20 }}>
            {truncate(tName, 20).split(' ').map((w, i) => <div key={i}>{w}</div>)}
          </div>

          {/* Categories as neon tags */}
          {event?.tournamentCategories && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, color: `${a}BB`, letterSpacing: '0.08em' }}>· {c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div data-block="champ" style={{ ...tr('champ') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${a}22`, paddingTop: 12 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 22 : 16, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 14px ${a}70` }}>
                {dt.day} <span style={{ fontSize: isStory ? 14 : 11, color: `${a}BB` }}>{dt.month}</span>
              </div>
              <div style={{ fontSize: 10, color: `${a}55`, marginTop: 3 }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 160 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 700, color: 'rgba(255,255,255,0.45)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.3em', color: `${a}35`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
