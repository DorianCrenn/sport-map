import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrEsport({ event, homeTeam, championship, tagline, accentColor = '#7C3AED', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.glow : accentColor;
  const tName = event?.tournamentName || championship || 'TOURNAMENT';
  const organizer = event?.organizer || homeTeam?.name;
  const hexCount = isStory ? 20 : 14;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#080A14', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,10,20,0.93)' }} />
      </>}

      {/* Hex grid upper right */}
      <div style={{ position: 'absolute', top: 0, right: -10, width: '60%', height: '55%', opacity: 0.07, overflow: 'hidden' }}>
        {Array.from({ length: hexCount }).map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const x = col * 46 + (row % 2 === 0 ? 0 : 23);
          const y = row * 40;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 36, height: 36, border: `1px solid ${a}`, transform: 'rotate(30deg)', borderRadius: 4 }} />;
        })}
      </div>

      {/* Sport ball — center background */}
      <div style={{ position: 'absolute', top: '25%', right: 20, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || ''} size={isStory ? 120 : 90} color={a} opacity={0.06} />
      </div>

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${a}15 0%, transparent 55%, ${a}08 100%)`, pointerEvents: 'none' }} />

      {/* Bottom glow */}
      <div style={{ position: 'absolute', bottom: '-5%', left: '25%', transform: 'translateX(-50%)', width: 300, height: 180, borderRadius: '50%', background: `radial-gradient(ellipse, ${a}28 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* Left power bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, transparent, ${a}, transparent)` }} />

      {/* HUD lines */}
      <div style={{ position: 'absolute', top: isStory ? 58 : 42, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, ${a}60, transparent)` }} />
      <div style={{ position: 'absolute', bottom: isStory ? 70 : 54, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${a}38, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '18px 20px 16px 24px' : '14px 18px 12px 24px' }}>

        {/* HUD header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 20 : 12 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: `${a}65`, letterSpacing: '0.28em', fontFamily: 'monospace' }}>
            {event?.sport ? `SYS://${event.sport.toUpperCase()}.EXE` : 'SYS://TOURNAMENT.EXE'}
          </div>
          <div style={{ fontSize: 7, color: `${a}48`, fontFamily: 'monospace' }}>
            {event?.date ? new Date(event.date).getFullYear() : 'MMXXV'}
          </div>
        </div>

        {/* TOURNOI label */}
        <div style={{ marginBottom: isStory ? 8 : 5 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.42em', color: a, textTransform: 'uppercase' }}>◈ TOURNOI</span>
        </div>

        {/* Organizer */}
        {organizer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: isStory ? 16 : 10 }}>
            {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'contain', border: `1px solid ${a}38` }} />}
            <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>{organizer.toUpperCase()}</span>
          </div>
        )}

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 44 : 32, fontWeight: 900, color: '#fff', lineHeight: 0.93, letterSpacing: '-0.03em', textTransform: 'uppercase', textShadow: `0 0 50px ${a}45`, marginBottom: 18 }}>
            {truncate(tName, 22)}
          </div>

          {/* HUD stat boxes */}
          <div data-block="champ" style={{ display: 'flex', gap: 10, marginBottom: 14, ...tr('champ') }}>
            {event?.numTeams && (
              <div style={{ padding: '8px 13px', border: `1px solid ${a}38`, borderRadius: 8, background: `${a}0E` }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: `${a}75`, letterSpacing: '0.2em', marginBottom: 2 }}>SLOTS</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: a, lineHeight: 1, textShadow: `0 0 10px ${a}80` }}>{event.numTeams}</div>
              </div>
            )}
            {event?.tournamentType && (
              <div style={{ padding: '8px 13px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 2 }}>TIER</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{event.tournamentType}</div>
              </div>
            )}
            {event?.tournamentFormat && (
              <div style={{ padding: '8px 13px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: 2 }}>FORMAT</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{truncate(event.tournamentFormat, 10)}</div>
              </div>
            )}
          </div>

          {/* Category tags */}
          {event?.tournamentCategories && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8, fontWeight: 700, color: `${a}CC`, border: `1px solid ${a}28`, padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{c.toUpperCase()}</span>
              ))}
            </div>
          )}

          {/* Prize */}
          {event?.prize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: 6, width: 'fit-content' }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C' }}>{event.prize}</span>
            </div>
          )}
        </div>

        {/* Bottom HUD */}
        <div style={{ paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div data-block="meta" style={{ ...tr('meta') }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: `${a}55`, letterSpacing: '0.25em', marginBottom: 3 }}>DATE / LIEU</div>
            <div style={{ fontSize: isStory ? 14 : 11, fontWeight: 900, color: a }}>{dt.day} {dt.month} {dt.time !== '—' ? `· ${dt.time}` : ''}</div>
            <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{event?.venue || event?.city || '—'}</div>
          </div>
        </div>
        {tagline && (
          <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
            <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.3em', color: `${a}30`, textTransform: 'uppercase', fontFamily: 'monospace' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
