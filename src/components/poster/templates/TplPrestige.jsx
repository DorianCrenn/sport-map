import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#0C1018';
const CREAM = '#EDE8DC';

export default function TplPrestige({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#C8A96E', bgImage, format = 'story', transforms = {} }) {
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
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: BG }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(12,16,24,0.88)' }} />
      </>}

      {/* Corner ornaments */}
      <div style={{ position: 'absolute', top: 14, left: 14, width: 26, height: 26, borderTop: `1px solid ${a}45`, borderLeft: `1px solid ${a}45` }} />
      <div style={{ position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderTop: `1px solid ${a}45`, borderRight: `1px solid ${a}45` }} />
      <div style={{ position: 'absolute', bottom: 14, left: 14, width: 26, height: 26, borderBottom: `1px solid ${a}45`, borderLeft: `1px solid ${a}45` }} />
      <div style={{ position: 'absolute', bottom: 14, right: 14, width: 26, height: 26, borderBottom: `1px solid ${a}45`, borderRight: `1px solid ${a}45` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: isStory ? '36px 32px 28px' : '26px 28px 22px' }}>

        {/* Champ centered */}
        <div data-block="champ" style={{ textAlign: 'center', marginBottom: isStory ? 10 : 7, ...tr('champ') }}>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.28em', color: `${a}75`, textTransform: 'uppercase' }}>{truncate(champ, 22)}</span>
        </div>

        {/* Gold rule with diamond */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 20 : 13 }}>
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}28` }} />
          <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', backgroundColor: a, opacity: 0.55 }} />
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}28` }} />
        </div>

        {/* Title */}
        <div data-block="title" style={{ textAlign: 'center', marginBottom: isStory ? 6 : 4, ...tr('title') }}>
          <div style={{ fontFamily: 'Georgia,"Times New Roman",serif', fontSize: isStory ? 70 : 58, fontWeight: 400, fontStyle: 'italic', color: CREAM, letterSpacing: '-0.01em', lineHeight: 0.9 }}>
            Match
          </div>
          <div style={{ fontSize: isStory ? 62 : 50, fontWeight: 900, color: a, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.02 }}>
            DAY
          </div>
        </div>

        {/* Deco rule under title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: `${isStory ? 14 : 9}px 0 ${isStory ? 20 : 14}px` }}>
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}18` }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: a, opacity: 0.45 }} />
          <div style={{ width: 22, height: 0.75, backgroundColor: a, opacity: 0.7 }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: a, opacity: 0.45 }} />
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}18` }} />
        </div>

        {/* Teams */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>

            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: `1.5px solid ${a}55`, backgroundColor: `${a}09`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 28px ${a}14` }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontFamily: 'Georgia,serif', fontSize: isStory ? 22 : 18, fontWeight: 700, color: a }}>{initials(homeName)}</span>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 700, color: CREAM, letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                  {truncate(homeName, 16)}
                </span>
                <div style={{ width: 18, height: 1, backgroundColor: a, margin: '5px auto 0', opacity: 0.65 }} />
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 10px', paddingBottom: 18 }}>
              <span style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontStyle: 'italic', fontWeight: 300, color: `${a}55`, letterSpacing: '0.04em' }}>vs</span>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontFamily: 'Georgia,serif', fontSize: isStory ? 22 : 18, fontWeight: 700, color: `${CREAM}55` }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 700, color: `${CREAM}65`, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.2 }}>
                {truncate(awayName, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Gold separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: `${isStory ? 14 : 10}px 0` }}>
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}22` }} />
          <div style={{ width: 4, height: 4, transform: 'rotate(45deg)', backgroundColor: a, opacity: 0.5 }} />
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${a}22` }} />
        </div>

        {/* Meta */}
        <div data-block="meta" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CREAM, letterSpacing: '0.04em' }}>{dt.short}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: `${a}65`, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Date</div>
          </div>
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: `${a}35` }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CREAM }}>{dt.time}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: `${a}65`, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Heure</div>
          </div>
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: `${a}35` }} />
          <div style={{ textAlign: 'center', maxWidth: 96 }}>
            <div style={{ fontSize: venueFs(event?.venue || event?.city || '—', 11), fontWeight: 700, color: CREAM, wordBreak: 'break-word', lineHeight: 1.25 }}>{event?.venue || event?.city || '—'}</div>
            <div style={{ fontSize: 7.5, fontWeight: 600, color: `${a}65`, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>Lieu</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ textAlign: 'center', marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: `${a}55`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}

        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: isStory ? 14 : 10 }}>
          <div style={{ width: 24, height: 0.5, backgroundColor: `${a}28` }} />
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: `${a}50`, textTransform: 'uppercase' }}>SPORTLINK</span>
          <div style={{ width: 24, height: 0.5, backgroundColor: `${a}28` }} />
        </div>
      </div>
    </div>
  );
}
