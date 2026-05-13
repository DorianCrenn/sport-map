import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

function TeamCircle({ name, logo, accent, isHome }) {
  const init = initials(name);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, flex: 1 }}>
      <div style={{
        width: 74, height: 74, borderRadius: '50%',
        border: `1.5px solid ${isHome ? accent + '70' : 'rgba(255,255,255,0.18)'}`,
        backgroundColor: isHome ? accent + '0E' : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isHome
          ? `0 0 0 1px ${accent}20, 0 0 28px ${accent}18, 0 8px 24px rgba(0,0,0,0.45)`
          : '0 8px 24px rgba(0,0,0,0.35)',
      }}>
        {logo
          ? <img src={logo} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} crossOrigin="anonymous" />
          : <span style={{ fontSize: 19, fontWeight: 700, color: isHome ? accent : 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>{init}</span>
        }
      </div>
      <span style={{
        fontSize: scaledFs(name, 9.5, 12, 7), fontWeight: 600, color: 'rgba(255,255,255,0.78)',
        letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase',
        lineHeight: 1.25, maxWidth: 88, wordBreak: 'break-word',
      }}>
        {truncate(name, 20)}
      </span>
    </div>
  );
}

function Rule({ accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(to right, transparent, ${accent}55, transparent)` }} />
      <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', backgroundColor: accent, opacity: 0.65 }} />
      <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(to left, transparent, ${accent}55, transparent)` }} />
    </div>
  );
}

function MetaIcon({ type }) {
  const icons = {
    date: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    clock: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    pin: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  };
  return icons[type] || null;
}

export default function TplEditorial({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#D4AF37', bgImage, format = 'story' }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      padding: '26px 26px 22px', boxSizing: 'border-box',
    }}>
      {/* Backgrounds */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #071426 0%, #0c1d3a 50%, #071426 100%)' }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,20,38,0.84)' }} />
      </>}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '65%', height: '52%', background: `radial-gradient(ellipse at top right, ${a}10 0%, transparent 65%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '55%', height: '38%', background: `radial-gradient(ellipse at bottom left, ${a}07 0%, transparent 60%)` }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Top badge row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.38em', color: a, textTransform: 'uppercase' }}>
            {truncate(champ, 26)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', border: `1px solid ${a}80` }} />
            <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.28em', color: a + '55' }}>PREMIUM</span>
          </div>
        </div>

        {/* Title block */}
        <div style={{ marginBottom: format === 'story' ? 22 : 16 }}>
          <Rule accent={a} />
          <div style={{ textAlign: 'center', lineHeight: 0.9, padding: '10px 0' }}>
            <div style={{
              fontSize: format === 'story' ? 84 : 70,
              fontWeight: 200, color: 'rgba(255,255,255,0.90)',
              letterSpacing: '-0.04em',
            }}>
              Match
            </div>
            <div style={{
              fontSize: format === 'story' ? 92 : 76,
              fontWeight: 300, color: a,
              letterSpacing: '-0.04em', marginTop: -8,
            }}>
              Day
            </div>
          </div>
          <Rule accent={a} />
        </div>

        {/* VS Section */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <TeamCircle name={homeName} logo={homeTeam?.logo} accent={a} isHome={true} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 6px', marginBottom: 14 }}>
              <div style={{ height: '0.5px', width: 18, background: `${a}45` }} />
              <span style={{ fontSize: 18, fontWeight: 200, color: a, letterSpacing: '0.08em' }}>vs</span>
              <div style={{ height: '0.5px', width: 18, background: `${a}45` }} />
            </div>
            <TeamCircle name={awayName} logo={awayTeam?.logo} accent={a} isHome={false} />
          </div>
        </div>

        {/* Meta cards */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {[
              { type: 'date', label: 'Date', value: dt.short },
              { type: 'clock', label: 'Heure', value: dt.time },
              { type: 'pin', label: 'Lieu', value: (event?.venue || event?.city || '—').slice(0, 15) },
            ].map(({ type, label, value }) => (
              <div key={label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '9px 6px', textAlign: 'center',
              }}>
                <div style={{ color: a + '70', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                  <MetaIcon type={type} />
                </div>
                <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.86)', lineHeight: 1.2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        {tagline && (
          <div style={{ textAlign: 'center', marginBottom: 11 }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>
              {tagline}
            </span>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${a}16`, paddingTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: `${a}16`, border: `1px solid ${a}38`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z" fill={a} stroke="none"/></svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: a, letterSpacing: '0.18em' }}>SPORTLINK</span>
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 500, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.18em' }}>FINISTÈRE</span>
        </div>
      </div>
    </div>
  );
}
