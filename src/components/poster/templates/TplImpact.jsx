import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function TeamBlock({ name, logo, accent, isHome, blockId, bStyle = {} }) {
  return (
    <div data-block={blockId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...bStyle }}>
      <div style={{
        width: 70, height: 70, borderRadius: 18,
        backgroundColor: isHome ? `${accent}1A` : 'rgba(255,255,255,0.07)',
        border: `2px solid ${isHome ? accent + '55' : 'rgba(255,255,255,0.14)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isHome ? `0 0 22px ${accent}28` : 'none',
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} crossOrigin="anonymous" />
          : <span style={{ fontSize: 20, fontWeight: 900, color: isHome ? accent : 'rgba(255,255,255,0.5)' }}>{initials(name)}</span>
        }
      </div>
      <span style={{ fontSize: scaledFs(name, 9.5, 12, 7.5), fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 96, wordBreak: 'break-word', lineHeight: 1.25 }}>
        {truncate(name, 18)}
      </span>
    </div>
  );
}

export default function TplImpact({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#22D96A', bgImage, format = 'story', transforms = {} }) {
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
      padding: '22px 24px 20px', boxSizing: 'border-box',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, #080E1C 0%, #060B14 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,11,20,0.80)' }} />
      </>}
      <div style={{ position: 'absolute', top: -40, right: -50, width: 240, height: 300, background: `linear-gradient(135deg, ${a}0D 0%, transparent 55%)`, transform: 'rotate(12deg)', transformOrigin: 'top right' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: `linear-gradient(to bottom, ${a}, ${a}00)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: `linear-gradient(to right, ${a}, ${a}00)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        <div data-block="champ" style={{ marginBottom: 12, ...tr('champ') }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', borderLeft: `2.5px solid ${a}`, paddingLeft: 9 }}>
            {truncate(champ, 26)}
          </span>
        </div>

        <div data-block="title" style={{ marginBottom: isStory ? 14 : 10, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 112 : 92, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 0.87, fontStyle: 'italic' }}>
            MATCH
          </div>
          <div style={{ fontSize: isStory ? 112 : 92, fontWeight: 900, color: a, textTransform: 'uppercase', letterSpacing: '-0.04em', lineHeight: 0.87, fontStyle: 'italic', marginTop: -6 }}>
            DAY
          </div>
          {tagline && (
            <div data-block="tagline" style={{ fontSize: 8.5, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 10, ...tr('tagline') }}>
              {tagline}
            </div>
          )}
        </div>

        <div style={{ height: '0.5px', background: `linear-gradient(to right, ${a}60, transparent)`, marginBottom: isStory ? 18 : 14 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TeamBlock name={homeName} logo={homeTeam?.logo} accent={a} isHome={true} blockId="home-team" bStyle={tr('home-team')} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: `${a}1A`, border: `1.5px solid ${a}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8.5, fontWeight: 900, color: a }}>VS</span>
              </div>
            </div>
            <TeamBlock name={awayName} logo={awayTeam?.logo} accent={a} isHome={false} blockId="away-team" bStyle={tr('away-team')} />
          </div>
          <div style={{ height: '0.5px', background: `linear-gradient(to right, transparent, ${a}35, transparent)`, marginTop: 16 }} />
        </div>

        <div data-block="meta" style={{ marginBottom: 12, ...tr('meta') }}>
          {[
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, value: `${dt.short} — ${dt.time}` },
            { svg: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, value: event?.venue || event?.city || '—' },
          ].map(({ svg, value }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, paddingBottom: 7 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: `${a}14`, border: `1px solid ${a}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a, flexShrink: 0 }}>{svg}</div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: a, letterSpacing: '0.22em' }}>SPORTLINK</span>
          <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
