import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplDark({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#E2C97E', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#000' }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)' }} />
      </>}
      {/* Very subtle warm ambient */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '35%', background: `linear-gradient(to bottom, ${a}06, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: isStory ? '28px 32px 26px' : '22px 28px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 32 : 20 }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.38em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>SPORTLINK</span>
          <div data-block="champ" style={{ ...tr('champ') }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: `${a}55`, textTransform: 'uppercase' }}>{truncate(champ, 16)}</span>
          </div>
        </div>

        {/* Big title — very light weight */}
        <div data-block="title" style={{ marginBottom: isStory ? 18 : 12, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 100 : 82, fontWeight: 100, color: 'white', letterSpacing: '-0.04em', lineHeight: 0.87, textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 100 : 82, fontWeight: 100, color: a, letterSpacing: '-0.04em', lineHeight: 0.87, textTransform: 'uppercase' }}>DAY</div>
        </div>

        {/* The one decoration: a thin accent line */}
        <div style={{ height: 1, backgroundColor: a, opacity: 0.55, marginBottom: isStory ? 26 : 18 }} />

        {/* Teams — very minimal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 18 : 12 }}>
          {[
            { team: homeTeam, name: homeName, isHome: true, blockId: 'home-team' },
            { team: awayTeam, name: awayName, isHome: false, blockId: 'away-team' },
          ].map(({ team, name, isHome, blockId }, i) => (
            <div key={i} data-block={blockId} style={{ display: 'flex', alignItems: 'center', gap: 16, ...tr(blockId) }}>
              {/* Logo — ultra-thin circle */}
              <div style={{ width: 54, height: 54, borderRadius: '50%', border: `0.5px solid ${isHome ? a : 'rgba(255,255,255,0.12)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isHome ? `${a}06` : 'transparent' }}>
                {team?.logo
                  ? <img src={team.logo} alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 14, fontWeight: 300, color: isHome ? a : 'rgba(255,255,255,0.3)' }}>{initials(name)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: scaledFs(name, isStory ? 18 : 14, 14, 11), fontWeight: 300, color: isHome ? 'white' : 'rgba(255,255,255,0.4)', letterSpacing: '0.04em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {truncate(name, 20)}
                </div>
                {isHome && <div style={{ width: 20, height: '0.5px', backgroundColor: a, marginTop: 6, opacity: 0.7 }} />}
              </div>
              {i === 0 && (
                <span style={{ fontSize: 8, fontWeight: 300, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em', flexShrink: 0 }}>vs</span>
              )}
            </div>
          ))}
        </div>

        {/* Thin meta line */}
        <div style={{ height: '0.5px', backgroundColor: 'rgba(255,255,255,0.08)', margin: `${isStory ? 22 : 14}px 0 ${isStory ? 18 : 12}px` }} />

        <div data-block="meta" style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: tagline ? 14 : 0, ...tr('meta') }}>
          {[dt.short, dt.time, (event?.venue || event?.city || '—').slice(0, 16)].map((val, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 300, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>{val}</span>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginBottom: 12, ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 400, letterSpacing: '0.3em', color: `${a}60`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 7.5, fontWeight: 300, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
