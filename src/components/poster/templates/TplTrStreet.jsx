import { getSportMeta, InfoRow, Grain, Vignette, LightOrb, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Urban Night — street football, concrete raw. Diagonal slash. Bold condensed.
export default function TplTrStreet({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const a = accentColor || (sport.primary !== '#6D28D9' ? sport.primary : '#FF5500');
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#080808', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.90)' }} />
      </>}

      {/* Concrete micro-grid texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: '20px 20px', pointerEvents: 'none' }} />

      {/* ── Main diagonal slash — left to right, splits poster ── */}
      <div style={{
        position: 'absolute',
        top: isStory ? '28%' : '22%',
        left: '-10%', right: '-10%',
        height: isStory ? '32%' : '30%',
        background: `linear-gradient(108deg, ${a} 0%, ${a}CC 30%, ${a}22 55%, transparent 70%)`,
        transform: 'skewY(-8deg)',
        pointerEvents: 'none',
      }} />

      {/* Slash inner light */}
      <div style={{
        position: 'absolute',
        top: isStory ? '30%' : '23%',
        left: '-5%', right: '30%',
        height: isStory ? '10%' : '9%',
        background: `linear-gradient(108deg, rgba(255,255,255,0.25) 0%, transparent 60%)`,
        transform: 'skewY(-8deg)',
        filter: 'blur(6px)',
        pointerEvents: 'none',
      }} />

      {/* Accent stripe top-left */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: isStory ? '38%' : '35%', height: 4, background: a }} />

      {/* Small grid squares — upper right decoration */}
      <div style={{ position: 'absolute', top: isStory ? '8%' : '6%', right: '8%', display: 'grid', gridTemplateColumns: 'repeat(5,10px)', gap: 4, pointerEvents: 'none', opacity: 0.3 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, border: `1px solid ${a}`, borderRadius: 1 }} />
        ))}
      </div>

      {/* Right side accent vertical bar */}
      <div style={{ position: 'absolute', top: 0, right: 22, width: 2, height: isStory ? '22%' : '18%', background: `linear-gradient(180deg, ${a}90, transparent)` }} />

      {/* Warm light source from slash area */}
      <LightOrb top={isStory ? '20%' : '14%'} left="-15%" width={260} height={160} color={`${a}25`} blur={50} />

      <Vignette strength={0.85} cx="50%" cy="55%" rx="60%" ry="65%" />
      <Grain opacity={0.07} blend="overlay" />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isStory ? '24px 24px 26px' : '18px 20px 20px' }}>

        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.42em', color: a, textTransform: 'uppercase', marginBottom: 4 }}>TOURNOI</div>
            {organizer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'contain', opacity: 0.7 }} />}
                <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em' }}>{organizer.toUpperCase()}</span>
              </div>
            )}
          </div>
          {event?.tournamentType && (
            <div style={{ padding: '2px 8px', borderRadius: 3, border: `1px solid ${a}50`, background: `${a}12` }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: `${a}CC`, letterSpacing: '0.1em' }}>{event.tournamentType.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Hero name — Ultra condensed, massive, left heavy */}
        <div data-block="title" style={{ marginBottom: isStory ? 20 : 14, ...tr('title') }}>
          {event?.sport && <div style={{ fontSize: 8, fontWeight: 700, color: `${a}80`, letterSpacing: '0.32em', textTransform: 'uppercase', marginBottom: 8 }}>{event.sport}</div>}
          <div style={{
            fontSize: isStory ? 76 : 56,
            fontWeight: 900,
            lineHeight: 0.85,
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            textShadow: `2px 2px 0 ${a}30, 0 0 40px ${a}25`,
          }}>
            {truncate(tName, 14).split(' ').map((word, i) => (
              <div key={i} style={{ color: i % 3 === 1 ? a : i % 3 === 2 ? 'rgba(255,255,255,0.6)' : '#fff' }}>{word}</div>
            ))}
          </div>
        </div>

        {/* InfoRow + date */}
        <div>
          <div data-block="champ" style={{ marginBottom: isStory ? 14 : 10, ...tr('champ') }}>
            {event?.tournamentCategories && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                  <span key={i} style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>/ {c}</span>
                ))}
              </div>
            )}
            <div data-block="info" style={{ ...tr('info') }}>
              <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}AA`} isStory={isStory} />
            </div>
          </div>

          <div data-block="meta" style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: isStory ? 12 : 9, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                {dt.day} <span style={{ color: a }}>{dt.month}</span>
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 155 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.3em', color: `${a}38`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
