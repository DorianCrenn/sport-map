import { fmtDate, champLabel, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTournamentBracket({ event, homeTeam, championship, tagline, accentColor = '#8b5cf6', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams ? Number(event.numTeams) : 8;
  const cats = event?.tournamentCategories;
  const fmt = event?.tournamentFormat;

  // Bracket lines (decorative right side)
  const bracketColor = `${a}30`;
  const rounds = Math.ceil(Math.log2(numTeams));

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', backgroundColor: '#0F1E3A', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15,30,58,0.9)' }} />
      </>}

      {/* Decorative bracket SVG right side */}
      <svg style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 140, opacity: 0.22 }} viewBox="0 0 140 640" fill="none" preserveAspectRatio="none">
        {/* Round 1 - 4 matches */}
        {[80, 180, 300, 400].map((y, i) => (
          <g key={i}>
            <line x1="20" y1={y} x2="60" y2={y} stroke={a} strokeWidth="1.5"/>
            <line x1="20" y1={y + 28} x2="60" y2={y + 28} stroke={a} strokeWidth="1.5"/>
            <line x1="20" y1={y} x2="20" y2={y + 28} stroke={a} strokeWidth="1.5"/>
            <line x1="60" y1={y + 14} x2="90" y2={y + 14} stroke={a} strokeWidth="1.5"/>
          </g>
        ))}
        {/* Round 2 - 2 matches */}
        {[94, 314].map((y, i) => (
          <g key={`r2-${i}`}>
            <line x1="90" y1={y} x2="110" y2={y} stroke={a} strokeWidth="1.5"/>
            <line x1="90" y1={y + 28} x2="110" y2={y + 28} stroke={a} strokeWidth="1.5"/>
            <line x1="90" y1={y} x2="90" y2={y + 28} stroke={a} strokeWidth="1.5"/>
            <line x1="110" y1={y + 14} x2="130" y2={y + 14} stroke={a} strokeWidth="1.5"/>
          </g>
        ))}
        {/* Final */}
        <line x1="130" y1={108} x2="138" y2={108} stroke={a} strokeWidth="2"/>
        <line x1="130" y1={328} x2="138" y2={328} stroke={a} strokeWidth="2"/>
        <line x1="130" y1={108} x2="130" y2={328} stroke={a} strokeWidth="2"/>
        {/* Trophy at top */}
        <circle cx="110" cy="30" r="14" stroke={a} strokeWidth="1.5" fill={`${a}10`}/>
        <text x="110" y="35" textAnchor="middle" fontSize="12" fill={a}>🏆</text>
      </svg>

      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${a}, ${a}33, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '28px 160px 20px 24px' }}>

        {/* Club + type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 30 : 18 }}>
          {homeTeam?.logo && (
            <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
              style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'contain' }} />
          )}
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.28em', color: `${a}CC`, textTransform: 'uppercase' }}>
            {homeTeam?.name || 'SPORTLINK'}
          </span>
        </div>

        {/* Main title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, ...tr('title') }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', color: `${a}70`, textTransform: 'uppercase', marginBottom: 4 }}>
            TOURNOI · {rounds} TOURS
          </div>
          <div style={{ fontSize: isStory ? 32 : 24, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
            {truncate(tName, 30)}
          </div>

          {/* Teams count visual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: Math.min(numTeams, 8) }).map((_, i) => (
                <div key={i} style={{ width: 8, height: 28, borderRadius: 3, backgroundColor: i < Math.min(numTeams, 8) ? `${a}${i < 2 ? 'FF' : i < 4 ? 'BB' : '77'}` : 'rgba(255,255,255,0.08)' }} />
              ))}
              {numTeams > 8 && <span style={{ fontSize: 10, color: `${a}80`, alignSelf: 'center', fontWeight: 700 }}>+{numTeams - 8}</span>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: a }}>{numTeams} ÉQUIPES</span>
          </div>

          {/* Categories + format */}
          <div data-block="champ" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8, ...tr('champ') }}>
            {cats && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{cats}</span>
            )}
            {fmt && (
              <span style={{ fontSize: 9, fontWeight: 700, color: `${a}80`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{fmt}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', margin: '14px 0 12px' }} />

        {/* Meta */}
        <div data-block="meta" style={{ display: 'flex', flexDirection: 'column', gap: 5, ...tr('meta') }}>
          <div style={{ display: 'flex', align: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: a }}>{dt.day} {dt.month}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{dt.time}</span>
          </div>
          <span style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>
            {event?.venue || event?.city || '—'}
          </span>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.2em', color: `${a}55`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
