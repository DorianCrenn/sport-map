import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#FAFAF7';
const DARK = '#1C1814';

export default function TplElegant({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#C4922A', bgImage, format = 'story', transforms = {} as any }) {
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
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(250,250,247,0.93)' }} />
      </>}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: isStory ? '28px 28px 22px' : '20px 24px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 12 : 8 }}>
          <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.28em', color: `${DARK}50`, textTransform: 'uppercase' }}>SPORTLINK</span>
          <div data-block="champ" style={{ ...tr('champ') }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.18em', color: `${DARK}38`, textTransform: 'uppercase' }}>{truncate(champ, 20)}</span>
          </div>
        </div>

        {/* Top rule */}
        <div style={{ height: 0.5, backgroundColor: `${DARK}14`, marginBottom: isStory ? 22 : 14 }} />

        {/* Title: italic serif "Match" + bold "DAY" */}
        <div data-block="title" style={{ marginBottom: isStory ? 8 : 5, ...tr('title') }}>
          <div style={{ fontFamily: 'Georgia,"Times New Roman",serif', fontSize: isStory ? 76 : 62, fontWeight: 400, fontStyle: 'italic', color: DARK, letterSpacing: '-0.02em', lineHeight: 0.88 }}>
            Match
          </div>
          <div style={{ fontSize: isStory ? 64 : 52, fontWeight: 900, color: a, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.06 }}>
            DAY
          </div>
        </div>

        {/* Decorative rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: isStory ? 20 : 13 }}>
          <div style={{ width: 20, height: 0.75, backgroundColor: a }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: a, opacity: 0.55 }} />
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${DARK}12` }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: a, opacity: 0.55 }} />
          <div style={{ width: 20, height: 0.75, backgroundColor: a }} />
        </div>

        {/* Teams */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>

            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: `1.5px solid ${a}55`, backgroundColor: `${a}07`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 18px ${a}14` }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontFamily: 'Georgia,serif', fontSize: isStory ? 22 : 18, fontWeight: 700, color: DARK }}>{initials(homeName)}</span>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 800, color: DARK, letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.2 }}>
                  {truncate(homeName, 16)}
                </span>
                <div style={{ width: 20, height: 1.5, backgroundColor: a, margin: '5px auto 0', borderRadius: 1 }} />
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 10px', paddingBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${DARK}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Georgia,serif', fontSize: 12, fontStyle: 'italic', fontWeight: 400, color: `${DARK}45` }}>vs</span>
              </div>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{ width: isStory ? 80 : 66, height: isStory ? 80 : 66, borderRadius: '50%', border: `1.5px solid ${DARK}10`, backgroundColor: `${DARK}04`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 58 : 48, height: isStory ? 58 : 48, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontFamily: 'Georgia,serif', fontSize: isStory ? 22 : 18, fontWeight: 700, color: `${DARK}50` }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 800, color: `${DARK}60`, letterSpacing: '0.03em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.2 }}>
                {truncate(awayName, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Diamond separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, margin: `${isStory ? 14 : 10}px 0` }}>
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${DARK}12` }} />
          <div style={{ width: 5, height: 5, transform: 'rotate(45deg)', backgroundColor: a, opacity: 0.6 }} />
          <div style={{ flex: 1, height: 0.5, backgroundColor: `${DARK}12` }} />
        </div>

        {/* Meta row with icons */}
        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tagline ? 10 : 14, ...tr('meta') }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: DARK, letterSpacing: '0.02em' }}>{dt.short}</span>
          </div>
          <div style={{ width: 1, height: 14, backgroundColor: `${DARK}12` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: DARK }}>{dt.time}</span>
          </div>
          <div style={{ width: 1, height: 14, backgroundColor: `${DARK}12` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.3 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: DARK, wordBreak: 'break-word', lineHeight: 1.25 }}>{event?.venue || event?.city || '—'}</span>
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginBottom: 12, ...tr('tagline') }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: `${DARK}38`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}

        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: a, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.24em', color: `${DARK}40`, textTransform: 'uppercase' }}>SPORTLINK</span>
        </div>
      </div>
    </div>
  );
}
