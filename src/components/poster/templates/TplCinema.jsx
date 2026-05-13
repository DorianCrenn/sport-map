import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplCinema({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#D4B896', bgImage, format = 'story' }) {
  const h = H[format] || H.story;
  const barH = format === 'story' ? 96 : 62;
  const bottomH = format === 'story' ? 66 : 48;
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
      boxSizing: 'border-box', backgroundColor: '#000',
    }}>
      {/* Middle section bg */}
      {bgImage && (
        <div style={{
          position: 'absolute', top: barH, left: 0, right: 0, height: h - barH - bottomH,
          backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      <div style={{
        position: 'absolute', top: barH, left: 0, right: 0, height: h - barH - bottomH,
        background: bgImage ? 'rgba(0,0,0,0.74)' : 'linear-gradient(155deg, #0F0D0C 0%, #1A1814 100%)',
      }} />
      {/* Subtle noise in middle */}
      <div style={{
        position: 'absolute', top: barH, left: 0, right: 0, height: h - barH - bottomH,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
        pointerEvents: 'none',
      }} />
      {/* Accent left border on middle section */}
      <div style={{ position: 'absolute', top: barH, left: 0, width: 2, height: h - barH - bottomH, background: `linear-gradient(to bottom, ${a}60, ${a}20, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top letterbox bar */}
        <div style={{ height: barH, backgroundColor: '#000', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 28px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: '0.45em', color: `${a}55`, textTransform: 'uppercase' }}>SPORTLINK</span>
            <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)' }}>FINISTÈRE</span>
          </div>
        </div>

        {/* Main cinematic area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 28px 16px' }}>

          {/* Champ */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.45em', color: `${a}55`, textTransform: 'uppercase' }}>
              — {truncate(champ, 20)} —
            </span>
          </div>

          {/* Big title */}
          <div style={{ marginBottom: 16, lineHeight: 0.87 }}>
            <div style={{ fontSize: isStory ? 82 : 68, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>MATCH</div>
            <div style={{ fontSize: isStory ? 82 : 68, fontWeight: 100, color: a, letterSpacing: '-0.04em', textTransform: 'uppercase', fontStyle: 'italic' }}>Day</div>
          </div>

          {/* Rule */}
          <div style={{ height: '0.5px', background: `linear-gradient(to right, ${a}45, transparent)`, marginBottom: 16 }} />

          {/* VS Section */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Home */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: isStory ? 78 : 62, height: isStory ? 78 : 62, borderRadius: '50%',
                  border: `1px solid ${a}55`,
                  backgroundColor: `${a}08`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 24px ${a}20, 0 8px 20px rgba(0,0,0,0.6)`,
                }}>
                  {homeTeam?.logo
                    ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 56 : 44, height: isStory ? 56 : 44, objectFit: 'contain' }} crossOrigin="anonymous" />
                    : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 600, color: a }}>{initials(homeName)}</span>
                  }
                </div>
                <span style={{ fontSize: scaledFs(homeName, 9.5, 12, 7.5), fontWeight: 600, color: a, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 90, wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {truncate(homeName, 16)}
                </span>
              </div>

              {/* VS */}
              <div style={{ textAlign: 'center', padding: '0 10px', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 100, color: `${a}45`, letterSpacing: '0.35em' }}>vs</span>
              </div>

              {/* Away */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: isStory ? 78 : 62, height: isStory ? 78 : 62, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                }}>
                  {awayTeam?.logo
                    ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 56 : 44, height: isStory ? 56 : 44, objectFit: 'contain' }} crossOrigin="anonymous" />
                    : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 600, color: 'rgba(255,255,255,0.38)' }}>{initials(awayName)}</span>
                  }
                </div>
                <span style={{ fontSize: scaledFs(awayName, 9.5, 12, 7.5), fontWeight: 600, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 90, wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {truncate(awayName, 16)}
                </span>
              </div>
            </div>
          </div>

          {/* Rule */}
          <div style={{ height: '0.5px', background: `linear-gradient(to right, transparent, ${a}40, transparent)`, marginBottom: 12 }} />

          {/* Meta */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: tagline ? 9 : 0 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.48)', letterSpacing: '0.04em' }}>{dt.short}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.48)', letterSpacing: '0.04em' }}>{dt.time}</span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em' }}>{(event?.venue || event?.city || '—').slice(0, 14)}</span>
          </div>

          {tagline && (
            <div>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.32em', color: `${a}65`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>

        {/* Bottom letterbox bar */}
        <div style={{ height: bottomH, backgroundColor: '#000', flexShrink: 0 }} />
      </div>
    </div>
  );
}
