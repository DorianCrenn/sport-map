import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrGradient({ event, homeTeam, championship, tagline, accentColor = '#6D28D9', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;
  const prize = event?.prize;

  // Derive complementary color
  const grad2 = '#EC4899';

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(135deg, ${a} 0%, #4F46E5 40%, ${grad2}CC 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a}E0 0%, #4F46E5CC 40%, ${grad2}BB 100%)` }} />
      </>}

      {/* Light mesh overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.5 }} />

      {/* Large half-circle decorations */}
      <div style={{ position: 'absolute', top: isStory ? -100 : -80, right: -80, width: 300, height: 300, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)' }} />
      <div style={{ position: 'absolute', top: isStory ? -60 : -50, right: -50, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Bottom large circle */}
      <div style={{ position: 'absolute', bottom: isStory ? -80 : -60, left: -60, width: 250, height: 250, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.4)' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '28px 24px 22px' : '22px 22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 24 : 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              </div>
            )}
            <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {tType && <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 20 }}>{tType}</span>}
          </div>
        </div>

        {/* TOURNOI badge */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.42em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>★ TOURNOI ★</span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 46 : 34, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.04em', textShadow: '0 4px 24px rgba(0,0,0,0.3)', marginBottom: 16 }}>
            {truncate(tName, 22)}
          </div>

          {/* Info row */}
          <div data-block="champ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: 22, backdropFilter: 'blur(8px)' }}>
                {numTeams} <span style={{ fontWeight: 600, fontSize: 9 }}>ÉQUIPES</span>
              </span>
            )}
            {cats.slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.12)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
            ))}
          </div>

          {prize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', width: 'fit-content' }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{prize}</span>
            </div>
          )}
        </div>

        {/* Bottom white card */}
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: isStory ? '14px 16px' : '10px 14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
              {dt.weekday} {dt.day} {dt.month} · {dt.time}
            </div>
            <div style={{ fontSize: venueFs(event?.venue || '', 11), color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: 600 }}>
              {event?.venue || event?.city || '—'}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 6, ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 500, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
