import { getSportMeta, Grain, Vignette, LightOrb, fmtDate, truncate, blockStyle, venueFs, scaledTitle } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// System Override — cyber HUD. Perspective grid. Convergence lines. Electric cyan.
export default function TplTrEsport({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const a = accentColor || (sport.primary !== '#6D28D9' ? sport.glow : '#00FFD4');
  const a2 = '#9B4AFF';
  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#020210', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,2,16,0.94)' }} />
      </>}

      {/* Perspective grid — top half, lines converge to horizon */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: isStory ? '55%' : '50%', pointerEvents: 'none' }} viewBox="0 0 360 350" preserveAspectRatio="none">
        {/* Horizontal lines — perspective spaced */}
        {[0.1, 0.22, 0.36, 0.52, 0.72, 1.0].map((t, i) => {
          const y = t * 350;
          const spread = t * 180;
          return <line key={i} x1={180 - spread} y1={y} x2={180 + spread} y2={y} stroke={`${a}${i < 3 ? '18' : '10'}`} strokeWidth="0.8" />;
        })}
        {/* Vertical convergence lines */}
        {[-5, -3, -1, 0, 1, 3, 5].map((offset, i) => (
          <line key={i} x1={180 + offset * 0} y1="0" x2={180 + offset * 36} y2="350" stroke={`${a}${Math.abs(offset) < 2 ? '20' : '10'}`} strokeWidth="0.7" />
        ))}
        {/* Horizon glow line */}
        <line x1="0" y1="0" x2="360" y2="0" stroke={a} strokeWidth="0.5" opacity="0.6" />
      </svg>

      {/* Cyan horizon glow */}
      <LightOrb top="-5%" left="50%" width={320} height={120} color={`${a}20`} blur={40} />
      <LightOrb top="0%" left="50%" width={180} height={80} color={`${a}35`} blur={24} />

      {/* Purple secondary glow — lower right */}
      <LightOrb bottom="-5%" right="-8%" width={200} height={200} color={`${a2}28`} blur={55} />

      {/* Scanlines overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)`, pointerEvents: 'none', opacity: 0.6 }} />

      {/* Angular HUD bracket corners — content area */}
      {[
        { top: isStory ? '14%' : '12%', left: '5%', rot: '0deg' },
        { top: isStory ? '14%' : '12%', right: '5%', rot: '90deg' },
        { bottom: isStory ? '10%' : '8%', left: '5%', rot: '270deg' },
        { bottom: isStory ? '10%' : '8%', right: '5%', rot: '180deg' },
      ].map((pos, i) => (
        <div key={i} style={{ position: 'absolute', ...pos, width: 20, height: 20 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M1 10 L1 1 L10 1" stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" transform={`rotate(${pos.rot} 10 10)`} />
          </svg>
        </div>
      ))}

      {/* Left vertical power bar */}
      <div style={{ position: 'absolute', left: 0, top: isStory ? '14%' : '12%', bottom: isStory ? '10%' : '8%', width: 3, background: `linear-gradient(180deg, transparent, ${a}80, ${a2}60, transparent)` }} />

      <Vignette strength={0.82} cy="50%" rx="65%" ry="68%" />
      <Grain opacity={0.05} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '18px 22px 22px 28px' : '14px 18px 16px 24px' }}>

        {/* Top HUD header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 6 : 4 }}>
          <span style={{ fontSize: 7, fontWeight: 700, color: `${a}60`, letterSpacing: '0.28em', fontFamily: 'monospace' }}>
            {event?.sport ? `SYS://${event.sport.toUpperCase()}.TOURNAMENT` : 'SYS://TOURNAMENT.EXE'}
          </span>
          <span style={{ fontSize: 7, color: `${a}45`, fontFamily: 'monospace' }}>{event?.date ? new Date(event.date).getFullYear() : 'MMXXV'}</span>
        </div>

        {/* TOURNOI + organizer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isStory ? 10 : 6 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.4em', color: a, textTransform: 'uppercase' }}>◈ TOURNOI</span>
          {organizer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.6 }}>
              {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, borderRadius: 5, objectFit: 'contain', border: `1px solid ${a}30` }} />}
              <span style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>{organizer.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Title — massive, pushed lower */}
        <div data-block="title" style={{ marginBottom: isStory ? 20 : 14, ...tr('title') }}>
          <div style={{
            fontSize: transforms?.title?.fontSize ?? scaledTitle(tName, isStory ? 62 : 46, isStory ? 24 : 18),
            fontFamily: transforms?.title?.fontFamily,
            fontWeight: 900,
            color: '#fff',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
            textShadow: `0 0 30px ${a}55, 0 0 60px ${a}22`,
          }}>
            {tName}
          </div>
        </div>

        {/* HUD stat boxes */}
        <div data-block="champ" style={{ display: 'flex', gap: 8, marginBottom: isStory ? 14 : 10, flexWrap: 'wrap', ...tr('champ') }}>
          {event?.numTeams && (
            <div style={{ padding: '7px 12px', border: `1px solid ${a}35`, borderRadius: 6, background: `${a}0C` }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: `${a}70`, letterSpacing: '0.22em', marginBottom: 2 }}>{sport.unit}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 12px ${a}80` }}>{event.numTeams}</div>
            </div>
          )}
          {event?.tournamentType && (
            <div style={{ padding: '7px 12px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6 }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.22em', marginBottom: 2 }}>TIER</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{event.tournamentType}</div>
            </div>
          )}
          {event?.tournamentFormat && (
            <div style={{ padding: '7px 12px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6 }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.22em', marginBottom: 2 }}>FORMAT</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{truncate(event.tournamentFormat, 10)}</div>
            </div>
          )}
        </div>

        {/* Prize */}
        {event?.prize && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 6, marginBottom: isStory ? 14 : 10, width: 'fit-content' }}>
            <span style={{ fontSize: 11 }}>🏆</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C' }}>{event.prize}</span>
          </div>
        )}

        {/* Bottom HUD */}
        <div style={{ borderTop: `1px solid ${a}18`, paddingTop: isStory ? 12 : 9 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: `${a}55`, letterSpacing: '0.25em', marginBottom: 3 }}>DATE / LIEU</div>
              <div style={{ fontSize: isStory ? 14 : 11, fontWeight: 900, color: a, textShadow: `0 0 12px ${a}70` }}>
                {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
              </div>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 9 : 8), color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{event?.venue || event?.city || '—'}</div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.3em', color: `${a}28`, textTransform: 'uppercase', fontFamily: 'monospace' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
