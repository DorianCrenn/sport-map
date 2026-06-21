import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplVivid({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#7C3AED', bgImage, format = 'story', transforms = {} as any }) {
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
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Base */}
      <div style={{ position: 'absolute', inset: 0, background: '#05080F' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,15,0.87)' }} />
      </>}
      {/* Color orbs — no blur, just radial gradients */}
      <div style={{ position: 'absolute', top: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${a}38 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', bottom: -40, right: -50, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', top: '45%', right: 0, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${a}18 0%, transparent 60%)` }} />
      {/* Top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${a}, #3b82f6, ${a}00)` }} />
      <div style={{ position: 'absolute', top: 3, left: 0, right: 0, height: 1, background: `linear-gradient(to right, ${a}40, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '22px 24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div data-block="champ" style={{ ...tr('champ') }}>
            <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>{truncate(champ, 20)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: a }} />
            <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.22em' }}>MATCH DAY</span>
          </div>
        </div>

        <div data-block="title" style={{ marginBottom: isStory ? 18 : 12, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 92 : 76, fontWeight: 900, color: 'white', letterSpacing: '-0.05em', lineHeight: 0.85, textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 92 : 76, fontWeight: 900, color: a, letterSpacing: '-0.05em', lineHeight: 0.85, textTransform: 'uppercase' }}>DAY</div>
        </div>

        <div style={{ height: 1.5, background: `linear-gradient(to right, ${a}70, rgba(59,130,246,0.4), transparent)`, marginBottom: isStory ? 22 : 14 }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('home-team') }}>
              <div style={{
                width: isStory ? 88 : 70, height: isStory ? 88 : 70,
                borderRadius: isStory ? 22 : 18,
                border: `2px solid ${a}65`,
                background: `linear-gradient(135deg, ${a}16 0%, transparent 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 28px ${a}28, 0 8px 22px rgba(0,0,0,0.55)`,
              }}>
                {homeTeam?.logo ? <img src={homeTeam.logo} alt="" style={{ width: isStory ? 64 : 50, height: isStory ? 64 : 50, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 24 : 19, fontWeight: 900, color: a }}>{initials(homeName)}</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: scaledFs(homeName, 11, 12, 8.5), fontWeight: 900, color: 'white', letterSpacing: '-0.01em', textTransform: 'uppercase', lineHeight: 1.2 }}>{truncate(homeName, 16)}</span>
                <div style={{ width: 22, height: 2, backgroundColor: a, margin: '5px auto 0', borderRadius: 1 }} />
              </div>
            </div>

            <div style={{ flexShrink: 0, padding: '0 8px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em' }}>VS</span>
              </div>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...tr('away-team') }}>
              <div style={{
                width: isStory ? 88 : 70, height: isStory ? 88 : 70,
                borderRadius: isStory ? 22 : 18,
                border: '2px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 22px rgba(0,0,0,0.5)',
              }}>
                {awayTeam?.logo ? <img src={awayTeam.logo} alt="" style={{ width: isStory ? 64 : 50, height: isStory ? 64 : 50, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: isStory ? 24 : 19, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{initials(awayName)}</span>}
              </div>
              <span style={{ fontSize: scaledFs(awayName, 11, 12, 8.5), fontWeight: 900, color: 'rgba(255,255,255,0.62)', letterSpacing: '-0.01em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 100, wordBreak: 'break-word', lineHeight: 1.2 }}>{truncate(awayName, 16)}</span>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: tagline ? 10 : 12, ...tr('meta') }}>
          {[{ val: dt.short }, { val: dt.time }, { val: event?.venue || event?.city || '—' }].map(({ val }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{val}</span>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginBottom: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', color: a, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em' }}>SPORTLINK</span>
          <span style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.14em' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
