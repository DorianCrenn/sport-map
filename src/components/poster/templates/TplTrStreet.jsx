import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrStreet({ event, homeTeam, championship, tagline, accentColor = '#FF6B00', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const prize = event?.prize;
  const organizer = event?.organizer || homeTeam?.name;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#0E0E0E', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,14,14,0.92)' }} />
      </>}

      {/* Giant diagonal slash */}
      <div style={{ position: 'absolute', top: 0, right: -80, width: '55%', height: '100%', background: `linear-gradient(180deg, ${a}20 0%, ${a}08 50%, transparent 100%)`, transform: 'skewX(-8deg)', pointerEvents: 'none' }} />

      {/* Bottom right circle */}
      <div style={{ position: 'absolute', bottom: isStory ? '-10%' : '-15%', right: '-10%', width: 260, height: 260, borderRadius: '50%', border: `1.5px solid ${a}25`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: isStory ? '-8%' : '-12%', right: '-8%', width: 200, height: 200, borderRadius: '50%', border: `1px solid ${a}15`, pointerEvents: 'none' }} />

      {/* Top left accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: `linear-gradient(90deg, ${a}, ${a}60 60%, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '28px 24px 22px' : '22px 22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isStory ? 28 : 16 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.36em', color: a, textTransform: 'uppercase', marginBottom: 4 }}>TOURNOI</div>
            {organizer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'contain' }} />}
                <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.16em' }}>{organizer.toUpperCase()}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {tType && <div style={{ fontSize: 9, fontWeight: 800, color: `${a}BB`, letterSpacing: '0.1em', padding: '2px 8px', border: `1px solid ${a}40`, borderRadius: 4 }}>{tType.toUpperCase()}</div>}
          </div>
        </div>

        {/* Big title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 56 : 42, fontWeight: 900, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.05em', textTransform: 'uppercase', marginBottom: 14 }}>
            {truncate(tName, 20).split(' ').map((w, i) => (
              <div key={i} style={{ color: i === 0 ? '#fff' : `${a}` }}>{w}</div>
            ))}
          </div>

          {/* Info row */}
          <div data-block="champ" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap', ...tr('champ') }}>
            {numTeams && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, backgroundColor: a }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: a }}>{numTeams}</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>ÉQUIPES</span>
              </div>
            )}
            {cats.slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>/ {c}</span>
            ))}
          </div>

          {prize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: `${a}15`, borderRadius: 6, border: `1px solid ${a}30`, width: 'fit-content' }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: `${a}DD` }}>{prize}</span>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 12 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 20 : 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                {dt.day} <span style={{ color: a }}>{dt.month}</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 160 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 700, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', color: `${a}40`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
