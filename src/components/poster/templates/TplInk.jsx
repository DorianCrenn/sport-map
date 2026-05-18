import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplInk({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#1a1a1a', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  // Ink uses a cream/white bg with black ink — accent is used for one highlight detail
  const ink = '#111111';
  const cream = '#F5F0E8';
  const highlight = accentColor === '#1a1a1a' ? '#E63C28' : accentColor;

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      backgroundColor: cream, boxSizing: 'border-box',
    }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(245,240,232,0.92)' }} />
      </>}

      {/* Thick top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: ink }} />

      {/* Thin accent rule */}
      <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 3, backgroundColor: highlight }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 20 : 14 }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', color: ink, textTransform: 'uppercase' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.15em', color: highlight, textTransform: 'uppercase', border: `1.5px solid ${highlight}`, padding: '2px 8px', borderRadius: 3 }}>
            {truncate(champ, 18)}
          </span>
        </div>

        {/* Stamp-style MATCH block */}
        <div data-block="title" style={{ marginBottom: isStory ? 16 : 10, ...tr('title') }}>
          <div style={{
            display: 'inline-block',
            border: `4px solid ${ink}`,
            padding: isStory ? '8px 14px' : '5px 10px',
            borderRadius: 4,
            position: 'relative',
          }}>
            <div style={{ fontSize: isStory ? 62 : 50, fontWeight: 900, color: ink, letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 0.9 }}>MATCH</div>
            <div style={{ position: 'absolute', bottom: -3, right: -3, left: -3, height: 3, backgroundColor: highlight }} />
          </div>
        </div>

        {/* Teams */}
        <div data-block="teams" style={{ flex: 1, display: 'flex', alignItems: 'center', ...tr('teams') }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isStory ? 10 : 8 }}>
            {/* Home */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: isStory ? 56 : 44, height: isStory ? 56 : 44,
                borderRadius: 6, border: `2.5px solid ${ink}`,
                backgroundColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: ink }}>{initials(homeName)}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: highlight, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Domicile</div>
                <div style={{ fontSize: scaledFs(homeName, 17, 14, 12), fontWeight: 900, color: ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {truncate(homeName, 20)}
                </div>
              </div>
            </div>

            {/* Divider with VS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1.5, backgroundColor: ink }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: ink, letterSpacing: '0.3em', paddingLeft: 4 }}>VS</span>
              <div style={{ flex: 1, height: 1.5, backgroundColor: highlight }} />
            </div>

            {/* Away */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: isStory ? 56 : 44, height: isStory ? 56 : 44,
                borderRadius: 6, border: '2px dashed rgba(0,0,0,0.25)',
                backgroundColor: 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: 'rgba(0,0,0,0.4)' }}>{initials(awayName)}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Extérieur</div>
                <div style={{ fontSize: scaledFs(awayName, 17, 14, 12), fontWeight: 900, color: 'rgba(0,0,0,0.55)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {truncate(awayName, 20)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div data-block="meta" style={{ borderTop: `2px solid ${ink}`, paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: ink, letterSpacing: '-0.03em' }}>{dt.day} {dt.month}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: highlight }}>{dt.time}</div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 130 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ink, lineHeight: 1.2 }}>{truncate(event?.venue || event?.city || '—', 20)}</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(0,0,0,0.28)', textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>

      {/* Thick bottom bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, backgroundColor: ink }} />
    </div>
  );
}
