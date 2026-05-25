import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplColor({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#22D96A', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const topH = isStory ? 210 : 155;
  const tr = (id) => blockStyle(transforms, id);

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: '#111418' }}>
      {/* Colored top band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topH, backgroundColor: a }} />
      {/* Diagonal cut between color and dark */}
      <div style={{ position: 'absolute', top: topH - 24, left: 0, right: 0, height: 48, background: `linear-gradient(to bottom right, ${a} 50%, #111418 50%)` }} />
      {bgImage && <>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topH, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: topH, backgroundColor: `${a}CC` }} />
      </>}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top colored section */}
        <div style={{ padding: '20px 22px 0', height: topH, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 16 : 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(0,0,0,0.18)', textTransform: 'uppercase' }}>SPORTLINK</span>
            <div data-block="champ" style={{ ...tr('champ') }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase' }}>{truncate(champ, 18)}</span>
            </div>
          </div>

          <div data-block="title" style={{ lineHeight: 0.86, ...tr('title') }}>
            <div style={{ fontSize: isStory ? 80 : 66, fontWeight: 900, color: 'rgba(0,0,0,0.85)', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>MATCH</div>
            <div style={{ fontSize: isStory ? 80 : 66, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>DAY</div>
          </div>
        </div>

        {/* Dark bottom section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 22px 20px', marginTop: isStory ? 14 : 10 }}>

          {/* Teams */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('home-team') }}>
                <div style={{ width: isStory ? 78 : 64, height: isStory ? 78 : 64, borderRadius: isStory ? 20 : 16, border: `2px solid ${a}55`, backgroundColor: `${a}0D`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${a}20` }}>
                  {homeTeam?.logo
                    ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 56 : 46, height: isStory ? 56 : 46, objectFit: 'contain' }} crossOrigin="anonymous" />
                    : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: a }}>{initials(homeName)}</span>
                  }
                </div>
                <span style={{ fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 800, color: 'white', letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {truncate(homeName, 16)}
                </span>
              </div>

              <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${a}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: a, letterSpacing: '0.08em' }}>VS</span>
                </div>
              </div>

              <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('away-team') }}>
                <div style={{ width: isStory ? 78 : 64, height: isStory ? 78 : 64, borderRadius: isStory ? 20 : 16, border: '1.5px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {awayTeam?.logo
                    ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 56 : 46, height: isStory ? 56 : 46, objectFit: 'contain' }} crossOrigin="anonymous" />
                    : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 800, color: 'rgba(255,255,255,0.38)' }}>{initials(awayName)}</span>
                  }
                </div>
                <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.25 }}>
                  {truncate(awayName, 16)}
                </span>
              </div>
            </div>
          </div>

          {/* Rule */}
          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', margin: '14px 0 12px' }} />

          {/* Meta */}
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{dt.day} {dt.month}</div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Date</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{dt.time}</div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Heure</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 96 }}>
              <div style={{ fontSize: venueFs(event?.venue || event?.city || '—', 10.5), fontWeight: 700, color: 'white', wordBreak: 'break-word', lineHeight: 1.25 }}>{event?.venue || event?.city || '—'}</div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Lieu</div>
            </div>
          </div>

          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.22em', color: `${a}80`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
