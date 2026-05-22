import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrSummer({ event, homeTeam, championship, tagline, accentColor = '#FF8C42', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.primary : accentColor;
  const aLight = sport.accent !== '#A78BFA' ? sport.accent : '#FFB347';
  const tName = event?.tournamentName || championship || 'SUMMER CUP';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(145deg, ${a} 0%, ${aLight} 60%, #FFD97D 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `${a}CC` }} />
      </>}

      {/* Large circle — top right */}
      <div style={{ position: 'absolute', top: isStory ? -65 : -45, right: -45, width: 230, height: 230, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', top: isStory ? -35 : -22, right: -22, width: 150, height: 150, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />

      {/* Small circles bottom left */}
      <div style={{ position: 'absolute', bottom: isStory ? 110 : 80, left: -25, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: isStory ? 145 : 105, left: 30, width: 45, height: 45, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Sport ball — center right */}
      <div style={{ position: 'absolute', bottom: isStory ? 125 : 90, right: -15, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'basketball'} size={isStory ? 160 : 120} color="#fff" opacity={0.12} />
      </div>

      {/* Triangle bottom right */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 0 ${isStory ? 140 : 90}px ${isStory ? 160 : 110}px`, borderColor: `transparent transparent rgba(255,255,255,0.07) transparent` }} />

      {/* White bottom card */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? 126 : 90, background: 'rgba(255,255,255,0.93)', borderRadius: '20px 20px 0 0' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '26px 22px 0' : '18px 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, borderRadius: 7, objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.22)', padding: 2 }} />}
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</span>
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 20 }}>
            {event?.date ? new Date(event.date).getFullYear() : '2025'}
          </span>
        </div>

        {/* Sport + TOURNOI label */}
        <div style={{ marginBottom: isStory ? 8 : 5 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.38em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>
            ☀ {event?.sport ? event.sport.toUpperCase() + ' · ' : ''}TOURNOI
          </span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 46 : 34, fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.04em', textShadow: '0 2px 18px rgba(0,0,0,0.14)', marginBottom: 18 }}>
            {truncate(tName, 22)}
          </div>

          {/* Tournament type + categories */}
          <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', ...tr('champ') }}>
            {event?.tournamentType && (
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.82)', backgroundColor: 'rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: 20 }}>{event.tournamentType}</span>
            )}
            {event?.tournamentCategories && event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(255,255,255,0.13)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
            ))}
          </div>
        </div>

        {/* White card content */}
        <div style={{ height: isStory ? 126 : 90, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 900, color: a, letterSpacing: '-0.02em' }}>
              {dt.weekday} {dt.day} {dt.month}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              {dt.time !== '—' && <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{dt.time}</span>}
              {dt.time !== '—' && <span style={{ fontSize: 10, color: '#bbb' }}>·</span>}
              <span style={{ fontSize: venueFs(event?.venue || '', isStory ? 11 : 9), fontWeight: 600, color: '#666' }}>{event?.venue || event?.city || '—'}</span>
            </div>
          </div>

          {/* InfoRow in white card */}
          <div style={{ marginTop: 8 }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}BB`} isStory={isStory} />
          </div>

          {tagline && (
            <div data-block="tagline" style={{ marginTop: 6, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.2em', color: '#999', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
