import { fmtDate, champLabel, truncate, blockStyle, venueFs, initials } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function CrownSvg({ size = 72, color = '#D4AF37' }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 120 84" fill="none">
      {/* Crown body */}
      <path d="M10 70 L10 40 L35 60 L60 10 L85 60 L110 40 L110 70 Z" fill={color} opacity="0.9"/>
      {/* Jewels */}
      <circle cx="60" cy="10" r="6" fill={color} opacity="1" filter="url(#glow)"/>
      <circle cx="10" cy="40" r="4.5" fill={color} opacity="0.8"/>
      <circle cx="110" cy="40" r="4.5" fill={color} opacity="0.8"/>
      {/* Base */}
      <rect x="6" y="70" width="108" height="10" rx="3" fill={color} opacity="0.7"/>
      {/* Inner highlight */}
      <path d="M20 65 L35 55 L60 20 L85 55 L100 65" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export default function TplTournamentCrown({ event, homeTeam, championship, tagline, accentColor = '#D4AF37', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams;
  const cats = event?.tournamentCategories;
  const fmt = event?.tournamentFormat;
  const organizer = event?.organizer || homeTeam?.name;

  const year = event?.date ? new Date(event.date).getFullYear() : new Date().getFullYear();

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Georgia","Times New Roman",serif', backgroundColor: '#06101E', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(6,16,30,0.92)' }} />
      </>}

      {/* Gold corner ornaments */}
      <div style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderTop: `2px solid ${a}66`, borderLeft: `2px solid ${a}66` }} />
      <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderTop: `2px solid ${a}66`, borderRight: `2px solid ${a}66` }} />
      <div style={{ position: 'absolute', bottom: 16, left: 16, width: 40, height: 40, borderBottom: `2px solid ${a}66`, borderLeft: `2px solid ${a}66` }} />
      <div style={{ position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderBottom: `2px solid ${a}66`, borderRight: `2px solid ${a}66` }} />

      {/* Gold glow behind crown */}
      <div style={{ position: 'absolute', top: isStory ? '18%' : '10%', left: '50%', transform: 'translateX(-50%)', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${a}14 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Subtle horizontal gold lines */}
      {[...Array(isStory ? 8 : 5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', left: '10%', right: '10%', top: `${12 + i * (isStory ? 11 : 15)}%`,
          height: '0.5px', backgroundColor: `${a}${i % 2 === 0 ? '10' : '06'}`,
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 28px 28px' }}>

        {/* Year badge */}
        <div style={{ marginBottom: isStory ? 20 : 10, textAlign: 'center' }}>
          <span style={{ fontSize: 8, fontWeight: 400, letterSpacing: '0.4em', color: `${a}88`, textTransform: 'uppercase' }}>
            ÉDITION {year}
          </span>
        </div>

        {/* Crown */}
        <div style={{ marginBottom: isStory ? 18 : 10, filter: `drop-shadow(0 4px 24px ${a}55)` }}>
          <CrownSvg size={isStory ? 88 : 68} color={a} />
        </div>

        {/* Club logo + name */}
        {(homeTeam?.logo || organizer) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 24 : 14 }}>
            {homeTeam?.logo && (
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
                style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }} />
            )}
            {organizer && (
              <span style={{ fontSize: 8.5, fontWeight: 400, letterSpacing: '0.28em', color: `${a}AA`, textTransform: 'uppercase', fontFamily: '"Inter",sans-serif' }}>
                {organizer}
              </span>
            )}
          </div>
        )}

        {/* Tournament name */}
        <div data-block="title" style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, ...tr('title') }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 400, letterSpacing: '0.5em', color: `${a}66`, textTransform: 'uppercase', marginBottom: 10, fontFamily: '"Inter",sans-serif' }}>
              ✦ GRAND TOURNOI ✦
            </div>
            <div style={{ fontSize: isStory ? 30 : 22, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {truncate(tName, 36)}
            </div>
          </div>

          {/* Gold divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, transparent, ${a}60)` }} />
            <span style={{ fontSize: 10, color: a }}>◆</span>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${a}60, transparent)` }} />
          </div>

          {/* Info pills */}
          <div data-block="champ" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, fontFamily: '"Inter",sans-serif', ...tr('champ') }}>
            {numTeams && (
              <span style={{ fontSize: 10, fontWeight: 600, color: '#06101E', backgroundColor: a, padding: '4px 14px', borderRadius: 20 }}>
                {numTeams} ÉQUIPES
              </span>
            )}
            {cats && cats.split(',').slice(0, 2).map((c, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 500, color: `${a}BB`, border: `1px solid ${a}40`, padding: '3px 10px', borderRadius: 20 }}>
                {c.trim()}
              </span>
            ))}
            {fmt && (
              <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.4)', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20 }}>
                {fmt}
              </span>
            )}
          </div>
        </div>

        {/* Gold divider */}
        <div style={{ width: '80%', height: '0.5px', background: `linear-gradient(90deg, transparent, ${a}50, transparent)`, margin: '14px 0' }} />

        {/* Date/venue */}
        <div data-block="meta" style={{ textAlign: 'center', fontFamily: '"Inter",sans-serif', ...tr('meta') }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: a, letterSpacing: '0.02em' }}>
            {dt.weekday} {dt.day} {dt.month}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
            {dt.time} · {event?.venue || event?.city || '—'}
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, fontFamily: '"Inter",sans-serif', ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 400, letterSpacing: '0.3em', color: `${a}44`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
