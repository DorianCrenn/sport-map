import { getSportMeta, SportBall, InfoRow, Grain, Vignette, LightOrb, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Champions Night — dark stadium / god rays / gold. Football aesthetic.
export default function TplTrPremium({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const gold = '#C9A84C';
  const gold2 = '#F2DC90';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#040508', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,8,0.88)' }} />
      </>}

      {/* Stadium arc system — looking up from the pitch */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isStory ? '55%' : '48%', pointerEvents: 'none' }} viewBox="0 0 360 350" preserveAspectRatio="xMidYMin meet">
        <ellipse cx="180" cy="-40" rx="310" ry="255" fill="none" stroke={`${gold}18`} strokeWidth="1.5" />
        <ellipse cx="180" cy="-40" rx="265" ry="215" fill="none" stroke={`${gold}12`} strokeWidth="1" />
        <ellipse cx="180" cy="-40" rx="218" ry="178" fill="none" stroke={`${gold}09`} strokeWidth="0.8" />
        <ellipse cx="180" cy="-40" rx="168" ry="140" fill="none" stroke={`${gold}06`} strokeWidth="0.5" />
        {/* Radial structure spokes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 180 + 310 * Math.cos(rad);
          const y1 = -40 + 255 * Math.sin(rad);
          const x2 = 180 + 168 * Math.cos(rad);
          const y2 = -40 + 140 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${gold}12`} strokeWidth="0.6" />;
        })}
        {/* Rim highlight — bottom visible arc */}
        <ellipse cx="180" cy="-40" rx="310" ry="255" fill="none" stroke={`${gold}35`} strokeWidth="0.5" strokeDasharray="3 12" />
      </svg>

      {/* Ambient gold glow behind arc */}
      <LightOrb top={isStory ? -80 : -60} left={-60} width={480} height={280} color={`rgba(201,168,76,0.22)`} blur={60} />

      {/* Floodlights — 4 points on the arc */}
      <LightOrb top={isStory ? 28 : 18} left={28} width={70} height={70} color="rgba(255,235,160,0.7)" blur={14} />
      <LightOrb top={isStory ? 28 : 18} right={28} width={70} height={70} color="rgba(255,235,160,0.7)" blur={14} />
      <LightOrb top={isStory ? 82 : 55} left={-10} width={50} height={50} color="rgba(255,220,120,0.45)" blur={12} />
      <LightOrb top={isStory ? 82 : 55} right={-10} width={50} height={50} color="rgba(255,220,120,0.45)" blur={12} />

      {/* God rays — thin triangles from top center */}
      {[-32, -18, -6, 8, 22, 38].map((angle, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: '50%',
          width: i % 2 === 0 ? 1 : 2,
          height: isStory ? `${32 + i * 4}%` : `${24 + i * 3}%`,
          background: `linear-gradient(180deg, rgba(201,168,76,${0.5 - i * 0.05}) 0%, transparent 100%)`,
          transformOrigin: 'top center',
          transform: `translateX(-50%) rotate(${angle}deg)`,
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Blue-black atmospheric depth — bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '50%' : '45%', background: 'linear-gradient(0deg, #02020A 0%, transparent 100%)', pointerEvents: 'none' }} />

      <Vignette strength={0.82} cy="38%" />
      <Grain opacity={0.05} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isStory ? '22px 26px 28px' : '16px 22px 22px' }}>

        {/* Top — organizer + TOURNOI badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'contain', opacity: 0.8 }} />}
            {organizer && <span style={{ fontSize: 7.5, fontWeight: 800, color: `${gold}80`, letterSpacing: '0.32em', textTransform: 'uppercase' }}>{organizer}</span>}
          </div>
          <div style={{ padding: '2px 9px', borderRadius: 2, border: `1px solid ${gold}35`, background: `${gold}0A` }}>
            <span style={{ fontSize: 7.5, fontWeight: 900, color: `${gold}70`, letterSpacing: '0.38em' }}>TOURNOI</span>
          </div>
        </div>

        {/* Spacer — visual area */}
        <div style={{ flex: 1 }} />

        {/* Bottom — hero block */}
        <div>
          {/* Sport label */}
          {event?.sport && <div style={{ fontSize: 8, fontWeight: 700, color: sport.accent, letterSpacing: '0.38em', textTransform: 'uppercase', marginBottom: isStory ? 10 : 7, opacity: 0.75 }}>{event.sport}</div>}

          {/* Tournament name — MASSIVE */}
          <div data-block="title" style={{ ...tr('title') }}>
            <div style={{
              fontSize: isStory ? 68 : 50,
              fontWeight: 900,
              lineHeight: 0.88,
              letterSpacing: '-0.045em',
              marginBottom: isStory ? 18 : 13,
              background: `linear-gradient(165deg, ${gold2} 0%, ${gold} 55%, rgba(160,120,48,0.9) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: `drop-shadow(0 0 30px ${gold}40)`,
            }}>
              {truncate(tName, 16)}
            </div>
          </div>

          {/* Gold rule */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${gold}80, ${gold}18, transparent)`, marginBottom: isStory ? 14 : 10 }} />

          {/* Tournament type + categories — small */}
          {(event?.tournamentType || event?.tournamentCategories) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isStory ? 12 : 9 }}>
              {event.tournamentType && <span style={{ fontSize: 8, fontWeight: 700, color: `${gold}70`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{event.tournamentType}</span>}
              {event?.tournamentCategories && event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}>· {c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div data-block="meta" style={{ ...tr('meta') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={gold} dimColor={`${gold}AA`} isStory={isStory} />
            <div style={{ marginTop: isStory ? 10 : 7, fontSize: isStory ? 9.5 : 8.5, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em' }}>
              {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}{(event?.venue || event?.city) ? ` · ${event?.venue || event?.city}` : ''}
            </div>
            {tagline && (
              <div data-block="tagline" style={{ marginTop: 6, ...tr('tagline') }}>
                <span style={{ fontSize: 7.5, color: `${gold}35`, letterSpacing: '0.3em', textTransform: 'uppercase' }}>{tagline}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
