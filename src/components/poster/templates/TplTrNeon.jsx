import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrNeon({ event, homeTeam, championship, tagline, accentColor = '#00E5FF', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;

  // Perspective grid lines count
  const vLines = 8;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#030B18', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,11,24,0.94)' }} />
      </>}

      {/* Perspective grid — bottom half */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '45%' : '38%', overflow: 'hidden', opacity: 0.18 }}>
        {Array.from({ length: vLines }).map((_, i) => {
          const x = 180 + (i - vLines / 2) * 52;
          return (
            <div key={i} style={{ position: 'absolute', bottom: 0, left: `${x}px`, width: 1, height: '100%', background: `linear-gradient(0deg, ${a} 0%, transparent 100%)`, transform: `rotate(${(i - vLines / 2) * 4}deg)`, transformOrigin: 'bottom center' }} />
          );
        })}
        {/* Horizontal lines */}
        {[0.15, 0.35, 0.6, 0.85].map((pct, i) => (
          <div key={i} style={{ position: 'absolute', left: '-20%', right: '-20%', bottom: `${pct * 100}%`, height: 1, background: `linear-gradient(90deg, transparent 5%, ${a}60 50%, transparent 95%)` }} />
        ))}
      </div>

      {/* Neon glow orb — top center */}
      <div style={{ position: 'absolute', top: isStory ? '-8%' : '-12%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${a}22 0%, ${a}08 40%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Accent lines — sides */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, transparent, ${a}, transparent)`, opacity: 0.8 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, transparent, ${a}60, transparent)` }} />

      {/* Top scan line */}
      <div style={{ position: 'absolute', top: isStory ? '28%' : '24%', left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}80, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '28px 24px 24px 28px' : '20px 22px 20px 26px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 24 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain', border: `1px solid ${a}50` }} />}
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: a, letterSpacing: '0.24em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
              {tType && <div style={{ fontSize: 7, color: `${a}70`, letterSpacing: '0.2em', marginTop: 1 }}>{tType.toUpperCase()}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, color: `${a}50`, letterSpacing: '0.2em' }}>SEASON</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: `${a}AA` }}>{event?.date ? new Date(event.date).getFullYear() : '2025'}</div>
          </div>
        </div>

        {/* TOURNAMENT tag */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.48em', color: a, textTransform: 'uppercase' }}>▶ TOURNAMENT</span>
        </div>

        {/* Main title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 48 : 36, fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.04em', textTransform: 'uppercase', textShadow: `0 0 40px ${a}50`, marginBottom: 18 }}>
            {truncate(tName, 22).split(' ').map((w, i) => <div key={i}>{w}</div>)}
          </div>

          {/* Stats row */}
          <div data-block="champ" style={{ display: 'flex', gap: 14, ...tr('champ') }}>
            {numTeams && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isStory ? 28 : 22, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 20px ${a}80` }}>{numTeams}</div>
                <div style={{ fontSize: 7, fontWeight: 700, color: `${a}70`, letterSpacing: '0.18em', marginTop: 2 }}>ÉQUIPES</div>
              </div>
            )}
            {numTeams && cats.length > 0 && <div style={{ width: 1, background: `${a}30`, alignSelf: 'stretch' }} />}
            {cats.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                {cats.slice(0, 3).map((c, i) => (
                  <span key={i} style={{ fontSize: 9, fontWeight: 600, color: `${a}BB`, letterSpacing: '0.06em' }}>· {c}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${a}25`, paddingTop: 12 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 22 : 16, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 16px ${a}70` }}>
                {dt.day} <span style={{ fontSize: isStory ? 15 : 11, color: `${a}BB` }}>{dt.month}</span>
              </div>
              <div style={{ fontSize: 10, color: `${a}60`, marginTop: 3, letterSpacing: '0.06em' }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 160 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 700, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.3em', color: `${a}40`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
