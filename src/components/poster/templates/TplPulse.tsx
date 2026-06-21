import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplPulse({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#10B981', bgImage, format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);
  const cx = 180;
  const cy = isStory ? 320 : 225;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, #060D16 0%, #040A12 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,10,18,0.88)' }} />
      </>}

      {/* Concentric rings — SVG */}
      <svg width={360} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[200, 160, 120, 84].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={a}
            strokeWidth={i === 0 ? 0.5 : i === 1 ? 0.5 : 0.5}
            opacity={[0.1, 0.15, 0.2, 0.28][i]}
            strokeDasharray={i < 2 ? '4 8' : 'none'}
          />
        ))}
        {/* Radial lines */}
        {[0, 45, 90, 135].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line key={i}
              x1={cx + Math.cos(rad) * 84} y1={cy + Math.sin(rad) * 84}
              x2={cx + Math.cos(rad) * 200} y2={cy + Math.sin(rad) * 200}
              stroke={a} strokeWidth={0.5} opacity={0.1}
            />
          );
        })}
      </svg>

      {/* Ambient center glow */}
      <div style={{ position: 'absolute', left: cx - 100, top: cy - 100, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${a}18 0%, transparent 60%)` }} />

      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${a}, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.22)' }}>SPORTLINK</span>
          <div data-block="champ" style={{ ...tr('champ') }}>
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{truncate(champ, 18)}</span>
          </div>
        </div>

        {/* Title */}
        <div data-block="title" style={{ marginBottom: isStory ? 8 : 6, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 80 : 64, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 0.87, textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 80 : 64, fontWeight: 900, color: a, letterSpacing: '-0.04em', lineHeight: 0.87, textTransform: 'uppercase' }}>DAY</div>
        </div>

        {/* Teams — centered, overlapping the pulse rings */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center', gap: 10 }}>

            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{
                width: isStory ? 82 : 68, height: isStory ? 82 : 68, borderRadius: '50%',
                border: `2px solid ${a}`,
                backgroundColor: `${a}0E`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 6px ${a}10, 0 0 0 12px ${a}06, 0 0 30px ${a}30`,
              }}>
                {homeTeam?.logo ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: a }}>{initials(homeName)}</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: scaledFs(homeName, 10, 12, 8), fontWeight: 800, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.2 }}>{truncate(homeName, 14)}</span>
                <div style={{ width: 20, height: 1.5, backgroundColor: a, margin: '5px auto 0', borderRadius: 1 }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{ width: '0.5px', height: 28, background: `linear-gradient(to bottom, transparent, ${a}50)` }} />
              <span style={{ fontSize: 11, fontWeight: 200, color: `${a}90`, letterSpacing: '0.25em' }}>vs</span>
              <div style={{ width: '0.5px', height: 28, background: `linear-gradient(to top, transparent, ${a}50)` }} />
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{
                width: isStory ? 82 : 68, height: isStory ? 82 : 68, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}>
                {awayTeam?.logo ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: 'rgba(255,255,255,0.38)' }}>{initials(awayName)}</span>}
              </div>
              <span style={{ fontSize: scaledFs(awayName, 10, 12, 8), fontWeight: 800, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 90, wordBreak: 'break-word', lineHeight: 1.2 }}>{truncate(awayName, 14)}</span>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${a}30, transparent)`, marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center', marginBottom: tagline ? 10 : 12, ...tr('meta') }}>
          {[dt.short, dt.time, event?.venue || event?.city || '—'].map((val, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>{val}</span>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ textAlign: 'center', marginBottom: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.28em', color: a, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
