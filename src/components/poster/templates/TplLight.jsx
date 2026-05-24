import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#F7F5F2';
const DARK = '#1A1714';

export default function TplLight({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#E05C2A', bgImage, format = 'story', transforms = {} }) {
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
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(247,245,242,0.92)' }} />
      </>}
      {/* Left accent stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: a }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 22px 20px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.18em', color: `${DARK}45`, textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>

        {/* Double rule */}
        <div style={{ height: 2, backgroundColor: DARK, marginBottom: 3 }} />
        <div style={{ height: '0.5px', backgroundColor: `${DARK}20`, marginBottom: 14 }} />

        {/* Title */}
        <div data-block="title" style={{ lineHeight: 0.86, marginBottom: 12, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 84 : 68, fontWeight: 900, color: DARK, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 84 : 68, fontWeight: 900, color: a, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>DAY</div>
        </div>

        {/* Champ */}
        <div data-block="champ" style={{ marginBottom: 16, ...tr('champ') }}>
          <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', color: `${DARK}55` }}>
            {truncate(champ, 28)}
          </span>
        </div>

        {/* Double rule */}
        <div style={{ height: '0.5px', backgroundColor: `${DARK}20`, marginBottom: 3 }} />
        <div style={{ height: 2, backgroundColor: DARK, marginBottom: isStory ? 24 : 16 }} />

        {/* Teams */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('home-team') }}>
              <div style={{ width: isStory ? 76 : 62, height: isStory ? 76 : 62, borderRadius: '50%', border: `2px solid ${DARK}12`, backgroundColor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                {homeTeam?.logo
                  ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 56 : 44, height: isStory ? 56 : 44, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 20 : 17, fontWeight: 900, color: DARK }}>{initials(homeName)}</span>
                }
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 900, color: DARK, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.25 }}>
                  {truncate(homeName, 16)}
                </span>
                <div style={{ width: 18, height: 2, backgroundColor: a, margin: '5px auto 0', borderRadius: 1 }} />
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center', padding: '0 12px', paddingBottom: 16 }}>
              <span style={{ fontSize: 20, fontWeight: 200, color: `${DARK}35`, letterSpacing: '0.05em' }}>×</span>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('away-team') }}>
              <div style={{ width: isStory ? 76 : 62, height: isStory ? 76 : 62, borderRadius: '50%', border: `1.5px solid ${DARK}08`, backgroundColor: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                {awayTeam?.logo
                  ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 56 : 44, height: isStory ? 56 : 44, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: isStory ? 20 : 17, fontWeight: 900, color: `${DARK}50` }}>{initials(awayName)}</span>
                }
              </div>
              <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 900, color: `${DARK}60`, letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.25 }}>
                {truncate(awayName, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Rule */}
        <div style={{ height: 1, backgroundColor: `${DARK}15`, margin: '16px 0 14px' }} />

        {/* Meta */}
        <div data-block="meta" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
          {[
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.45 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, val: `${dt.short} · ${dt.time}` },
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.45 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, val: event?.venue || event?.city || '—' },
          ].map(({ svg, val }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {svg}
              <span style={{ fontSize: 10.5, fontWeight: 600, color: `${DARK}70`, letterSpacing: '0.02em' }}>{val}</span>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: a, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
