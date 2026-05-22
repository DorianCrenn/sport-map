import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrSummer({ event, homeTeam, championship, tagline, accentColor = '#FF8C42', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'SUMMER CUP';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;
  const prize = event?.prize;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(145deg, #FF6B35 0%, #FF8C42 35%, #FFBD59 70%, #FFD97D 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,100,30,0.82)' }} />
      </>}

      {/* Large circle decoration — top right */}
      <div style={{ position: 'absolute', top: isStory ? -60 : -40, right: -40, width: 220, height: 220, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', top: isStory ? -30 : -20, right: -20, width: 140, height: 140, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />

      {/* Small circles bottom left */}
      <div style={{ position: 'absolute', bottom: isStory ? 80 : 60, left: -20, width: 90, height: 90, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: isStory ? 110 : 80, left: 20, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Triangle accent */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 0 ${isStory ? 160 : 100}px ${isStory ? 180 : 120}px`, borderColor: `transparent transparent rgba(255,255,255,0.08) transparent` }} />

      {/* Bottom white section */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? 130 : 95, background: 'rgba(255,255,255,0.92)', borderRadius: '20px 20px 0 0' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '28px 24px 0' : '20px 22px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 24 : 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 26, height: 26, borderRadius: 8, objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.2)', padding: 2 }} />}
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 20 }}>
            {event?.date ? new Date(event.date).getFullYear() : '2025'}
          </span>
        </div>

        {/* SUMMER label */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>☀ TOURNOI ÉTÉ</span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 46 : 34, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.04em', textShadow: '0 2px 20px rgba(0,0,0,0.15)', marginBottom: 16 }}>
            {truncate(tName, 22)}
          </div>

          {/* Info tags */}
          <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', backgroundColor: 'rgba(255,255,255,0.22)', padding: '4px 14px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                {numTeams} ÉQUIPES
              </span>
            )}
            {tType && (
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20 }}>
                {tType}
              </span>
            )}
            {cats.slice(0, 2).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
            ))}
          </div>
        </div>

        {/* Bottom card — white section */}
        <div style={{ height: isStory ? 130 : 95, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: '#FF6B35', letterSpacing: '-0.02em' }}>
              {dt.weekday} {dt.day} {dt.month}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#555' }}>{dt.time}</span>
              <span style={{ fontSize: 10, color: '#bbb' }}>·</span>
              <span style={{ fontSize: venueFs(event?.venue || '', 11), fontWeight: 600, color: '#777' }}>{event?.venue || event?.city || '—'}</span>
            </div>
            {prize && (
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#FF6B35' }}>
                🏆 {prize}
              </div>
            )}
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 6, ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 500, letterSpacing: '0.2em', color: '#aaa', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
