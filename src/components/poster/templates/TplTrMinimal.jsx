import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrMinimal({ event, homeTeam, championship, tagline, accentColor = '#111111', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const ink = '#111111';
  const clay = sport.primary !== '#6D28D9' ? sport.primary : '#D97706';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#F5F4F0', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(245,244,240,0.94)' }} />
      </>}

      {/* Top accent bar — sport color */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: clay }} />

      {/* Left vertical rule */}
      <div style={{ position: 'absolute', left: 34, top: 0, bottom: 0, width: 1, background: `${ink}10` }} />

      {/* Sport ball — large watermark right side */}
      <div style={{ position: 'absolute', right: -40, top: '20%', opacity: 1, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'tennis'} size={isStory ? 200 : 150} color={clay} opacity={0.08} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '44px 32px 32px 52px' : '28px 28px 24px 52px' }}>

        {/* Label row */}
        <div style={{ marginBottom: isStory ? 28 : 16 }}>
          <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: '0.45em', color: `${ink}40`, textTransform: 'uppercase', marginBottom: 5 }}>TOURNOI SPORTIF</div>
          {organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 15, height: 15, borderRadius: 3, objectFit: 'contain', opacity: 0.6 }} />}
              <span style={{ fontSize: 8.5, fontWeight: 700, color: `${ink}55`, letterSpacing: '0.18em' }}>{organizer.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Title — hero */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          {event?.sport && (
            <div style={{ fontSize: 8, fontWeight: 700, color: clay, letterSpacing: '0.35em', textTransform: 'uppercase', marginBottom: 8, opacity: 0.85 }}>{event.sport}</div>
          )}
          <div style={{ fontSize: isStory ? 42 : 30, fontWeight: 900, color: ink, lineHeight: 0.93, letterSpacing: '-0.04em', marginBottom: 20 }}>
            {truncate(tName, 26)}
          </div>

          {/* Sport color accent bar */}
          <div style={{ width: 48, height: 3, backgroundColor: clay, marginBottom: 20, borderRadius: 2 }} />

          {/* Meta grid */}
          <div data-block="champ" style={{ display: 'grid', gridTemplateColumns: event?.numTeams && event?.tournamentType ? '1fr 1fr' : '1fr', gap: 14, marginBottom: 18, ...tr('champ') }}>
            {event?.numTeams && (
              <div>
                <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.22em', color: `${ink}45`, textTransform: 'uppercase', marginBottom: 3 }}>{sport.unit}</div>
                <div style={{ fontSize: isStory ? 24 : 19, fontWeight: 900, color: clay }}>{event.numTeams}</div>
              </div>
            )}
            {event?.tournamentType && (
              <div>
                <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.22em', color: `${ink}45`, textTransform: 'uppercase', marginBottom: 3 }}>NIVEAU</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: ink }}>{event.tournamentType}</div>
              </div>
            )}
          </div>

          {/* Categories */}
          {event?.tournamentCategories && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 700, color: '#F5F4F0', backgroundColor: ink, padding: '2px 10px', borderRadius: 3 }}>{c}</span>
              ))}
            </div>
          )}

          {/* InfoRow prize */}
          {event?.prize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: `1.5px solid ${clay}`, borderRadius: 4, width: 'fit-content' }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: clay }}>{event.prize}</span>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${ink}18`, paddingTop: 16 }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 900, color: ink, letterSpacing: '-0.01em' }}>
              {dt.weekday.slice(0, 3)}. {dt.day} {dt.month} {event?.date ? new Date(event.date).getFullYear() : ''}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {dt.time !== '—' && <span style={{ fontSize: 10, color: `${ink}60`, fontWeight: 600 }}>{dt.time}</span>}
              {dt.time !== '—' && <span style={{ fontSize: 10, color: `${ink}35` }}>·</span>}
              <span style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), color: `${ink}60`, fontWeight: 600 }}>{event?.venue || event?.city || '—'}</span>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 400, letterSpacing: '0.25em', color: `${ink}38`, textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
