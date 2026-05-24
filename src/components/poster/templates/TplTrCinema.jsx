import { getSportMeta, InfoRow, Grain, LightOrb, fmtDate, truncate, blockStyle, venueFs, scaledTitle } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Night Final — film noir. Single spotlight. Extreme atmosphere. Tennis / Grand Slam.
export default function TplTrCinema({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const amber = accentColor || (sport.accent !== '#A78BFA' ? sport.accent : '#D4B450');
  const tName = event?.tournamentName || championship || 'GRAND TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;
  const barH = isStory ? 72 : 50;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#030303', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,3,3,0.90)' }} />
      </>}

      {/* ── THE SPOTLIGHT — main visual event ── */}
      {/* Outer ambient from above */}
      <LightOrb top={isStory ? '-5%' : '-8%'} left="50%" width={340} height={isStory ? 340 : 260} color={`${amber}12`} blur={70} />
      {/* Main spotlight cone */}
      <div style={{
        position: 'absolute',
        top: barH,
        left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${isStory ? 160 : 130}px solid transparent`,
        borderRight: `${isStory ? 160 : 130}px solid transparent`,
        borderTop: `${isStory ? 340 : 250}px solid ${amber}14`,
        filter: 'blur(18px)',
        pointerEvents: 'none',
      }} />
      {/* Spotlight circle on "floor" */}
      <div style={{
        position: 'absolute',
        top: isStory ? '48%' : '44%',
        left: '50%', transform: 'translate(-50%, -50%)',
        width: isStory ? 260 : 200, height: isStory ? 100 : 80,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${amber}22 0%, ${amber}08 40%, transparent 70%)`,
        filter: 'blur(8px)',
        pointerEvents: 'none',
      }} />
      {/* Bright center point */}
      <LightOrb top={barH - 20} left="50%" width={60} height={60} color={`${amber}80`} blur={20} />

      {/* Light beam shafts — subtle rays */}
      {[-18, -6, 6, 18].map((angle, i) => (
        <div key={i} style={{
          position: 'absolute', top: barH, left: '50%',
          width: 1, height: isStory ? '40%' : '36%',
          background: `linear-gradient(180deg, ${amber}30 0%, transparent 100%)`,
          transformOrigin: 'top center',
          transform: `translateX(-50%) rotate(${angle}deg)`,
          filter: 'blur(3px)',
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Film grain (heavy) + extreme vignette ── */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 65% 58% at 50% 48%, transparent 0%, rgba(0,0,0,0.92) 100%)`, pointerEvents: 'none' }} />
      <Grain opacity={0.08} blend="overlay" />

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barH, background: '#000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, background: '#000' }} />

      {/* Amber accent line at letterbox edges */}
      <div style={{ position: 'absolute', top: barH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${amber}30, transparent)` }} />
      <div style={{ position: 'absolute', bottom: barH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${amber}30, transparent)` }} />

      {/* ── Content zone ── */}
      <div style={{ position: 'absolute', top: barH, bottom: barH, left: 0, right: 0, display: 'flex', flexDirection: 'column', padding: isStory ? '20px 28px' : '14px 24px' }}>

        {/* Top meta — minimal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 12 : 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'contain', opacity: 0.55 }} />}
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.32em', color: `${amber}60`, textTransform: 'uppercase' }}>{organizer || 'PRÉSENTE'}</span>
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: `${amber}45`, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{event?.sport || ''}</span>
        </div>

        {/* Spacer — spotlight visual area */}
        <div style={{ flex: 1 }} />

        {/* Hero title — center in spotlight */}
        <div data-block="title" style={{ textAlign: 'center', marginBottom: isStory ? 20 : 14, ...tr('title') }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.55em', color: `${amber}50`, textTransform: 'uppercase', marginBottom: 12 }}>
            {event?.tournamentType || 'GRAND TOURNOI'}
          </div>
          <div style={{
            fontSize: scaledTitle(tName, isStory ? 52 : 38, isStory ? 22 : 16),
            fontWeight: 900,
            color: '#fff',
            lineHeight: 0.93,
            letterSpacing: '-0.03em',
            textShadow: `0 0 40px ${amber}45`,
            overflowWrap: 'break-word',
          }}>
            {tName}
          </div>
        </div>

        {/* InfoRow — sparse */}
        <div data-block="champ" style={{ display: 'flex', justifyContent: 'center', marginBottom: isStory ? 16 : 12, ...tr('champ') }}>
          <div data-block="info" style={{ ...tr('info') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={amber} dimColor={`${amber}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Date/venue — small */}
        <div data-block="meta" style={{ textAlign: 'center', borderTop: `1px solid ${amber}15`, paddingTop: isStory ? 12 : 8, ...tr('meta') }}>
          <div style={{ fontSize: isStory ? 14 : 11, fontWeight: 800, color: amber, letterSpacing: '0.04em' }}>
            {dt.weekday.slice(0, 3)}. {dt.day} {dt.month}
          </div>
          <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 600 }}>
            {dt.time !== '—' ? `${dt.time} · ` : ''}{event?.venue || event?.city || '—'}
          </div>
        </div>
      </div>

      {/* Letterbox text */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.55em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>SPORTLINK PRODUCTIONS</span>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tagline
          ? <div data-block="tagline" style={{ ...tr('tagline') }}><span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span></div>
          : <span style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.1)' }}>sportlink.app</span>}
      </div>
    </div>
  );
}
