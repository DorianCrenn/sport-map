import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplGlass({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#6366f1', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  const glass = {
    backgroundColor: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.12)',
  };

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      background: `radial-gradient(ellipse at 30% 20%, ${a}55 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, ${a}33 0%, transparent 50%), #080B18`,
      boxSizing: 'border-box',
    }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 20%, ${a}66 0%, transparent 55%), rgba(8,11,24,0.82)` }} />
      </>}

      {/* Decorative orbs */}
      <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${a}22 0%, transparent 70%)`, top: -60, left: -60, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${a}18 0%, transparent 70%)`, bottom: -40, right: -40, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '22px 20px 18px' }}>

        {/* Top glass pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ ...glass, borderRadius: 20, padding: '4px 12px' }}>
            <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>SPORTLINK</span>
          </div>
          <div style={{ ...glass, borderRadius: 20, padding: '4px 12px', maxWidth: 170, overflow: 'hidden' }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.08em', color: a, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{champ}</span>
          </div>
        </div>

        {/* Teams section — two glass cards */}
        <div data-block="teams" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isStory ? 12 : 8, ...tr('teams') }}>
          {/* Home team */}
          <div style={{ ...glass, borderRadius: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${a}40` }}>
            <div style={{ width: isStory ? 58 : 46, height: isStory ? 58 : 46, borderRadius: 14, border: `2px solid ${a}`, backgroundColor: `${a}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {homeTeam?.logo
                ? <img src={homeTeam.logo} alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 900, color: a }}>{initials(homeName)}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: a, textTransform: 'uppercase', marginBottom: 3 }}>Domicile</div>
              <div style={{ fontSize: scaledFs(homeName, 16, 14, 11), fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncate(homeName, 22)}
              </div>
            </div>
          </div>

          {/* VS divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div style={{ ...glass, borderRadius: 10, padding: '4px 14px' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em' }}>VS</span>
            </div>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Away team */}
          <div style={{ ...glass, borderRadius: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: isStory ? 58 : 46, height: isStory ? 58 : 46, borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {awayTeam?.logo
                ? <img src={awayTeam.logo} alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{initials(awayName)}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 3 }}>Extérieur</div>
              <div style={{ fontSize: scaledFs(awayName, 16, 14, 11), fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '-0.02em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {truncate(awayName, 22)}
              </div>
            </div>
          </div>
        </div>

        {/* Meta info glass card */}
        <div data-block="meta" style={{ ...glass, borderRadius: 16, padding: '10px 14px', marginTop: isStory ? 18 : 12, display: 'flex', alignItems: 'center', gap: 0, ...tr('meta') }}>
          {/* Date */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: a, whiteSpace: 'nowrap' }}>{dt.day} {dt.month}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Date</div>
          </div>
          {/* Heure */}
          <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '0 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white', whiteSpace: 'nowrap' }}>{dt.time}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Heure</div>
          </div>
          {/* Lieu — 2 lignes, pas de troncature dure */}
          <div style={{ flex: 1.8, textAlign: 'right', paddingLeft: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {event?.venue || event?.city || '—'}
            </div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Lieu</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.24em', color: `${a}70`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
