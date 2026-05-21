import { fmtDate, champLabel, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

// Trophy SVG
function Trophy({ size = 64, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M32 44c-8 0-14-6-14-14V14h28v16c0 8-6 14-14 14z" fill={color} opacity="0.9"/>
      <path d="M18 18H10c0 8 4 13 8 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M46 18h8c0 8-4 13-8 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
      <rect x="26" y="44" width="12" height="6" rx="2" fill={color} opacity="0.7"/>
      <rect x="20" y="50" width="24" height="4" rx="2" fill={color} opacity="0.8"/>
      <path d="M28 30l3 3 5-6" stroke="#0D0D1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function TplTournamentArena({ event, homeTeam, championship, tagline, accentColor = '#8b5cf6', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams;
  const cats = event?.tournamentCategories;
  const tType = event?.tournamentType;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', backgroundColor: '#0A0A1E', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,10,30,0.88)' }} />
      </>}

      {/* Spotlight from top */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 420, borderRadius: '50%', background: `radial-gradient(ellipse at top, ${a}28 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Grid lines background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${a}08 1px, transparent 1px), linear-gradient(90deg, ${a}08 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${a}, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 24px 20px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 28 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', border: `1px solid ${a}40` }} />
            )}
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.28em', color: a, textTransform: 'uppercase' }}>
              {homeTeam?.name || 'SPORTLINK'}
            </span>
          </div>
          {tType && (
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', color: `${a}99`, textTransform: 'uppercase', border: `1px solid ${a}30`, borderRadius: 6, padding: '3px 8px' }}>
              {tType}
            </span>
          )}
        </div>

        {/* Trophy + title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isStory ? 18 : 10, ...tr('title') }}>
          <div style={{ filter: `drop-shadow(0 0 20px ${a}66)` }}>
            <Trophy size={isStory ? 72 : 56} color={a} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.32em', color: `${a}80`, textTransform: 'uppercase', marginBottom: 8 }}>TOURNOI</div>
            <div style={{ fontSize: isStory ? 28 : 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, textTransform: 'uppercase', textAlign: 'center', maxWidth: 280 }}>
              {truncate(tName, 40)}
            </div>
          </div>

          {/* Tags row */}
          <div data-block="champ" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0A0A1E', backgroundColor: a, padding: '4px 12px', borderRadius: 20 }}>
                {numTeams} ÉQUIPES
              </span>
            )}
            {cats && cats.split(',').slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, color: `${a}CC`, border: `1px solid ${a}44`, padding: '3px 10px', borderRadius: 20 }}>
                {c.trim()}
              </span>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a}40, transparent)`, margin: '14px 0' }} />

        {/* Meta */}
        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...tr('meta') }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: a }}>{dt.day} {dt.month}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>DATE</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{dt.time}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>HEURE</div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 100 }}>
            <div style={{ fontSize: venueFs(event?.venue || '', 11), fontWeight: 700, color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word', lineHeight: 1.25 }}>{event?.venue || event?.city || '—'}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>LIEU</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: `${a}70`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
