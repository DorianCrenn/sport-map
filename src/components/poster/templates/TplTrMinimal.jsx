import { getSportMeta, InfoRow, Grain, fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Clay Court — Roland Garros. Court lines as hero. Editorial split. Luxe tennis.
export default function TplTrMinimal({ event, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const clay = sport.primary !== '#6D28D9' ? sport.primary : '#C0542A';
  const clayLight = sport.accent !== '#A78BFA' ? sport.accent : '#F0A882';
  const ink = '#1A1008';
  const cream = '#F7EFE3';
  const tName = event?.tournamentName || championship || 'TOURNOI';
  const organizer = event?.organizer || homeTeam?.name;
  const splitY = isStory ? 280 : 200;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: cream, boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(247,239,227,0.92)' }} />
      </>}

      {/* ── Top zone — cream + court lines ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: splitY, background: cream }} />

      {/* Court lines — bold structural SVG */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 360, height: splitY + 20, pointerEvents: 'none' }} viewBox={`0 0 360 ${splitY + 20}`}>
        {/* Outer court rectangle */}
        <rect x="22" y="28" width="316" height={splitY - 40} fill="none" stroke={`${clay}28`} strokeWidth="3" />
        {/* Singles lines */}
        <rect x="56" y="28" width="248" height={splitY - 40} fill="none" stroke={`${clay}20`} strokeWidth="2" />
        {/* Service box horizontal */}
        <line x1="22" y1={28 + (splitY - 40) / 2} x2="338" y2={28 + (splitY - 40) / 2} stroke={`${clay}22`} strokeWidth="2" />
        {/* Center service line */}
        <line x1="180" y1={28 + (splitY - 40) / 2} x2="180" y2={splitY - 12} stroke={`${clay}20`} strokeWidth="1.5" />
        {/* Service boxes */}
        <line x1="56" y1="28" x2="56" y2={splitY - 12} stroke={`${clay}18`} strokeWidth="1.5" />
        <line x1="304" y1="28" x2="304" y2={splitY - 12} stroke={`${clay}18`} strokeWidth="1.5" />
        {/* Net line */}
        <line x1="22" y1={28 + (splitY - 40) * 0.42} x2="338" y2={28 + (splitY - 40) * 0.42} stroke={`${clay}35`} strokeWidth="2.5" />
        {/* Net posts */}
        <circle cx="22" cy={28 + (splitY - 40) * 0.42} r="3" fill={clay} opacity="0.4" />
        <circle cx="338" cy={28 + (splitY - 40) * 0.42} r="3" fill={clay} opacity="0.4" />
        {/* Center mark */}
        <line x1="178" y1="26" x2="182" y2="26" stroke={`${clay}40`} strokeWidth="2" />
      </svg>

      {/* Light warm overlay on court area */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: splitY, background: `radial-gradient(ellipse at 50% 30%, rgba(255,200,140,0.15) 0%, transparent 65%)`, pointerEvents: 'none' }} />

      {/* ── Diagonal cut — cream to ink ── */}
      <div style={{
        position: 'absolute',
        top: splitY - 40,
        left: '-5%', right: '-5%',
        height: 80,
        background: ink,
        transform: 'skewY(-3deg)',
        pointerEvents: 'none',
      }} />

      {/* ── Bottom zone — dark ink ── */}
      <div style={{ position: 'absolute', top: splitY + 20, left: 0, right: 0, bottom: 0, background: ink }} />

      {/* Clay accent bar at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: clay }} />

      {/* Warm light on dark section */}
      <div style={{ position: 'absolute', top: splitY, bottom: 0, left: 0, right: 0, background: `radial-gradient(ellipse at 30% 20%, ${clay}18 0%, transparent 65%)`, pointerEvents: 'none' }} />

      <Grain opacity={0.038} blend="multiply" />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isStory ? '16px 26px 26px 26px' : '12px 22px 20px 22px' }}>

        {/* Top — label in court zone */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 900, color: `${clay}AA`, letterSpacing: '0.42em', textTransform: 'uppercase' }}>{event?.sport || 'SPORT'}</div>
            {organizer && <div style={{ fontSize: 8, fontWeight: 700, color: `${ink}60`, letterSpacing: '0.18em', marginTop: 3 }}>{organizer.toUpperCase()}</div>}
          </div>
          {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain', opacity: 0.7 }} />}
        </div>

        {/* Visual spacer — court area */}
        <div style={{ flex: 1 }} />

        {/* Bottom dark zone content */}
        <div style={{ marginTop: isStory ? 20 : 14 }}>

          {/* Tournament name — HUGE on dark bg */}
          <div data-block="title" style={{ marginBottom: isStory ? 16 : 11, ...tr('title') }}>
            <div style={{
              fontSize: isStory ? 62 : 46,
              fontWeight: 900,
              color: cream,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
            }}>
              {truncate(tName, 20)}
            </div>
          </div>

          {/* Clay accent rule */}
          <div style={{ width: 56, height: 3, background: clay, marginBottom: isStory ? 16 : 11, borderRadius: 2 }} />

          {/* Type + categories */}
          {(event?.tournamentType || event?.tournamentCategories) && (
            <div data-block="champ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: isStory ? 14 : 10, ...tr('champ') }}>
              {event.tournamentType && <span style={{ fontSize: 9, fontWeight: 800, color: clay, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{event.tournamentType}</span>}
              {event?.tournamentCategories && event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 600, color: `${cream}60`, letterSpacing: '0.08em' }}>/ {c}</span>
              ))}
            </div>
          )}

          {/* InfoRow */}
          <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={clayLight} dimColor={`${clayLight}AA`} isStory={isStory} />

          {/* Date/venue */}
          <div data-block="meta" style={{ marginTop: isStory ? 14 : 10, ...tr('meta') }}>
            <div style={{ fontSize: isStory ? 14 : 11, fontWeight: 900, color: cream, opacity: 0.9, letterSpacing: '0.02em' }}>
              {dt.weekday.slice(0, 3)}. {dt.day} {dt.month} {dt.time !== '—' ? `· ${dt.time}` : ''}
            </div>
            <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 9.5 : 8.5), color: `${cream}55`, fontWeight: 600, marginTop: 3 }}>
              {event?.venue || event?.city || '—'}
            </div>
            {tagline && (
              <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
                <span style={{ fontSize: 7.5, fontWeight: 400, letterSpacing: '0.28em', color: `${cream}35`, textTransform: 'uppercase', fontStyle: 'italic' }}>{tagline}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
