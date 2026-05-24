import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const GOLD = '#D4AF37';

function DoubleRule({ c }) {
  return (
    <div>
      <div style={{ height: '0.5px', background: `linear-gradient(to right, transparent, ${c}65, transparent)`, marginBottom: 3.5 }} />
      <div style={{ height: '0.5px', background: `linear-gradient(to right, transparent, ${c}22, transparent)` }} />
    </div>
  );
}

export default function TplLuxe({ event, homeTeam, awayTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor || GOLD;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '26px 28px 22px', boxSizing: 'border-box',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: '#060200' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,2,0,0.87)' }} />
      </>}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: `radial-gradient(circle, ${a}0C 0%, transparent 65%)` }} />
      <div style={{ position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, background: `radial-gradient(circle, ${a}08 0%, transparent 65%)` }} />
      <div style={{ position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, border: `0.5px solid ${a}18`, borderRadius: 4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div data-block="champ" style={{ textAlign: 'center', marginBottom: 14, ...tr('champ') }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.38em', color: `${a}70`, textTransform: 'uppercase' }}>
            — {truncate(champ, 22)} —
          </span>
        </div>

        <DoubleRule c={a} />
        <div style={{ height: 14 }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${a}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${a}0C` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a10 10 0 0 1 4.2 19.1M12 2a10 10 0 0 0-4.2 19.1M2.5 9h19M2.5 15h19M12 2c-2.8 4-4 7-4 10s1.2 6 4 10M12 2c2.8 4 4 7 4 10s-1.2 6-4 10"/>
            </svg>
          </div>
        </div>

        <div data-block="title" style={{ textAlign: 'center', lineHeight: 0.88, marginBottom: 16, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 80 : 66, fontWeight: 700, color: 'white', letterSpacing: '-0.03em' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 80 : 66, fontWeight: 200, color: a, letterSpacing: '-0.03em', fontStyle: 'italic', marginTop: -5 }}>Day</div>
        </div>

        <div style={{ marginBottom: 20 }}><DoubleRule c={a} /></div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-around' }}>

            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{
                width: 78, height: 78, borderRadius: '50%',
                border: `1.5px solid ${a}70`, backgroundColor: `${a}0C`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 1px ${a}20, 0 0 28px ${a}25, 0 8px 24px rgba(0,0,0,0.55)`,
              }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 20, fontWeight: 600, color: a }}>{initials(homeName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(homeName, 9.5, 12, 7.5), fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 90, wordBreak: 'break-word', lineHeight: 1.25 }}>
                {truncate(homeName, 18)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ height: 32, width: '0.5px', background: `linear-gradient(to bottom, transparent, ${a}45, transparent)` }} />
              <span style={{ fontSize: 12, fontWeight: 200, color: `${a}90`, letterSpacing: '0.22em' }}>vs</span>
              <div style={{ height: 32, width: '0.5px', background: `linear-gradient(to bottom, transparent, ${a}45, transparent)` }} />
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{
                width: 78, height: 78, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(awayName, 9.5, 12, 7.5), fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 90, wordBreak: 'break-word', lineHeight: 1.25 }}>
                {truncate(awayName, 18)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}><DoubleRule c={a} /></div>

        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 14, ...tr('meta') }}>
          {[
            { label: 'Date', value: dt.short },
            { label: 'Heure', value: dt.time },
            { label: 'Stade', value: event?.venue || event?.city || '—' },
          ].map(({ label, value }, i) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.28em', color: `${a}60`, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: i === 2 ? venueFs(value, 10.5) : 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', wordBreak: i === 2 ? 'break-word' : undefined, lineHeight: i === 2 ? 1.25 : undefined }}>{value}</div>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ textAlign: 'center', marginBottom: 11, ...tr('tagline') }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.38em', color: `${a}65`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', color: `${a}55`, textTransform: 'uppercase' }}>SPORTLINK · FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
