import { getSportMeta, InfoRow, Grain, Vignette, LightOrb, fmtDate, blockStyle, venueFs, scaledTitle } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Game Night — NBA Playoffs energy. Court perspective. Explosive orange neon.
export default function TplTrNeon({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const orange = accentColor || '#F97316';
  const coldBlue = '#00C2FF';
  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#060A14', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,10,20,0.92)' }} />
      </>}

      {/* Court floor — perspective grid (bottom 40%) */}
      <div style={{
        position: 'absolute', bottom: 0, left: '-30%', right: '-30%',
        height: isStory ? '42%' : '36%',
        backgroundImage: `linear-gradient(0deg, ${orange}22 1px, transparent 1px), linear-gradient(90deg, ${orange}14 1px, transparent 1px)`,
        backgroundSize: '48px 32px',
        transform: 'perspective(220px) rotateX(62deg)',
        transformOrigin: 'bottom center',
        pointerEvents: 'none',
      }} />

      {/* Court floor fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '42%' : '36%', background: 'linear-gradient(0deg, #060A14 0%, transparent 40%)', pointerEvents: 'none' }} />

      {/* Court three-point arc — massive SVG */}
      <svg style={{ position: 'absolute', bottom: isStory ? '25%' : '20%', left: '50%', transform: 'translateX(-50%)', overflow: 'visible', pointerEvents: 'none' }} width="500" height="120" viewBox="0 0 500 120">
        <path d="M 0,120 Q 250,-80 500,120" stroke={`${orange}30`} strokeWidth="1.5" fill="none" />
        <path d="M 20,120 Q 250,-55 480,120" stroke={`${orange}18`} strokeWidth="1" fill="none" />
      </svg>

      {/* Orange explosion — left-center */}
      <LightOrb top={isStory ? '15%' : '10%'} left="-8%" width={300} height={300} color={`rgba(249,115,22,0.42)`} blur={55} />
      <LightOrb top={isStory ? '22%' : '16%'} left="5%" width={180} height={180} color={`rgba(249,115,22,0.55)`} blur={35} />

      {/* Cold blue counter — right */}
      <LightOrb top={isStory ? '10%' : '8%'} right="-12%" width={200} height={200} color={`rgba(0,194,255,0.22)`} blur={50} />

      {/* Top center faint glow */}
      <LightOrb top="-10%" left="30%" width={200} height={160} color={`rgba(249,115,22,0.15)`} blur={60} />

      <Vignette strength={0.80} cx="60%" cy="50%" />
      <Grain opacity={0.04} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '24px 28px 26px 26px' : '18px 22px 20px 22px' }}>

        {/* Header — small top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 8 : 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain', opacity: 0.7 }} />}
            {organizer && <span style={{ fontSize: 7.5, fontWeight: 800, color: `${orange}80`, letterSpacing: '0.28em', textTransform: 'uppercase' }}>{organizer}</span>}
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: `${coldBlue}60`, letterSpacing: '0.22em', fontFamily: 'monospace' }}>{event?.date ? new Date(event.date).getFullYear() : '2025'}</span>
        </div>

        {/* Sport + TOURNOI label */}
        <div style={{ marginBottom: isStory ? 6 : 4 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.38em', color: `${orange}90`, textTransform: 'uppercase' }}>
            {event?.sport ? `${event.sport.toUpperCase()} ·` : ''} TOURNOI
          </span>
        </div>

        {/* MASSIVE stacked title — left aligned */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{
            fontSize: transforms?.title?.fontSize ?? scaledTitle(tName, isStory ? 58 : 44, isStory ? 24 : 18),
            fontFamily: transforms?.title?.fontFamily,
            fontWeight: 900,
            lineHeight: 0.86,
            letterSpacing: '-0.05em',
            textTransform: 'uppercase',
            textShadow: `0 0 40px ${orange}70, 0 0 80px ${orange}30`,
            marginBottom: isStory ? 22 : 16,
            color: '#fff',
          }}>
            {tName}
          </div>

          {/* Tournament type */}
          {event?.tournamentType && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: `${orange}80`, letterSpacing: '0.15em', textTransform: 'uppercase', borderLeft: `2px solid ${orange}`, paddingLeft: 8 }}>
                {event.tournamentType}
              </span>
            </div>
          )}

          {/* InfoRow */}
          <div data-block="champ" style={{ ...tr('champ') }}>
            <div data-block="info" style={{ ...tr('info') }}>
              <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={orange} dimColor={`${orange}AA`} isStory={isStory} />
            </div>
          </div>
        </div>

        {/* Bottom — date/venue */}
        <div style={{ borderTop: `1px solid ${orange}20`, paddingTop: isStory ? 12 : 9 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 20 : 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', textShadow: `0 0 20px ${orange}50` }}>
                {dt.day} <span style={{ color: orange }}>{dt.month}</span>
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 9.5, color: `${orange}55`, marginTop: 2, letterSpacing: '0.08em' }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 155 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 700, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.3em', color: `${orange}35`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
