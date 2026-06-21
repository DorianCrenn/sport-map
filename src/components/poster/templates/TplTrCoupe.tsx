import { getSportMeta, InfoRow, Grain, Vignette, LightOrb, fmtDate, blockStyle, venueFs, scaledTitle } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// Trophy Reveal — Handball / Official. Large shield hero. Gold spotlight from above. UEFA feel.
export default function TplTrCoupe({ event = {} as any, homeTeam, championship, tagline, accentColor, bgImage, format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);
  const sport = getSportMeta(event?.sport || '');
  const gold = accentColor || '#C9A84C';
  const gold2 = accentColor || '#F2DC90';
  const navy = '#060D1C';
  const tName = event?.tournamentName || championship || 'COUPE NATIONALE';
  const organizer = event?.organizer || homeTeam?.name;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', background: navy, boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,13,28,0.93)' }} />
      </>}

      {/* ── Gold top spotlight ── */}
      <LightOrb top="-12%" left="50%" width={360} height={300} color={`rgba(201,168,76,0.28)`} blur={65} />
      <LightOrb top="-5%" left="50%" width={180} height={180} color={`rgba(255,235,160,0.35)`} blur={40} />
      <LightOrb top="2%" left="50%" width={80} height={80} color={`rgba(255,245,200,0.5)`} blur={20} />

      {/* Diagonal official lines */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.025 }}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ position: 'absolute', top: -300, left: `${-20 + i * 28}px`, width: 1, height: h + 600, background: gold, transform: 'rotate(18deg)' }} />
        ))}
      </div>

      {/* ── LARGE SHIELD SVG — hero element ── */}
      <div style={{
        position: 'absolute',
        top: isStory ? '-2%' : '-4%',
        left: '50%', transform: 'translateX(-50%)',
        filter: `drop-shadow(0 6px 40px ${gold}55) drop-shadow(0 0 80px ${gold}22)`,
        pointerEvents: 'none',
      }}>
        <svg width={isStory ? 220 : 170} height={isStory ? 253 : 196} viewBox="0 0 220 253" fill="none">
          {/* Outer shield */}
          <path d="M110 6L10 42V114C10 177 58 227 110 247C162 227 210 177 210 114V42L110 6Z" fill={`${gold}10`} stroke={`${gold}40`} strokeWidth="1.5" />
          {/* Inner shield */}
          <path d="M110 20L28 50V114C28 168 70 212 110 228C150 212 192 168 192 114V50L110 20Z" fill={`${gold}07`} stroke={`${gold}25`} strokeWidth="1" />
          {/* Shield highlight top */}
          <path d="M110 20L28 50V80C40 70 70 50 110 45C150 50 180 70 192 80V50L110 20Z" fill={`${gold}12`} />
          {/* Center emblem — star */}
          <polygon points="110,70 118,94 144,94 124,110 132,134 110,118 88,134 96,110 76,94 102,94" fill={gold} opacity="0.55" />
          {/* Bottom wreath lines */}
          <path d="M70 190 Q110 200 150 190" stroke={`${gold}40`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M80 200 Q110 208 140 200" stroke={`${gold}30`} strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Side curves */}
          <path d="M30 90 Q14 100 16 120 Q18 138 30 145" stroke={`${gold}30`} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M190 90 Q206 100 204 120 Q202 138 190 145" stroke={`${gold}30`} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Ambient at center */}
      <LightOrb top={isStory ? '20%' : '18%'} left="50%" width={200} height={200} color={`${gold}10`} blur={50} />

      {/* Bottom dark fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? '40%' : '36%', background: `linear-gradient(0deg, ${navy} 20%, transparent 100%)`, pointerEvents: 'none' }} />

      <Vignette strength={0.75} cy="60%" rx="62%" ry="65%" />
      <Grain opacity={0.04} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: isStory ? '24px 26px 28px' : '18px 22px 22px' }}>

        {/* Small organizer badge — top, faint */}
        <div style={{ position: 'absolute', top: isStory ? 22 : 16, left: 26, display: 'flex', alignItems: 'center', gap: 7 }}>
          {homeTeam?.logo && <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'contain', opacity: 0.5 }} />}
          {organizer && <span style={{ fontSize: 7, fontWeight: 800, color: `${gold}55`, letterSpacing: '0.32em', textTransform: 'uppercase' }}>{organizer}</span>}
        </div>

        {/* Sport label */}
        {event?.sport && (
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: sport.accent, letterSpacing: '0.38em', textTransform: 'uppercase', opacity: 0.7 }}>{event.sport}</span>
          </div>
        )}

        {/* COUPE label */}
        <div style={{ marginBottom: isStory ? 10 : 7 }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.5em', color: `${gold}60`, textTransform: 'uppercase' }}>✦ COUPE OFFICIELLE ✦</span>
        </div>

        {/* Tournament name */}
        <div data-block="title" style={{ marginBottom: isStory ? 16 : 12, ...tr('title') }}>
          <div style={{
            fontSize: transforms?.title?.fontSize ?? scaledTitle(tName, isStory ? 54 : 40, isStory ? 22 : 16),
            fontFamily: transforms?.title?.fontFamily,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '-0.035em',
            background: `linear-gradient(160deg, ${gold2} 0%, ${gold} 55%, rgba(160,120,48,0.85) 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `drop-shadow(0 0 20px ${gold}35)`,
          }}>
            {tName}
          </div>
        </div>

        {/* Gold rule */}
        <div style={{ height: 1, background: `linear-gradient(90deg, ${gold}70, ${gold}18, transparent)`, marginBottom: isStory ? 14 : 10 }} />

        {/* Type + categories */}
        {(event?.tournamentType || event?.tournamentCategories) && (
          <div data-block="champ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isStory ? 12 : 9, ...tr('champ') }}>
            {event.tournamentType && <span style={{ fontSize: 8.5, fontWeight: 700, color: `${gold}80`, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{event.tournamentType}</span>}
            {event?.tournamentCategories && event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 3).map((c, i) => (
              <span key={i} style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>· {c}</span>
            ))}
          </div>
        )}

        {/* InfoRow */}
        <div data-block="info" style={{ ...tr('info') }}>
          <InfoRow numTeams={event?.numTeams} tournamentFormat={event?.tournamentFormat} prize={event?.prize} unit={sport.unit} color={gold} dimColor={`${gold}AA`} isStory={isStory} />
        </div>

        {/* Date/venue */}
        <div data-block="meta" style={{ marginTop: isStory ? 14 : 10, ...tr('meta') }}>
          <div style={{ fontSize: isStory ? 13 : 10, fontWeight: 800, color: `${gold}90`, letterSpacing: '0.04em' }}>
            {dt.weekday} {dt.day} {dt.month}{dt.time !== '—' ? ` · ${dt.time}` : ''}
          </div>
          <div style={{ fontSize: venueFs(event?.venue || '', isStory ? 9.5 : 8.5), color: 'rgba(255,255,255,0.28)', fontWeight: 600, marginTop: 3 }}>
            {event?.venue || event?.city || '—'}
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 7.5, letterSpacing: '0.4em', color: `${gold}30`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
