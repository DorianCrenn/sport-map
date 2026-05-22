import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrMinimal({ event, homeTeam, championship, tagline, accentColor = '#111111', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor === '#111111' ? accentColor : accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#F7F6F2', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,246,242,0.94)' }} />
      </>}

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: a }} />

      {/* Side accent line */}
      <div style={{ position: 'absolute', left: 32, top: 0, bottom: 0, width: 1, background: `${a}12` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '40px 32px 32px 48px' : '28px 28px 24px 48px' }}>

        {/* Label row */}
        <div style={{ marginBottom: isStory ? 32 : 18 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.42em', color: a, textTransform: 'uppercase', opacity: 0.45, marginBottom: 4 }}>TOURNOI SPORTIF</div>
          {organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'contain', opacity: 0.7 }} />}
              <span style={{ fontSize: 9, fontWeight: 700, color: `${a}60`, letterSpacing: '0.18em' }}>{organizer.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Tournament name — hero */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 42 : 30, fontWeight: 900, color: a, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 20 }}>
            {truncate(tName, 28)}
          </div>

          {/* Thin divider */}
          <div style={{ width: 48, height: 2, backgroundColor: a, marginBottom: 20, opacity: 0.6 }} />

          {/* Meta grid */}
          <div data-block="champ" style={{ display: 'grid', gridTemplateColumns: numTeams && tType ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16, ...tr('champ') }}>
            {numTeams && (
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: `${a}50`, textTransform: 'uppercase', marginBottom: 3 }}>ÉQUIPES</div>
                <div style={{ fontSize: isStory ? 22 : 18, fontWeight: 900, color: a }}>{numTeams}</div>
              </div>
            )}
            {tType && (
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', color: `${a}50`, textTransform: 'uppercase', marginBottom: 3 }}>NIVEAU</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: a }}>{tType}</div>
              </div>
            )}
          </div>

          {/* Categories */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 700, color: '#F7F6F2', backgroundColor: a, padding: '2px 10px', borderRadius: 4 }}>{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div style={{ borderTop: `1px solid ${a}20`, paddingTop: 16 }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: a, letterSpacing: '-0.01em' }}>
              {dt.weekday.slice(0, 3)}. {dt.day} {dt.month} {event?.date ? new Date(event.date).getFullYear() : ''}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: `${a}65`, fontWeight: 600 }}>{dt.time}</span>
              <span style={{ fontSize: 10, color: `${a}40` }}>·</span>
              <span style={{ fontSize: venueFs(event?.venue || '', 10), color: `${a}65`, fontWeight: 600 }}>{event?.venue || event?.city || '—'}</span>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 400, letterSpacing: '0.22em', color: `${a}40`, textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
