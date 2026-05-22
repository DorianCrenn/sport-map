import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrCinema({ event, homeTeam, championship, tagline, accentColor = '#F5E6C8', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.accent !== '#A78BFA' ? sport.accent : accentColor;
  const tName = event?.tournamentName || championship || 'GRAND TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;
  const barH = isStory ? 76 : 52;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#050508', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,8,0.88)' }} />
      </>}

      {/* Film grain */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barH, background: '#000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, background: '#000' }} />

      {/* Sport ball in content zone */}
      <div style={{ position: 'absolute', top: barH + (isStory ? 20 : 10), right: -20, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'tennis'} size={isStory ? 160 : 120} color={a} opacity={0.06} />
      </div>

      {/* Content zone glow */}
      <div style={{ position: 'absolute', top: barH, bottom: barH, left: '50%', transform: 'translateX(-50%)', width: 260, background: `radial-gradient(ellipse at center, ${a}0C 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Border lines at letterbox edge */}
      <div style={{ position: 'absolute', top: barH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}38, transparent)` }} />
      <div style={{ position: 'absolute', bottom: barH, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}38, transparent)` }} />

      {/* Content zone */}
      <div style={{ position: 'absolute', top: barH, bottom: barH, left: 0, right: 0, display: 'flex', flexDirection: 'column', padding: isStory ? '24px 28px' : '16px 24px' }}>

        {/* Top meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 18 : 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'contain', opacity: 0.65 }} />}
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', color: `${a}75`, textTransform: 'uppercase' }}>{organizer || 'PRÉSENTE'}</span>
          </div>
          {event?.tournamentType && (
            <span style={{ fontSize: 8, fontWeight: 700, color: `${a}65`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{event.tournamentType}</span>
          )}
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          {event?.sport && (
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.42em', color: `${a}60`, textTransform: 'uppercase', marginBottom: 10 }}>{event.sport}</div>
          )}
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.5em', color: `${a}50`, textTransform: 'uppercase', marginBottom: 10 }}>UN GRAND TOURNOI</div>
          <div style={{ fontSize: isStory ? 44 : 32, fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.03em', marginBottom: 20 }}>
            {truncate(tName, 26)}
          </div>

          {/* InfoRow */}
          <div data-block="champ" style={{ ...tr('champ') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Date/venue */}
        <div data-block="meta" style={{ borderTop: `1px solid ${a}15`, paddingTop: 12, ...tr('meta') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 800, color: a, letterSpacing: '0.03em' }}>
                {dt.weekday.slice(0, 3)}. {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 140 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 700, color: 'rgba(255,255,255,0.42)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Letterbox top text */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.5em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>SPORTLINK PRODUCTIONS</span>
      </div>

      {/* Letterbox bottom text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tagline
          ? <div data-block="tagline" style={{ textAlign: 'center', ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span>
            </div>
          : <span style={{ fontSize: 8, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.1)' }}>sportlink.app</span>}
      </div>
    </div>
  );
}
