import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrGlass({ event, homeTeam, championship, tagline, accentColor = '#6366F1', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.glow : accentColor;
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: 'linear-gradient(145deg, #0D0D1A 0%, #12102A 50%, #0A0A18 100%)' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,26,0.92)' }} />
      </>}

      {/* Orb glows */}
      <div style={{ position: 'absolute', top: isStory ? '-8%' : '-10%', left: '20%', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${a}28 0%, transparent 64%)`, filter: 'blur(28px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: isStory ? '5%' : '3%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, #EC489930 0%, transparent 65%)`, filter: 'blur(36px)', pointerEvents: 'none', opacity: 0.55 }} />

      {/* Sport ball watermark */}
      <div style={{ position: 'absolute', bottom: isStory ? '22%' : '18%', right: 10, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || ''} size={isStory ? 160 : 120} color={a} opacity={0.07} />
      </div>

      {/* Dot grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `radial-gradient(circle, ${a} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      {/* Glass card */}
      <div style={{ position: 'absolute', top: isStory ? '9%' : '7%', left: '5%', right: '5%', bottom: isStory ? '7%' : '5%', borderRadius: 24, background: 'rgba(255,255,255,0.038)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 20px 60px rgba(0,0,0,0.45)` }} />
      {/* Glass highlight top edge */}
      <div style={{ position: 'absolute', top: isStory ? 'calc(9% + 1px)' : 'calc(7% + 1px)', left: '6%', right: '6%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '50px 30px 38px' : '34px 26px 26px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 20 : 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <div style={{ width: 27, height: 27, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 21, height: 21, objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: `${a}CC`, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
              {event?.tournamentType && <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em', marginTop: 1 }}>{event.tournamentType.toUpperCase()}</div>}
            </div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: `${a}1E`, border: `1px solid ${a}32` }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: `${a}CC`, letterSpacing: '0.12em' }}>TOURNOI</span>
          </div>
        </div>

        {/* Sport label */}
        {event?.sport && (
          <div style={{ marginBottom: isStory ? 14 : 8 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: sport.accent, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.85 }}>{event.sport}</span>
          </div>
        )}

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 40 : 30, fontWeight: 900, color: '#fff', lineHeight: 0.98, letterSpacing: '-0.03em', marginBottom: 20, textShadow: `0 0 38px ${a}38` }}>
            {truncate(tName, 28)}
          </div>

          {/* Categories */}
          {event?.tournamentCategories && (
            <div data-block="champ" style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16, ...tr('champ') }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <div key={i} style={{ padding: '5px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.048)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.52)' }}>{c}</span>
                </div>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 14 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 900, color: a, letterSpacing: '-0.01em', textShadow: `0 0 18px ${a}55` }}>
                {dt.weekday} {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 3 }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 150 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 600, color: 'rgba(255,255,255,0.42)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.17)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
