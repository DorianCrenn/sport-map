import { fmtDate, champLabel, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTournamentFlame({ event, homeTeam, championship, tagline, accentColor = '#f97316', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams;
  const cats = event?.tournamentCategories;
  const tType = event?.tournamentType;
  const prize = event?.prize;

  // Warm dark bg derived from accent
  const bg1 = '#0D0500';
  const bg2 = '#1A0800';

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(160deg, ${bg2} 0%, ${bg1} 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, rgba(13,5,0,0.92) 0%, rgba(26,8,0,0.92) 100%)` }} />
      </>}

      {/* Flame glow bottom */}
      <div style={{ position: 'absolute', bottom: '-10%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 320, borderRadius: '50%', background: `radial-gradient(ellipse at bottom, ${a}40 0%, ${a}15 40%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Diagonal slash accent */}
      <div style={{ position: 'absolute', top: 0, right: -60, width: 180, height: '120%', background: `linear-gradient(180deg, ${a}18 0%, ${a}05 100%)`, transform: 'rotate(-12deg)', pointerEvents: 'none' }} />

      {/* Top right glow */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${a}22 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Accent left border + notch */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${a} 0%, ${a}88 50%, transparent 100%)` }} />
      <div style={{ position: 'absolute', left: 4, top: isStory ? 180 : 100, width: 40, height: 3, backgroundColor: a }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '26px 22px 20px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 36 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
                style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain', border: `1.5px solid ${a}50` }} />
            )}
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.26em', color: `${a}CC`, textTransform: 'uppercase' }}>
              {homeTeam?.name || 'SPORTLINK'}
            </span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: `${a}70`, letterSpacing: '0.2em', textTransform: 'uppercase' }}>2025</span>
        </div>

        {/* TOURNOI label */}
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.42em', color: a, textTransform: 'uppercase' }}>
            ◆ TOURNOI {tType ? `· ${tType.toUpperCase()}` : ''}
          </span>
        </div>

        {/* Giant title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 52 : 40, fontWeight: 900, color: '#fff', lineHeight: 0.95, letterSpacing: '-0.04em', textTransform: 'uppercase', marginBottom: 16 }}>
            {truncate(tName, 24).split(' ').map((w, i) => (
              <div key={i}>{w}</div>
            ))}
          </div>

          {/* Teams + cats */}
          <div data-block="champ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 12, fontWeight: 900, color: a }}>
                {numTeams} <span style={{ fontWeight: 500, color: `${a}99`, fontSize: 10 }}>ÉQUIPES</span>
              </span>
            )}
            {numTeams && cats && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>·</span>}
            {cats && (
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{cats}</span>
            )}
          </div>

          {/* Prize if any */}
          {prize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: `${a}99` }}>{prize}</span>
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div style={{ borderTop: `1px solid ${a}25`, paddingTop: 14 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 26 : 20, fontWeight: 900, color: a, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {dt.day} <span style={{ fontSize: isStory ? 18 : 14, color: `${a}BB` }}>{dt.month}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 140 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', 11), fontWeight: 700, color: 'rgba(255,255,255,0.6)', wordBreak: 'break-word', lineHeight: 1.25 }}>
                {event?.venue || event?.city || '—'}
              </div>
              {event?.city && event?.venue && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{event.city}</div>
              )}
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.22em', color: `${a}55`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
