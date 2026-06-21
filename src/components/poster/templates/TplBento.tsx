import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#ECEAE5';
const DARK = '#141210';

export default function TplBento({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#2563EB', bgImage, format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  const card = (extra = {}) => ({
    borderRadius: 16,
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
    overflow: 'hidden',
    ...extra,
  });

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: BG }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(236,234,229,0.94)' }} />
      </>}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 8 }}>

        {/* Top hero card */}
        <div data-block="title" style={{ ...card({ backgroundColor: DARK, padding: '18px 20px 16px' }), flexShrink: 0, ...tr('title') }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div data-block="champ" style={{ ...tr('champ') }}>
              <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>{truncate(champ, 18)}</span>
            </div>
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>SPORTLINK</span>
          </div>
          <div style={{ lineHeight: 0.86 }}>
            <div style={{ fontSize: isStory ? 68 : 56, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', textTransform: 'uppercase' }}>MATCH</div>
            <div style={{ fontSize: isStory ? 68 : 56, fontWeight: 900, color: a, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>DAY</div>
          </div>
          <div style={{ marginTop: 10, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
            {dt.weekday && dt.weekday !== '—' ? `${dt.weekday} ${dt.day} ${dt.month}` : dt.short} · {dt.time}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
          <div data-block="home-team" style={{ ...card({ border: `2px solid ${a}`, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 10px', gap: 8 }), ...tr('home-team') }}>
            <div style={{ width: isStory ? 70 : 58, height: isStory ? 70 : 58, borderRadius: '50%', border: `2px solid ${a}22`, backgroundColor: `${a}08`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {homeTeam?.logo ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 52 : 42, height: isStory ? 52 : 42, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 900, color: a }}>{initials(homeName)}</span>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: scaledFs(homeName, 10, 12, 8), fontWeight: 900, color: DARK, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2 }}>{truncate(homeName, 14)}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: a, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>DOMICILE</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 6 }}>
            <div style={{ width: 1, flex: 1, backgroundColor: `${DARK}12`, maxHeight: 40 }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>VS</span>
            </div>
            <div style={{ width: 1, flex: 1, backgroundColor: `${DARK}12`, maxHeight: 40 }} />
          </div>

          <div data-block="away-team" style={{ ...card({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 10px', gap: 8 }), ...tr('away-team') }}>
            <div style={{ width: isStory ? 70 : 58, height: isStory ? 70 : 58, borderRadius: '50%', border: `1.5px solid ${DARK}12`, backgroundColor: `${DARK}04`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {awayTeam?.logo ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 52 : 42, height: isStory ? 52 : 42, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 20 : 16, fontWeight: 900, color: `${DARK}55` }}>{initials(awayName)}</span>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: scaledFs(awayName, 10, 12, 8), fontWeight: 900, color: `${DARK}70`, letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2 }}>{truncate(awayName, 14)}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: `${DARK}38`, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>VISITEUR</span>
            </div>
          </div>
        </div>

        {/* Meta card */}
        <div data-block="meta" style={{ ...card({ padding: '12px 16px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }), ...tr('meta') }}>
          {[
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, val: `${dt.day} ${dt.month}` },
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, val: dt.time },
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, val: event?.venue || event?.city || '—' },
          ].map(({ svg, val }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {svg}
              <span style={{ fontSize: i === 2 ? venueFs(val, 11) : 11, fontWeight: 700, color: DARK, letterSpacing: '-0.01em', wordBreak: i === 2 ? 'break-word' : undefined, lineHeight: i === 2 ? 1.25 : undefined }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {tagline ? (
          <div data-block="tagline" style={{ ...card({ padding: '9px 14px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }), ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.22em', color: a, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: `${DARK}35`, letterSpacing: '0.14em' }}>FINISTÈRE</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 4px', flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: DARK, letterSpacing: '0.2em' }}>SPORTLINK</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: `${DARK}40`, letterSpacing: '0.14em' }}>FINISTÈRE</span>
          </div>
        )}
      </div>
    </div>
  );
}
