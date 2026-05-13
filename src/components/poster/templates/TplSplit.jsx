import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function LogoBox({ name, logo, isHome, accent, size, blockId, bStyle = {} }) {
  const sz = size || 86;
  const imgSz = Math.round(sz * 0.73);
  return (
    <div data-block={blockId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, ...bStyle }}>
      <div style={{
        width: sz, height: sz, borderRadius: 22,
        border: isHome ? `2px solid ${accent}70` : '2px solid rgba(255,255,255,0.12)',
        backgroundColor: isHome ? `${accent}12` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isHome ? `0 0 32px ${accent}30, 0 8px 20px rgba(0,0,0,0.5)` : '0 8px 20px rgba(0,0,0,0.4)',
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: imgSz, height: imgSz, objectFit: 'contain' }} crossOrigin="anonymous" />
          : <span style={{ fontSize: 22, fontWeight: 900, color: isHome ? accent : 'rgba(255,255,255,0.4)' }}>{initials(name)}</span>
        }
      </div>
      <div style={{ textAlign: 'center', maxWidth: 110 }}>
        <span style={{ display: 'block', fontSize: scaledFs(name, 11, 12, 8), fontWeight: 800, color: isHome ? 'white' : 'rgba(255,255,255,0.65)', letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1.3 }}>
          {truncate(name, 18)}
        </span>
        {isHome && <div style={{ width: 28, height: 2, backgroundColor: accent, margin: '6px auto 0', borderRadius: 1 }} />}
      </div>
    </div>
  );
}

export default function TplSplit({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#3b82f6', bgImage, format = 'story', transforms = {} }) {
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
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #080C14 0%, #060912 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,12,20,0.86)' }} />
      </>}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%', background: `linear-gradient(to right, ${a}0E, transparent)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${a}, ${a}40, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div data-block="champ" style={{ display: 'flex', alignItems: 'center', ...tr('champ') }}>
            <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.32em', color: a, textTransform: 'uppercase' }}>
              {truncate(champ, 22)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: `${a}80` }} />
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)' }}>MATCH DAY</span>
          </div>
        </div>

        <div style={{ height: 1.5, background: `linear-gradient(to right, ${a}, ${a}20)`, marginBottom: isStory ? 26 : 18 }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <LogoBox name={homeName} logo={homeTeam?.logo} isHome={true} accent={a} size={isStory ? 90 : 72} blockId="home-team" bStyle={tr('home-team')} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 6, padding: '0 12px' }}>
            <div style={{ width: '0.5px', height: 44, background: `linear-gradient(to bottom, transparent, ${a}50)` }} />
            <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: `${a}18`, border: `1.5px solid ${a}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 18px ${a}25` }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: a, letterSpacing: '0.1em' }}>VS</span>
            </div>
            <div style={{ width: '0.5px', height: 44, background: `linear-gradient(to top, transparent, ${a}50)` }} />
          </div>
          <LogoBox name={awayName} logo={awayTeam?.logo} isHome={false} accent={a} size={isStory ? 90 : 72} blockId="away-team" bStyle={tr('away-team')} />
        </div>

        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tagline ? 10 : 14, ...tr('meta') }}>
          {[
            { icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.7 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, val: dt.short },
            { icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.7 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, val: dt.time },
            { icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.7 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, val: event?.venue || event?.city || '—' },
          ].map(({ icon, val }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {icon}
              <span style={{ fontSize: i === 2 ? venueFs(val, 10) : 10, fontWeight: 600, color: 'rgba(255,255,255,0.52)', wordBreak: i === 2 ? 'break-word' : undefined, lineHeight: i === 2 ? 1.25 : undefined }}>{val}</span>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginBottom: 12, padding: '7px 12px', borderRadius: 9, backgroundColor: `${a}10`, border: `1px solid ${a}25`, ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', color: a, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: a, letterSpacing: '0.22em' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.14em' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
