import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrCinema({ event, homeTeam, championship, tagline, accentColor = '#F5E6C8', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'GRAND TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const prize = event?.prize;
  const organizer = event?.organizer || homeTeam?.name;

  const letterboxH = isStory ? 80 : 56;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#060608', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,6,8,0.88)' }} />
      </>}

      {/* Film grain dots — subtle */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: letterboxH, background: '#000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: letterboxH, background: '#000' }} />

      {/* Subtle vertical center glow */}
      <div style={{ position: 'absolute', top: letterboxH, bottom: letterboxH, left: '50%', transform: 'translateX(-50%)', width: 300, background: `radial-gradient(ellipse at center, ${a}0A 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Horizontal accent lines */}
      <div style={{ position: 'absolute', top: letterboxH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}40, transparent)` }} />
      <div style={{ position: 'absolute', bottom: letterboxH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}40, transparent)` }} />

      {/* Content zone */}
      <div style={{ position: 'absolute', top: letterboxH, bottom: letterboxH, left: 0, right: 0, display: 'flex', flexDirection: 'column', padding: isStory ? '28px 30px' : '18px 26px' }}>

        {/* Top meta — inside content zone */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 20 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain', opacity: 0.7 }} />}
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', color: `${a}80`, textTransform: 'uppercase' }}>{organizer || 'PRÉSENTE'}</span>
          </div>
          {tType && (
            <span style={{ fontSize: 8, fontWeight: 700, color: `${a}70`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{tType}</span>
          )}
        </div>

        {/* Main title — cinematic */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.55em', color: `${a}55`, textTransform: 'uppercase', marginBottom: 12 }}>UN GRAND TOURNOI</div>
          <div style={{ fontSize: isStory ? 44 : 32, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 18 }}>
            {truncate(tName, 28)}
          </div>

          {/* Info row */}
          <div data-block="champ" style={{ display: 'flex', gap: 16, alignItems: 'center', ...tr('champ') }}>
            {numTeams && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isStory ? 26 : 20, fontWeight: 900, color: a, lineHeight: 1 }}>{numTeams}</div>
                <div style={{ fontSize: 7, color: `${a}70`, letterSpacing: '0.2em', marginTop: 2 }}>ÉQUIPES</div>
              </div>
            )}
            {numTeams && prize && <div style={{ width: 1, height: 30, backgroundColor: `${a}30` }} />}
            {prize && (
              <div>
                <div style={{ fontSize: 7, color: `${a}70`, letterSpacing: '0.2em', marginBottom: 2 }}>PRIZE</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{prize}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom — date/venue */}
        <div data-block="meta" style={{ borderTop: `1px solid ${a}18`, paddingTop: 12, ...tr('meta') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: isStory ? 16 : 12, fontWeight: 800, color: a, letterSpacing: '0.03em' }}>
                {dt.weekday.slice(0, 3)}. {dt.day} {dt.month}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 700, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3, maxWidth: 140, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Letterbox top content */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: letterboxH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.5em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>SPORTLINK PRODUCTIONS</span>
      </div>

      {/* Letterbox bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: letterboxH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tagline ? (
          <div data-block="tagline" style={{ textAlign: 'center', ...tr('tagline') }}>
            <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span>
          </div>
        ) : (
          <span style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.12)' }}>sportlink.app</span>
        )}
      </div>
    </div>
  );
}
