import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrGradient({ event, homeTeam, championship, tagline, accentColor = '#6D28D9', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.primary : accentColor;
  const mid = sport.accent !== '#A78BFA' ? sport.glow : '#4F46E5';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(135deg, ${a} 0%, ${mid} 40%, #EC4899CC 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a}E0 0%, ${mid}CC 40%, #EC4899BB 100%)` }} />
      </>}

      {/* Mesh grid overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)`, backgroundSize: '62px 62px', opacity: 0.5 }} />

      {/* Circle decorations */}
      <div style={{ position: 'absolute', top: isStory ? -100 : -80, right: -80, width: 310, height: 310, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.13)' }} />
      <div style={{ position: 'absolute', top: isStory ? -60 : -48, right: -50, width: 210, height: 210, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: isStory ? -80 : -60, left: -60, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)' }} />

      {/* Sport ball */}
      <div style={{ position: 'absolute', bottom: isStory ? '20%' : '16%', right: -10, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || ''} size={isStory ? 150 : 120} color="#fff" opacity={0.1} />
      </div>

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.42)' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '26px 22px 20px' : '20px 20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <div style={{ width: 29, height: 29, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 23, height: 23, objectFit: 'contain' }} />
              </div>
            )}
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {event?.tournamentType && <span style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 20 }}>{event.tournamentType}</span>}
          </div>
        </div>

        {/* Sport + TOURNOI badge */}
        <div style={{ marginBottom: isStory ? 10 : 7 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.42em', color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase' }}>
            ★ {event?.sport ? event.sport.toUpperCase() + ' · ' : ''}TOURNOI ★
          </span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 46 : 34, fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.04em', textShadow: '0 4px 22px rgba(0,0,0,0.28)', marginBottom: 18 }}>
            {truncate(tName, 22)}
          </div>

          {/* Categories */}
          {event?.tournamentCategories && (
            <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14, ...tr('champ') }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color="#fff" dimColor="rgba(255,255,255,0.75)" isStory={isStory} />
          </div>
        </div>

        {/* Bottom card */}
        <div style={{ background: 'rgba(255,255,255,0.11)', borderRadius: 16, padding: isStory ? '13px 15px' : '9px 13px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.18)' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 16 : 12, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
              {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
            </div>
            <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 11 : 9), color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: 600 }}>
              {event?.venue || event?.city || '—'}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 5, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.48)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
