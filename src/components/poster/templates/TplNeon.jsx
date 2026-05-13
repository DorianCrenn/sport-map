import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplNeon({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#00F5FF', bgImage, format = 'story' }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box',
    }}>
      {/* Deep dark bg */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #040111 0%, #060318 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,1,17,0.88)' }} />
      </>}
      {/* Neon glow orbs */}
      <div style={{ position: 'absolute', top: '8%', left: '10%', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${a}10 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', bottom: '12%', right: '8%', width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${a}08 0%, transparent 65%)` }} />
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 24px 20px' }}>

        {/* Top pill bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20, padding: '8px 14px',
          borderRadius: 10,
          border: `1px solid ${a}25`,
          backgroundColor: `${a}08`,
        }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.38em', color: a, textTransform: 'uppercase', textShadow: `0 0 10px ${a}` }}>
            {truncate(champ, 22)}
          </span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: a, boxShadow: `0 0 8px ${a}, 0 0 16px ${a}` }} />
        </div>

        {/* Title */}
        <div style={{ marginBottom: isStory ? 22 : 14, textAlign: 'center', lineHeight: 0.87 }}>
          <div style={{ fontSize: isStory ? 74 : 60, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
            MATCH
          </div>
          <div style={{
            fontSize: isStory ? 74 : 60, fontWeight: 900, color: a,
            letterSpacing: '-0.04em', textTransform: 'uppercase',
            textShadow: `0 0 24px ${a}70, 0 0 48px ${a}35`,
          }}>
            DAY
          </div>
        </div>

        {/* Accent separator */}
        <div style={{ height: '0.5px', background: `linear-gradient(to right, transparent, ${a}50, transparent)`, marginBottom: isStory ? 22 : 16 }} />

        {/* VS Section */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Home */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 82, height: 82, borderRadius: '50%',
                border: `1.5px solid ${a}`,
                backgroundColor: `${a}0C`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 4px ${a}15, 0 0 24px ${a}45, 0 0 48px ${a}20`,
              }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 22, fontWeight: 800, color: a, textShadow: `0 0 10px ${a}` }}>{initials(homeName)}</span>
                }
              </div>
              <span style={{
                fontSize: scaledFs(homeName, 10, 12, 8), fontWeight: 700,
                color: a, letterSpacing: '0.08em', textTransform: 'uppercase',
                textAlign: 'center', maxWidth: 100,
                textShadow: `0 0 10px ${a}55`,
                wordBreak: 'break-word', lineHeight: 1.25,
              }}>
                {truncate(homeName, 16)}
              </span>
            </div>

            {/* VS */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, padding: '0 8px' }}>
              <div style={{ width: '0.5px', height: 30, background: `linear-gradient(to bottom, transparent, ${a}60)` }} />
              <span style={{ fontSize: 13, fontWeight: 200, color: a, letterSpacing: '0.35em', textShadow: `0 0 16px ${a}` }}>vs</span>
              <div style={{ width: '0.5px', height: 30, background: `linear-gradient(to top, transparent, ${a}60)` }} />
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 82, height: 82, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: 60, height: 60, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.38)' }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{
                fontSize: scaledFs(awayName, 10, 12, 8), fontWeight: 700,
                color: 'rgba(255,255,255,0.68)', letterSpacing: '0.08em', textTransform: 'uppercase',
                textAlign: 'center', maxWidth: 100,
                wordBreak: 'break-word', lineHeight: 1.25,
              }}>
                {truncate(awayName, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Glassmorphism info panel */}
        <div style={{
          marginTop: 14, padding: '12px 16px', borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${a}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          marginBottom: tagline ? 10 : 14,
        }}>
          {[
            { lbl: 'DATE', val: dt.short },
            { lbl: 'HEURE', val: dt.time },
            { lbl: 'LIEU', val: (event?.venue || event?.city || '—').slice(0, 10) },
          ].map(({ lbl, val }, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: `${a}65`, letterSpacing: '0.3em', marginBottom: 3 }}>{lbl}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{val}</div>
            </div>
          ))}
        </div>

        {tagline && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.28em', color: a, textTransform: 'uppercase', textShadow: `0 0 10px ${a}55` }}>{tagline}</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.32em', color: `${a}55` }}>SPORTLINK · FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
