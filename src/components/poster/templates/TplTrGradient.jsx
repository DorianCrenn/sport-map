import { getSportMeta, InfoRow, Grain, Vignette, LightOrb, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Force Field — speed lines + directional gradient explosion. Power / Handball / Arena.
export default function TplTrGradient({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.primary : '#E11D48';
  const a2 = sport.glow !== '#A78BFA' ? sport.glow : '#FB7185';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  // Speed lines — radiate from right focal point (75%, 45%)
  const focalX = 270;
  const focalY = isStory ? 290 : 200;
  const lineCount = 32;
  const lines = Array.from({ length: lineCount }, (_, i) => {
    const angle = (i / lineCount) * Math.PI * 2;
    const len = 520;
    return {
      x2: focalX + Math.cos(angle) * len,
      y2: focalY + Math.sin(angle) * len,
      op: i % 3 === 0 ? 0.18 : i % 2 === 0 ? 0.10 : 0.06,
    };
  });

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#07020E', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,2,14,0.91)' }} />
      </>}

      {/* ── Directional gradient explosion from right ── */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at 75% ${isStory ? '45%' : '42%'}, ${a}55 0%, ${a2}22 40%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 0%, transparent 28%, ${a}20 55%, ${a}40 100%)`, pointerEvents: 'none' }} />

      {/* ── Speed lines SVG — radiating from focal point ── */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 360 ${h}`} preserveAspectRatio="none">
        {lines.map((l, i) => (
          <line key={i} x1={focalX} y1={focalY} x2={l.x2} y2={l.y2} stroke={a} strokeWidth="0.8" opacity={l.op} />
        ))}
        {/* Dense inner burst — short bright lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <line key={`b${i}`}
              x1={focalX + Math.cos(angle) * 8} y1={focalY + Math.sin(angle) * 8}
              x2={focalX + Math.cos(angle) * 55} y2={focalY + Math.sin(angle) * 55}
              stroke={a2} strokeWidth="1.2" opacity="0.45"
            />
          );
        })}
      </svg>

      {/* ── Energy pulse rings from focal point ── */}
      {[80, 130, 185, 245].map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: focalY - r, left: focalX - r,
          width: r * 2, height: r * 2,
          borderRadius: '50%',
          border: `1px solid ${a}${i === 0 ? '50' : i === 1 ? '35' : i === 2 ? '22' : '12'}`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* LightOrb at focal point */}
      <LightOrb top={focalY - 80} left={focalX - 80} width={160} height={160} color={`${a}55`} blur={40} />
      <LightOrb top={focalY - 40} left={focalX - 40} width={80} height={80} color={`${a2}70`} blur={18} />

      {/* Left-side dark gradient — keeps left zone readable */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,2,14,0.82) 0%, rgba(7,2,14,0.35) 55%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Diagonal power slash — bottom left corner accent */}
      <div style={{
        position: 'absolute',
        bottom: isStory ? -30 : -20, left: -30,
        width: 180, height: 180,
        background: `linear-gradient(45deg, ${a}30 0%, transparent 60%)`,
        transform: 'rotate(-15deg)',
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />

      {/* Vertical accent stripe — far right edge */}
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, transparent, ${a}CC, ${a2}80, transparent)`, filter: 'blur(1px)' }} />

      <Vignette strength={0.75} cx="30%" cy="50%" rx="70%" ry="60%" />
      <Grain opacity={0.05} />

      {/* ── Content — left-heavy ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '40px 24px 32px' : '28px 22px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 20 : 14 }}>
          {homeTeam?.logo && (
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: `1px solid ${a}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </div>
          )}
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, color: `${a}DD`, letterSpacing: '0.28em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
            {event?.tournamentType && <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: 1 }}>{event.tournamentType.toUpperCase()}</div>}
          </div>
        </div>

        {/* Force tag */}
        <div style={{ marginBottom: isStory ? 8 : 5 }}>
          <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: '0.45em', color: `${a}BB`, textTransform: 'uppercase' }}>
            ⚡ {event?.sport ? event.sport.toUpperCase() + ' · ' : ''}TOURNOI
          </span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Title — massive left-aligned */}
        <div data-block="title" style={{ marginBottom: isStory ? 20 : 14, maxWidth: '72%', ...tr('title') }}>
          <div style={{
            fontSize: isStory ? 64 : 48,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#fff',
            textShadow: `0 0 40px ${a}40, 0 2px 0 rgba(0,0,0,0.4)`,
          }}>
            {truncate(tName, 18)}
          </div>
        </div>

        {/* Categories */}
        {event?.tournamentCategories && (
          <div data-block="champ" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: isStory ? 14 : 10, ...tr('champ') }}>
            {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
              <div key={i} style={{ padding: '4px 10px', borderRadius: 8, background: `${a}18`, border: `1px solid ${a}35` }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: `${a}CC` }}>{c}</span>
              </div>
            ))}
          </div>
        )}

        {/* InfoRow */}
        <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a2} dimColor={`${a2}AA`} isStory={isStory} />

        {/* Bottom — date + venue */}
        <div data-block="meta" style={{ marginTop: isStory ? 16 : 12, paddingTop: isStory ? 14 : 10, borderTop: `1px solid ${a}25`, ...tr('meta') }}>
          <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
          </div>
          <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 3 }}>
            {event?.venue || event?.city || '—'}
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
