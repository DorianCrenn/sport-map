import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplSimple({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#3b82f6', bgImage, format = 'story', transforms = {} }) {
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
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#0D1117' }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13,17,23,0.88)' }} />
      </>}
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: a }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '26px 26px 22px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>

        {/* Title */}
        <div data-block="title" style={{ marginBottom: 14, lineHeight: 0.87, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 86 : 70, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 86 : 70, fontWeight: 900, color: a, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>DAY</div>
        </div>

        {/* Champ */}
        <div data-block="champ" style={{ marginBottom: 16, ...tr('champ') }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            {truncate(champ, 28)}
          </span>
        </div>

        {/* Rule */}
        <div style={{ height: 1, backgroundColor: `${a}35`, marginBottom: isStory ? 24 : 16 }} />

        {/* Teams */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: `2px solid ${a}55`, backgroundColor: `${a}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: a }}>{initials(homeName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 800, color: 'white', letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.25 }}>
                {truncate(homeName, 16)}
              </span>
            </div>

            <div style={{ flexShrink: 0, padding: '0 10px', textAlign: 'center' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>VS</span>
              </div>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: 'rgba(255,255,255,0.38)' }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.25 }}>
                {truncate(awayName, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Rule */}
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', margin: '16px 0 14px' }} />

        {/* Meta */}
        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
          {[
            { label: 'Date', value: `${dt.day} ${dt.month}` },
            { label: 'Heure', value: dt.time },
            { label: 'Lieu', value: event?.venue || event?.city || '—' },
          ].map(({ label, value }, i) => (
            <div key={i} style={{ textAlign: i === 2 ? 'right' : i === 0 ? 'left' : 'center', maxWidth: i === 2 ? 96 : undefined }}>
              <div style={{ fontSize: i === 2 ? venueFs(value, 11) : 11, fontWeight: 700, color: i === 0 ? a : 'rgba(255,255,255,0.7)', wordBreak: i === 2 ? 'break-word' : undefined, lineHeight: i === 2 ? 1.25 : undefined }}>{value}</div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.22em', color: `${a}80`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
