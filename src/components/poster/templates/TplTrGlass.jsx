import { getSportMeta, InfoRow, Grain, Vignette, LightOrb, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Deep Glass — layered tilted glass panels. Indigo + violet glow. Apple-level depth.
export default function TplTrGlass({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const indigo = accentColor || (sport.primary !== '#6D28D9' ? sport.glow : '#818CF8');
  const violet = accentColor || '#A855F7';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#04040C', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,4,12,0.93)' }} />
      </>}

      {/* ── Glow orbs — multiple light sources ── */}
      <LightOrb top="-18%" left="20%" width={300} height={300} color={`${indigo}28`} blur={70} />
      <LightOrb top="-5%" right="-15%" width={240} height={240} color={`${violet}22`} blur={60} />
      <LightOrb bottom="-10%" left="30%" width={280} height={200} color={`${indigo}18`} blur={65} />

      {/* Dot matrix background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${indigo}25 1px, transparent 1px)`, backgroundSize: '28px 28px', opacity: 0.04, pointerEvents: 'none' }} />

      {/* ── Layered glass panels — the hero visual ── */}

      {/* Back panel — most tilted */}
      <div style={{
        position: 'absolute',
        top: isStory ? '8%' : '6%', bottom: isStory ? '6%' : '5%',
        left: '22%', right: '-8%',
        borderRadius: 20,
        background: `linear-gradient(145deg, ${indigo}10 0%, ${violet}06 100%)`,
        border: `1px solid ${indigo}18`,
        transform: 'rotate(4deg) skewY(2deg)',
        transformOrigin: 'top right',
      }} />

      {/* Mid panel */}
      <div style={{
        position: 'absolute',
        top: isStory ? '10%' : '8%', bottom: isStory ? '8%' : '6%',
        left: '8%', right: '8%',
        borderRadius: 22,
        background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid rgba(255,255,255,0.1)`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 24px 70px rgba(0,0,0,0.55), 0 0 60px ${indigo}12`,
        transform: 'rotate(-1deg)',
      }} />

      {/* Mid panel top highlight */}
      <div style={{
        position: 'absolute',
        top: isStory ? 'calc(10% + 1px)' : 'calc(8% + 1px)',
        left: '9%', right: '9%', height: 1,
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.15), rgba(255,255,255,0.06), transparent)`,
        transform: 'rotate(-1deg)',
        transformOrigin: 'left',
      }} />

      {/* Front accent panel — bottom-right */}
      <div style={{
        position: 'absolute',
        bottom: isStory ? '9%' : '7%', right: '6%',
        width: '45%', height: isStory ? '28%' : '26%',
        borderRadius: 16,
        background: `linear-gradient(135deg, ${indigo}14 0%, transparent 100%)`,
        border: `1px solid ${indigo}22`,
        transform: 'rotate(2deg)',
      }} />

      {/* Glow edge on main panel */}
      <div style={{
        position: 'absolute',
        top: isStory ? '10%' : '8%', bottom: isStory ? '8%' : '6%',
        left: '8%', width: 1,
        background: `linear-gradient(180deg, transparent, ${indigo}80, ${violet}60, transparent)`,
        transform: 'rotate(-1deg)',
        filter: 'blur(1px)',
      }} />

      <Vignette strength={0.80} cy="50%" />
      <Grain opacity={0.04} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '46px 28px 36px' : '32px 24px 26px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 18 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <div style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: `${indigo}CC`, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
              {event?.tournamentType && <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', marginTop: 1 }}>{event.tournamentType.toUpperCase()}</div>}
            </div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: `${indigo}18`, border: `1px solid ${indigo}30` }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: `${indigo}CC`, letterSpacing: '0.12em' }}>TOURNOI</span>
          </div>
        </div>

        {/* Sport */}
        {event?.sport && (
          <div style={{ marginBottom: isStory ? 12 : 8 }}>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: sport.accent, letterSpacing: '0.35em', textTransform: 'uppercase', opacity: 0.8 }}>{event.sport}</span>
          </div>
        )}

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{
            fontSize: isStory ? 52 : 38,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: '-0.035em',
            marginBottom: isStory ? 22 : 16,
            background: `linear-gradient(145deg, #fff 0%, rgba(255,255,255,0.75) 60%, ${indigo}AA 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 25px ${indigo}35)`,
          }}>
            {truncate(tName, 26)}
          </div>

          {/* Categories */}
          {event?.tournamentCategories && (
            <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16, ...tr('champ') }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <div key={i} style={{ padding: '5px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={indigo} dimColor={`${indigo}AA`} isStory={isStory} />
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: isStory ? 14 : 10 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 16 : 13, fontWeight: 900, color: indigo, letterSpacing: '-0.01em', textShadow: `0 0 16px ${indigo}55` }}>
                {dt.weekday} {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 150 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 600, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
