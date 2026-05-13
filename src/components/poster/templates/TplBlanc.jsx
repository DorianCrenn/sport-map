import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const DARK = '#18100A';

function TeamCircleLight({ name, logo, accent, blockId, bStyle = {} }) {
  return (
    <div data-block={blockId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...bStyle }}>
      <div style={{
        width: 74, height: 74, borderRadius: '50%',
        border: `1.5px solid ${DARK}22`, backgroundColor: 'rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: 54, height: 54, objectFit: 'contain' }} crossOrigin="anonymous" />
          : <span style={{ fontSize: 20, fontWeight: 900, color: DARK }}>{initials(name)}</span>
        }
      </div>
      <span style={{ fontSize: scaledFs(name, 9.5, 12, 7.5), fontWeight: 700, color: DARK, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 88, wordBreak: 'break-word', lineHeight: 1.25 }}>
        {truncate(name, 20)}
      </span>
    </div>
  );
}

export default function TplBlanc({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#B38B59', bgImage, format = 'story', transforms = {} }) {
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
      boxSizing: 'border-box',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #F6F2EB 0%, #EDE8DE 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(246,242,235,0.91)' }} />
      </>}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '40%', background: `radial-gradient(ellipse at top right, ${a}0A 0%, transparent 65%)` }} />

      <div style={{ position: 'relative', zIndex: 10, backgroundColor: DARK, padding: '13px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: `${a}30`, border: `1px solid ${a}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill={a} stroke="none"/></svg>
          </div>
          <span style={{ fontSize: 9, fontWeight: 800, color: a, letterSpacing: '0.22em' }}>SPORTLINK</span>
        </div>
        <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)' }}>FINISTÈRE</span>
      </div>

      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 24px 18px' }}>

        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 8, color: `${DARK}55`, letterSpacing: '0.2em', fontWeight: 500 }}>
            {dt.weekday && dt.weekday !== '—' ? `${dt.weekday}, ${dt.day} ${dt.month}` : dt.short} · {dt.time}
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 1.5, backgroundColor: DARK, marginBottom: 3 }} />
          <div style={{ height: '0.5px', backgroundColor: `${DARK}28` }} />
        </div>

        <div data-block="title" style={{ marginBottom: 12, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 76 : 62, fontWeight: 900, color: DARK, letterSpacing: '-0.04em', lineHeight: 0.88 }}>Match</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ fontSize: isStory ? 76 : 62, fontWeight: 900, color: DARK, letterSpacing: '-0.04em', lineHeight: 0.88 }}>Day</div>
            <div style={{ flex: 1, height: '0.5px', backgroundColor: `${DARK}22`, marginBottom: 10 }} />
          </div>
          <div data-block="champ" style={{ fontSize: 10.5, fontWeight: 600, color: a, letterSpacing: '0.08em', marginTop: 8, ...tr('champ') }}>
            {truncate(champ, 26)}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ height: '0.5px', backgroundColor: `${DARK}22`, marginBottom: 2 }} />
          <div style={{ height: 1.5, backgroundColor: DARK }} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TeamCircleLight name={homeName} logo={homeTeam?.logo} accent={a} blockId="home-team" bStyle={tr('home-team')} />
            <div style={{ textAlign: 'center', padding: '0 14px', paddingBottom: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 200, color: a, letterSpacing: '0.08em' }}>VS</span>
            </div>
            <TeamCircleLight name={awayName} logo={awayTeam?.logo} accent={a} blockId="away-team" bStyle={tr('away-team')} />
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: `${DARK}18`, marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
          {[
            { svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.55 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, value: `${dt.short}  ·  ${dt.time}` },
            { svg: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.55 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, value: (event?.venue || event?.city || '—').slice(0, 32) },
          ].map(({ svg, value }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {svg}
              <span style={{ fontSize: 10, fontWeight: 600, color: `${DARK}80`, letterSpacing: '0.04em' }}>{value}</span>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.28em', color: a, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
