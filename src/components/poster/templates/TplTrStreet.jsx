import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrStreet({ event, homeTeam, championship, tagline, accentColor = '#FF6B00', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const a = sport.primary !== '#6D28D9' ? sport.primary : accentColor;
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#0D0D0D', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,13,0.91)' }} />
      </>}

      {/* Diagonal slash accent */}
      <div style={{ position: 'absolute', top: 0, right: -60, width: '52%', height: '100%', background: `linear-gradient(180deg, ${a}1C 0%, ${a}0A 50%, transparent 100%)`, transform: 'skewX(-8deg)', pointerEvents: 'none' }} />

      {/* Sport ball watermark */}
      <div style={{ position: 'absolute', bottom: isStory ? '18%' : '15%', right: -30, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'football'} size={isStory ? 180 : 140} color={a} opacity={0.07} />
      </div>

      {/* Circle ring bottom-right */}
      <div style={{ position: 'absolute', bottom: isStory ? '-8%' : '-12%', right: '-8%', width: 230, height: 230, borderRadius: '50%', border: `1.5px solid ${a}20`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: isStory ? '-5%' : '-9%', right: '-5%', width: 170, height: 170, borderRadius: '50%', border: `1px solid ${a}12`, pointerEvents: 'none' }} />

      {/* Top stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: `linear-gradient(90deg, ${a}, ${a}70 60%, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '26px 24px 22px' : '20px 22px 18px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isStory ? 26 : 16 }}>
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.35em', color: a, textTransform: 'uppercase', marginBottom: 4 }}>TOURNOI</div>
            {organizer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 18, height: 18, borderRadius: 5, objectFit: 'contain' }} />}
                <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.16em' }}>{organizer.toUpperCase()}</span>
              </div>
            )}
          </div>
          {event?.tournamentType && (
            <div style={{ fontSize: 8.5, fontWeight: 800, color: `${a}BB`, letterSpacing: '0.1em', padding: '2px 9px', border: `1px solid ${a}40`, borderRadius: 4 }}>
              {event.tournamentType.toUpperCase()}
            </div>
          )}
        </div>

        {/* Sport label */}
        {event?.sport && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: `${a}80`, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{event.sport}</span>
          </div>
        )}

        {/* Big title — street style alternating colors */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 58 : 42, fontWeight: 900, color: '#fff', lineHeight: 0.88, letterSpacing: '-0.05em', textTransform: 'uppercase', marginBottom: 18 }}>
            {truncate(tName, 18).split(' ').map((w, i) => (
              <div key={i} style={{ color: i % 2 === 1 ? a : '#fff' }}>{w}</div>
            ))}
          </div>

          {/* Categories */}
          {event?.tournamentCategories && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>/ {c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div data-block="champ" style={{ ...tr('champ') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={a} dimColor={`${a}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 12 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 20 : 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                {dt.day} <span style={{ color: a }}>{dt.month}</span>
              </div>
              {dt.time !== '—' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>{dt.time}</div>}
            </div>
            <div style={{ textAlign: 'right', maxWidth: 155 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 10 : 9), fontWeight: 700, color: 'rgba(255,255,255,0.48)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.28em', color: `${a}38`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
