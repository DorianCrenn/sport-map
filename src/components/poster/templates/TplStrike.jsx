import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplStrike({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#22D96A', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  const stripeAngle = 55;
  const stripePattern = `repeating-linear-gradient(${stripeAngle}deg, transparent 0px, transparent 18px, ${a}18 18px, ${a}18 22px)`;

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      backgroundColor: '#0A0A0A', boxSizing: 'border-box',
    }}>
      {/* Stripe pattern overlay */}
      <div style={{ position: 'absolute', inset: 0, background: stripePattern }} />

      {/* Background image */}
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,10,10,0.85)' }} />
        <div style={{ position: 'absolute', inset: 0, background: stripePattern }} />
      </>}

      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${a}, ${a}99)` }} />

      {/* Big diagonal accent block behind teams */}
      <div style={{
        position: 'absolute',
        top: isStory ? 200 : 130,
        left: -60, right: -60,
        height: isStory ? 200 : 160,
        background: `linear-gradient(${stripeAngle}deg, ${a}22 0%, ${a}08 100%)`,
        transform: `skewY(-${stripeAngle * 0.2}deg)`,
      }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '24px 24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 24 : 16 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>SPORTLINK</span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{champ}</span>
        </div>

        {/* MATCH DAY */}
        <div data-block="title" style={{ marginBottom: isStory ? 8 : 6, ...tr('title') }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: isStory ? 68 : 54, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 0.9 }}>MATCH</span>
            <span style={{ fontSize: isStory ? 68 : 54, fontWeight: 900, color: a, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 0.9 }}>DAY</span>
          </div>
        </div>

        {/* Teams row */}
        <div data-block="teams" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, marginTop: isStory ? 16 : 10, ...tr('teams') }}>
          {/* Home */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: isStory ? 78 : 62, height: isStory ? 78 : 62,
              borderRadius: 16, border: `3px solid ${a}`,
              backgroundColor: `${a}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {homeTeam?.logo
                ? <img src={homeTeam.logo} alt="" style={{ width: '72%', height: '72%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 24 : 19, fontWeight: 900, color: a }}>{initials(homeName)}</span>
              }
            </div>
            <span style={{ fontSize: scaledFs(homeName, 12, 12, 8), fontWeight: 900, color: 'white', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: 110, wordBreak: 'break-word' }}>
              {truncate(homeName, 16)}
            </span>
          </div>

          {/* VS badge */}
          <div style={{
            flexShrink: 0,
            width: isStory ? 48 : 40, height: isStory ? 48 : 40,
            transform: 'rotate(45deg)',
            backgroundColor: a,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ transform: 'rotate(-45deg)', fontSize: 10, fontWeight: 900, color: '#0A0A0A', letterSpacing: '0.05em' }}>VS</span>
          </div>

          {/* Away */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: isStory ? 78 : 62, height: isStory ? 78 : 62,
              borderRadius: 16, border: '2px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {awayTeam?.logo
                ? <img src={awayTeam.logo} alt="" style={{ width: '72%', height: '72%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 24 : 19, fontWeight: 900, color: 'rgba(255,255,255,0.45)' }}>{initials(awayName)}</span>
              }
            </div>
            <span style={{ fontSize: scaledFs(awayName, 12, 12, 8), fontWeight: 900, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '-0.01em', lineHeight: 1.2, maxWidth: 110, wordBreak: 'break-word' }}>
              {truncate(awayName, 16)}
            </span>
          </div>
        </div>

        {/* Bottom info bar */}
        <div data-block="meta" style={{
          marginTop: isStory ? 20 : 14,
          borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `1px solid ${a}30`,
          padding: '12px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          ...tr('meta'),
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{dt.day} {dt.month}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 }}>Date</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: a }}>{dt.time}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 }}>Heure</div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 100 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>{truncate(event?.venue || event?.city || '—', 18)}</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1 }}>Lieu</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', color: `${a}70`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
