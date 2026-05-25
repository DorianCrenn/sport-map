import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplFlag({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#ef4444', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  const teamsH = isStory ? 340 : 230;

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      backgroundColor: '#0D0D12', boxSizing: 'border-box',
    }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(13,13,18,0.9)' }} />
      </>}

      {/* Left (home) color panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: teamsH,
        background: `linear-gradient(135deg, ${a}55 0%, ${a}18 100%)`,
      }} />
      {/* Right (away) panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '50%', height: teamsH,
        background: 'linear-gradient(225deg, rgba(255,255,255,0.08) 0%, transparent 100%)',
      }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? 52 : 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', zIndex: 20 }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>SPORTLINK</span>
        <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{truncate(champ, 22)}</span>
      </div>

      {/* Central VS bar */}
      <div style={{
        position: 'absolute', top: isStory ? 52 : 42, left: '50%', transform: 'translateX(-50%)',
        width: isStory ? 56 : 46, height: teamsH - (isStory ? 52 : 42),
        zIndex: 30,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ flex: 1, width: 1.5, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent)' }} />
        <div style={{
          backgroundColor: a, borderRadius: '50%',
          width: isStory ? 48 : 40, height: isStory ? 48 : 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, zIndex: 31,
          boxShadow: `0 0 24px ${a}60`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#0D0D12', letterSpacing: '0.05em' }}>VS</span>
        </div>
        <div style={{ flex: 1, width: 1.5, background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }} />
      </div>

      {/* Teams area */}
      <div data-block="teams" style={{ position: 'absolute', top: isStory ? 52 : 42, left: 0, right: 0, height: teamsH - (isStory ? 52 : 42), display: 'flex', zIndex: 10, ...tr('teams') }}>
        {/* Home */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isStory ? 14 : 10, paddingRight: 32 }}>
          <div style={{
            width: isStory ? 80 : 64, height: isStory ? 80 : 64,
            borderRadius: '50%', border: `3px solid ${a}`,
            backgroundColor: `${a}1A`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${a}40`,
          }}>
            {homeTeam?.logo
              ? <img src={homeTeam.logo} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} crossOrigin="anonymous" />
              : <span style={{ fontSize: isStory ? 26 : 20, fontWeight: 900, color: a }}>{initials(homeName)}</span>
            }
          </div>
          <div style={{ textAlign: 'center', paddingLeft: 8, paddingRight: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: a, textTransform: 'uppercase', marginBottom: 3 }}>Domicile</div>
            <div style={{ fontSize: scaledFs(homeName, 13, 10, 9), fontWeight: 900, color: 'white', textTransform: 'uppercase', lineHeight: 1.15, wordBreak: 'break-word' }}>
              {truncate(homeName, 14)}
            </div>
          </div>
        </div>

        {/* Away */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: isStory ? 14 : 10, paddingLeft: 32 }}>
          <div style={{
            width: isStory ? 80 : 64, height: isStory ? 80 : 64,
            borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {awayTeam?.logo
              ? <img src={awayTeam.logo} alt="" style={{ width: '70%', height: '70%', objectFit: 'contain' }} crossOrigin="anonymous" />
              : <span style={{ fontSize: isStory ? 26 : 20, fontWeight: 900, color: 'rgba(255,255,255,0.4)' }}>{initials(awayName)}</span>
            }
          </div>
          <div style={{ textAlign: 'center', paddingRight: 8, paddingLeft: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 3 }}>Extérieur</div>
            <div style={{ fontSize: scaledFs(awayName, 13, 10, 9), fontWeight: 900, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', lineHeight: 1.15, wordBreak: 'break-word' }}>
              {truncate(awayName, 14)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: teamsH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '14px 22px 18px', zIndex: 20 }}>
        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />

        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>{dt.day}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: a, letterSpacing: '0.02em' }}>{dt.month} · {dt.time}</div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: 130 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.2 }}>{truncate(event?.venue || event?.city || '—', 20)}</div>
            {event?.venue && event?.city && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{event.city}</div>}
          </div>
        </div>

        {tagline && (
          <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.24em', color: `${a}60`, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
