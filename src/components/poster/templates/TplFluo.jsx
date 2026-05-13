import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#EDFF3A';
const DARK = '#0A0A0A';

export default function TplFluo({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#EDFF3A', bgImage, format = 'story', transforms = {} }) {
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
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      backgroundColor: BG, boxSizing: 'border-box',
    }}>
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.35em', color: DARK, textTransform: 'uppercase' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.2em', color: `${DARK}60`, textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>

        <div style={{ height: 3, backgroundColor: DARK, marginBottom: 14 }} />

        <div data-block="title" style={{ lineHeight: 0.87, marginBottom: 8, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 100 : 82, fontWeight: 900, color: DARK, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            MATCH
          </div>
          <div style={{ fontSize: isStory ? 100 : 82, fontWeight: 900, color: `${DARK}22`, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            DAY
          </div>
        </div>

        <div data-block="champ" style={{ marginBottom: 14, ...tr('champ') }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', color: `${DARK}55`, textTransform: 'uppercase' }}>
            {truncate(champ, 26)}
          </span>
        </div>

        <div style={{ height: 1, backgroundColor: `${DARK}18`, marginBottom: 16 }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
            <div style={{
              width: isStory ? 78 : 64, height: isStory ? 78 : 64, borderRadius: '50%',
              backgroundColor: `${DARK}10`, border: `2px solid ${DARK}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {homeTeam?.logo
                ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 56 : 46, height: isStory ? 56 : 46, objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: 20, fontWeight: 900, color: DARK }}>{initials(homeName)}</span>
              }
            </div>
            <span style={{ fontSize: scaledFs(homeName, 10, 12, 8), fontWeight: 900, color: DARK, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, lineHeight: 1.25, wordBreak: 'break-word' }}>
              {truncate(homeName, 16)}
            </span>
          </div>

          <div style={{ textAlign: 'center', padding: '0 10px', paddingBottom: 14, flexShrink: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 200, color: `${DARK}28`, letterSpacing: '-0.02em' }}>×</span>
          </div>

          <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
            <div style={{
              width: isStory ? 78 : 64, height: isStory ? 78 : 64, borderRadius: '50%',
              backgroundColor: `${DARK}06`, border: `1.5px solid ${DARK}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {awayTeam?.logo
                ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 56 : 46, height: isStory ? 56 : 46, objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: 20, fontWeight: 900, color: `${DARK}50` }}>{initials(awayName)}</span>
              }
            </div>
            <span style={{ fontSize: scaledFs(awayName, 10, 12, 8), fontWeight: 900, color: `${DARK}65`, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, lineHeight: 1.25, wordBreak: 'break-word' }}>
              {truncate(awayName, 16)}
            </span>
          </div>
        </div>

        <div style={{ height: 3, backgroundColor: DARK, marginTop: 14, marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tagline ? 10 : 0, alignItems: 'flex-end', ...tr('meta') }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: DARK, letterSpacing: '-0.01em', lineHeight: 1 }}>{dt.day} {dt.month}</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: `${DARK}50`, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 3 }}>Date</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: DARK, letterSpacing: '-0.01em', lineHeight: 1 }}>{dt.time}</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: `${DARK}50`, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 3 }}>Heure</div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 96 }}>
            <div style={{ fontSize: venueFs(event?.venue || event?.city || '—', 11), fontWeight: 900, color: DARK, letterSpacing: '-0.01em', lineHeight: 1.25, wordBreak: 'break-word' }}>{event?.venue || event?.city || '—'}</div>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: `${DARK}50`, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 3 }}>Lieu</div>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ borderTop: `1px solid ${DARK}18`, paddingTop: 8, ...tr('tagline') }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: `${DARK}55`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
