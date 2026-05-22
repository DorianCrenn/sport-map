import { fmtDate, truncate, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrEsport({ event, homeTeam, championship, tagline, accentColor = '#7C3AED', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;

  // Hex size for decorative pattern
  const hexSize = 36;
  const hexCount = isStory ? 16 : 10;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#080A14', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,20,0.94)' }} />
      </>}

      {/* Hex grid background */}
      <div style={{ position: 'absolute', top: 0, right: -20, width: '55%', height: '60%', opacity: 0.06, overflow: 'hidden' }}>
        {Array.from({ length: hexCount }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const x = col * 44 + (row % 2 === 0 ? 0 : 22);
          const y = row * 38;
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: hexSize, height: hexSize, border: `1px solid ${a}`, transform: 'rotate(30deg)', borderRadius: 4 }} />
          );
        })}
      </div>

      {/* Gradient overlay — left to right, bottom emphasis */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a}18 0%, transparent 50%, ${a}0A 100%)`, pointerEvents: 'none' }} />

      {/* Bottom glow */}
      <div style={{ position: 'absolute', bottom: '-5%', left: '30%', transform: 'translateX(-50%)', width: 340, height: 200, borderRadius: '50%', background: `radial-gradient(ellipse, ${a}30 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Left power bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, transparent, ${a}, transparent)` }} />

      {/* Top HUD line */}
      <div style={{ position: 'absolute', top: isStory ? 60 : 44, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${a}60, transparent)` }} />
      <div style={{ position: 'absolute', bottom: isStory ? 72 : 56, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}40, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '20px 22px 18px 24px' : '16px 20px 14px 24px' }}>

        {/* HUD header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: `${a}70`, letterSpacing: '0.3em', fontFamily: 'monospace' }}>
            SYS://TOURNAMENT.EXE
          </div>
          <div style={{ fontSize: 7.5, color: `${a}55`, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            {event?.date ? new Date(event.date).getFullYear() : 'MMXXV'}
          </div>
        </div>

        {/* ESPORT label */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.45em', color: a, textTransform: 'uppercase' }}>
            ◈ ESPORT TOURNAMENT
          </span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 44 : 32, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase', textShadow: `0 0 50px ${a}50`, marginBottom: 16 }}>
            {truncate(tName, 22)}
          </div>

          {/* Stats HUD */}
          <div data-block="champ" style={{ display: 'flex', gap: 12, marginBottom: 12, ...tr('champ') }}>
            {numTeams && (
              <div style={{ padding: '8px 14px', border: `1px solid ${a}40`, borderRadius: 8, background: `${a}10` }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: `${a}80`, letterSpacing: '0.2em', marginBottom: 2 }}>SLOTS</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 12px ${a}80` }}>{numTeams}</div>
              </div>
            )}
            {tType && (
              <div style={{ padding: '8px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', marginBottom: 2 }}>TIER</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{tType}</div>
              </div>
            )}
          </div>

          {/* Category tags */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {cats.slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8, fontWeight: 700, color: `${a}CC`, border: `1px solid ${a}30`, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.08em' }}>{c.toUpperCase()}</span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom HUD */}
        <div style={{ paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: `${a}60`, letterSpacing: '0.25em', marginBottom: 3 }}>DATE / LIEU</div>
            <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 900, color: a }}>{dt.day} {dt.month} · {dt.time}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{event?.venue || event?.city || '—'}</div>
          </div>
          {organizer && (
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain', border: `1px solid ${a}40` }} />}
              <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>{organizer.toUpperCase()}</span>
            </div>
          )}
        </div>
        {tagline && (
          <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.3em', color: `${a}35`, textTransform: 'uppercase', fontFamily: 'monospace' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
