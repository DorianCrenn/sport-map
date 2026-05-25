import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplAurora({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#10B981', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  const secondAccent = `${a}88`;

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      backgroundColor: '#060810', boxSizing: 'border-box',
    }}>
      {/* Aurora gradient layers */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 140% 50% at 20% 10%, ${a}3A 0%, transparent 60%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 100% 60% at 80% 90%, ${a}25 0%, transparent 55%)` }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 40% at 50% 50%, ${a}0F 0%, transparent 65%)` }} />

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 140% 50% at 20% 10%, ${a}55 0%, transparent 60%), rgba(6,8,16,0.88)` }} />
      </>}

      {/* Subtle grid lines for depth */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '22px 22px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 26 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: a, boxShadow: `0 0 8px ${a}` }} />
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>SPORTLINK</span>
          </div>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', color: `${a}CC`, textTransform: 'uppercase' }}>{truncate(champ, 20)}</span>
        </div>

        {/* Big teams section */}
        <div data-block="teams" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('teams') }}>

          {/* Home team — large */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: isStory ? 16 : 10 }}>
            <div style={{
              width: isStory ? 72 : 56, height: isStory ? 72 : 56, borderRadius: '50%',
              background: `radial-gradient(circle, ${a}33 0%, ${a}0A 100%)`,
              border: `2px solid ${a}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 28px ${a}33, inset 0 0 16px ${a}1A`,
            }}>
              {homeTeam?.logo
                ? <img src={homeTeam.logo} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 900, color: a }}>{initials(homeName)}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: a, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Domicile</div>
              <div style={{ fontSize: scaledFs(homeName, 22, 14, 14), fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.0, textShadow: `0 0 20px ${a}55` }}>
                {truncate(homeName, 16)}
              </div>
            </div>
          </div>

          {/* VS separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: `${isStory ? 8 : 4}px 0` }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${a}44, transparent)` }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' }}>VS</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1))` }} />
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: isStory ? 16 : 10 }}>
            <div style={{
              width: isStory ? 72 : 56, height: isStory ? 72 : 56, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {awayTeam?.logo
                ? <img src={awayTeam.logo} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} crossOrigin="anonymous" />
                : <span style={{ fontSize: isStory ? 22 : 18, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{initials(awayName)}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Extérieur</div>
              <div style={{ fontSize: scaledFs(awayName, 22, 14, 14), fontWeight: 900, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.03em', lineHeight: 1.0 }}>
                {truncate(awayName, 16)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div data-block="meta" style={{ marginTop: isStory ? 22 : 16, ...tr('meta') }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { icon: '📅', val: `${dt.day} ${dt.month}`, sub: dt.time },
              { icon: '📍', val: truncate(event?.venue || event?.city || '—', 16), sub: event?.venue && event?.city ? event.city : null },
            ].map(({ icon, val, sub }, i) => (
              <div key={i} style={{
                flex: 1,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${i === 0 ? `${a}30` : 'rgba(255,255,255,0.07)'}`,
                padding: '10px 12px',
              }}>
                <div style={{ fontSize: 10, marginBottom: 3 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: i === 0 ? a : 'rgba(255,255,255,0.8)', lineHeight: 1.2 }}>{val}</div>
                {sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, textAlign: 'center', ...tr('tagline') }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.26em', color: `${a}55`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
