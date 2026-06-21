import { getSportMeta, InfoRow, Grain, LightOrb, fmtDate, blockStyle, venueFs, scaledTitle } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Sunset Slam — Basketball outdoor. Explosive sunset gradient. Energy rings. Festival.
export default function TplTrSummer({ event = {} as any, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const a = accentColor || (sport.primary !== '#6D28D9' ? sport.primary : '#EA580C');
  const aLight = accentColor || (sport.accent !== '#A78BFA' ? sport.accent : '#FB923C');
  const tName = event?.tournamentName || championship || 'SUMMER CUP';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: '#0C0408' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,4,8,0.82)' }} />
      </>}

      {/* ── Sunset gradient — bottom center rising ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '75%' : '70%', background: `linear-gradient(0deg, ${a} 0%, ${aLight}CC 28%, #FF6B9D55 58%, transparent 100%)`, pointerEvents: 'none' }} />

      {/* Horizon glow */}
      <LightOrb bottom={isStory ? '38%' : '34%'} left="50%" width={400} height={160} color={`${a}55`} blur={50} />
      <LightOrb bottom={isStory ? '42%' : '38%'} left="50%" width={260} height={100} color={`rgba(255,180,80,0.45)`} blur={35} />

      {/* ── Energy rings — concentric circles from bottom-center ── */}
      {[220, 300, 380, 460].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          bottom: isStory ? `-${size * 0.35}px` : `-${size * 0.3}px`,
          left: '50%', transform: 'translateX(-50%)',
          width: size, height: size,
          borderRadius: '50%',
          border: `1px solid rgba(255,255,255,${0.14 - i * 0.03})`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Top dark zone */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? '30%' : '25%', background: 'linear-gradient(180deg, #0C0408 0%, transparent 100%)', pointerEvents: 'none' }} />

      {/* Star/dot elements upper area */}
      {[[20, 15], [85, 25], [45, 40], [95, 10], [10, 50], [75, 55]].map(([lp, tp], i) => (
        <div key={i} style={{ position: 'absolute', left: `${lp}%`, top: `${tp * (isStory ? 0.4 : 0.35)}%`, width: i % 2 === 0 ? 2 : 1, height: i % 2 === 0 ? 2 : 1, borderRadius: '50%', background: '#fff', opacity: 0.5, pointerEvents: 'none' }} />
      ))}

      <Grain opacity={0.04} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isStory ? '22px 22px 26px' : '16px 20px 20px' }}>

        {/* Top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'contain', opacity: 0.8 }} />}
            {organizer && <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{organizer}</span>}
          </div>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>
            {event?.date ? new Date(event.date).getFullYear() : '2025'}
          </span>
        </div>

        {/* Visual spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom hero block */}
        <div>
          {/* Sport + label */}
          <div style={{ marginBottom: isStory ? 8 : 5 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.38em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase' }}>
              ☀ {event?.sport ? `${event.sport.toUpperCase()} · ` : ''}TOURNOI ÉTÉ
            </span>
          </div>

          {/* MASSIVE tournament name */}
          <div data-block="title" style={{ marginBottom: isStory ? 18 : 13, ...tr('title') }}>
            <div style={{
              fontSize: transforms?.title?.fontSize ?? scaledTitle(tName, isStory ? 68 : 50, isStory ? 26 : 20),
              fontFamily: transforms?.title?.fontFamily,
              fontWeight: 900,
              color: '#fff',
              lineHeight: 0.88,
              letterSpacing: '-0.045em',
              textShadow: `0 2px 30px rgba(0,0,0,0.4), 0 0 60px ${a}30`,
            }}>
              {tName}
            </div>
          </div>

          {/* Type + categories */}
          {(event?.tournamentType || event?.tournamentCategories) && (
            <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: isStory ? 14 : 10, ...tr('champ') }}>
              {event.tournamentType && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 12px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>{event.tournamentType}</span>}
              {event?.tournamentCategories && event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)', backgroundColor: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: 20 }}>{c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div data-block="info" style={{ ...tr('info') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color="#fff" dimColor="rgba(255,255,255,0.75)" isStory={isStory} />
          </div>

          {/* Date/venue */}
          <div data-block="meta" style={{ marginTop: isStory ? 14 : 10, ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 900, color: '#fff', opacity: 0.9, letterSpacing: '-0.01em' }}>
              {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
            </div>
            <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 3 }}>
              {event?.venue || event?.city || '—'}
            </div>
            {tagline && (
              <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
                <span style={{ fontSize: 8, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{tagline}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
