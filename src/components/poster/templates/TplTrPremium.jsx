import { getSportMeta, SportBall, InfoRow, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

export default function TplTrPremium({ event, homeTeam, championship, tagline, accentColor = '#C9A84C', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = getSportMeta(event?.sport || '');
  const gold = '#C9A84C';
  const gold2 = '#F0D080';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: '#07080D', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,8,13,0.90)' }} />
      </>}

      {/* Subtle grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: `linear-gradient(${gold}80 1px, transparent 1px), linear-gradient(90deg, ${gold}80 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />

      {/* Gold radial glow top center */}
      <div style={{ position: 'absolute', top: isStory ? '8%' : '5%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${gold}15 0%, transparent 60%)`, pointerEvents: 'none' }} />

      {/* Sport ball — large background */}
      <div style={{ position: 'absolute', bottom: isStory ? 100 : 70, right: -30, pointerEvents: 'none' }}>
        <SportBall sport={event?.sport || 'football'} size={isStory ? 200 : 150} color={gold} opacity={0.05} />
      </div>

      {/* Corner brackets */}
      {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h2], i) => (
        <div key={i} style={{ position: 'absolute', [v]: 16, [h2]: 16, width: 24, height: 24, borderTop: v === 'top' ? `1.5px solid ${gold}55` : 'none', borderBottom: v === 'bottom' ? `1.5px solid ${gold}55` : 'none', borderLeft: h2 === 'left' ? `1.5px solid ${gold}55` : 'none', borderRight: h2 === 'right' ? `1.5px solid ${gold}55` : 'none' }} />
      ))}

      {/* Gold top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isStory ? '34px 28px 26px' : '22px 24px 20px' }}>

        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 16 : 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo
              ? <div style={{ width: 30, height: 30, borderRadius: 8, background: `${gold}15`, border: `1px solid ${gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                </div>
              : null}
            <span style={{ fontSize: 8.5, fontWeight: 800, color: `${gold}BB`, letterSpacing: '0.24em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</span>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 3, border: `1px solid ${gold}40`, background: `${gold}0C` }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: gold, letterSpacing: '0.3em' }}>TOURNOI</span>
          </div>
        </div>

        {/* Sport label */}
        {event?.sport && (
          <div style={{ width: '100%', marginBottom: isStory ? 12 : 8 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: sport.accent, letterSpacing: '0.35em', textTransform: 'uppercase', opacity: 0.9 }}>★ {event.sport.toUpperCase()} ★</span>
          </div>
        )}

        {/* Trophy SVG */}
        <div style={{ marginBottom: isStory ? 10 : 6, filter: `drop-shadow(0 4px 24px ${gold}50)` }}>
          <svg width={isStory ? 62 : 46} height={isStory ? 72 : 53} viewBox="0 0 80 92" fill="none">
            <path d="M22 8H58V38C58 56 40 66 40 66C40 66 22 56 22 38Z" fill={gold} opacity="0.9" />
            <path d="M22 16C14 16 8 24 8 30C8 38 16 43 22 39" stroke={gold} strokeWidth="4.5" fill="none" opacity="0.6" />
            <path d="M58 16C66 16 72 24 72 30C72 38 64 43 58 39" stroke={gold} strokeWidth="4.5" fill="none" opacity="0.6" />
            <rect x="35" y="66" width="10" height="14" fill={gold} opacity="0.8" />
            <rect x="24" y="80" width="32" height="8" rx="4" fill={gold} opacity="0.9" />
            <path d="M32 18C32 18 36 32 34 44" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* GRAND TOURNOI */}
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.55em', color: `${gold}55`, textTransform: 'uppercase', marginBottom: isStory ? 14 : 10 }}>◆ GRAND TOURNOI ◆</div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', width: '100%', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 36 : 26, fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.025em', maxWidth: 290, margin: '0 auto' }}>
            {truncate(tName, 34)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: isStory ? '18px auto' : '12px auto', width: '65%' }}>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, transparent, ${gold}50)` }} />
            <span style={{ fontSize: 11, color: gold }}>◆</span>
            <div style={{ flex: 1, height: '0.5px', background: `linear-gradient(90deg, ${gold}50, transparent)` }} />
          </div>

          {/* Tournament type */}
          {event?.tournamentType && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.22em', borderLeft: `2px solid ${gold}`, paddingLeft: 8 }}>
                {event.tournamentType}
              </span>
            </div>
          )}

          {/* Categories */}
          {event?.tournamentCategories && (
            <div data-block="champ" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 14, ...tr('champ') }}>
              {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((c, i) => (
                <span key={i} style={{ fontSize: 8, fontWeight: 700, color: `${gold}88`, border: `1px solid ${gold}28`, padding: '2px 9px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'center', ...tr('meta') }}>
            <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={gold} dimColor={`${gold}AA`} isStory={isStory} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: `linear-gradient(90deg, transparent, ${gold}40, transparent)`, marginBottom: 14 }} />

        {/* Date/venue */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: isStory ? 15 : 12, fontWeight: 800, color: gold, letterSpacing: '0.04em' }}>
            {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
          </div>
          <div style={{ fontSize: venueFs(event?.venue || event?.city || '', isStory ? 10 : 9), color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 3 }}>
            {event?.venue || event?.city || '—'}
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, letterSpacing: '0.38em', color: `${gold}35`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
