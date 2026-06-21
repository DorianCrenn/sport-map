import { fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// ── The Champion ───────────────────────────────────────────────────────────────
// Neon spotlight. Radial burst lines from center. Massive gradient title.
// Athlete / club logo floats in the illuminated focal point.
// Tailwind v4 + inline styles for dynamic colors.
export default function TplTrChampion({
  event = {} as any, homeTeam, championship, tagline,
  accentColor = '#00F5FF', bgImage, format = 'story', transforms = {} as any,
}) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const mc = accentColor;                                   // neon main color
  const title = (event?.tournamentName || championship || 'CHAMPION').toUpperCase();
  const subtitle = event?.tournamentType || tagline || 'TOURNOI OFFICIEL';
  const sport = event?.sport || '';
  const organizer = event?.organizer || homeTeam?.name || '';
  const venue = event?.venue || event?.city || '—';

  const cx = 180;                                           // focal point X (center)
  const cy = Math.round(h * (isStory ? 0.40 : 0.42));      // focal point Y

  const orb1 = isStory ? 180 : 140;
  const orb2 = isStory ? 240 : 185;
  const orb3 = isStory ? 310 : 245;

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 360, height: h, background: '#070710', boxSizing: 'border-box', fontFamily: "'Oswald', sans-serif" }}
    >
      {/* ── User photo ── */}
      {bgImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
          <div className="absolute inset-0" style={{ background: 'rgba(7,7,16,0.93)' }} />
        </>
      )}

      {/* ── Radial burst — speed lines from focal point ── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: 360, height: h }}
        viewBox={`0 0 360 ${h}`}
      >
        {Array.from({ length: 28 }, (_, i) => {
          const angle = (i / 28) * Math.PI * 2;
          const len = 480;
          const op = i % 4 === 0 ? 0.22 : i % 2 === 0 ? 0.11 : 0.05;
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + Math.cos(angle) * len}
              y2={cy + Math.sin(angle) * len}
              stroke={mc} strokeWidth={i % 4 === 0 ? 0.8 : 0.5} opacity={op}
            />
          );
        })}
      </svg>

      {/* ── Concentric glow rings ── */}
      {[orb1, orb2, orb3, orb3 + 70].map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: r * 2, height: r * 2,
            top: cy - r, left: cx - r,
            border: `${i < 2 ? 1 : 0.6}px solid ${mc}${['45', '28', '18', '0E'][i]}`,
          }}
        />
      ))}

      {/* ── Volumetric spotlight — large orb ── */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: orb1 * 2, height: orb1 * 2,
          top: cy - orb1, left: cx - orb1,
          background: `radial-gradient(circle, ${mc}22 0%, ${mc}0A 40%, transparent 70%)`,
          filter: 'blur(22px)',
        }}
      />
      {/* Bright focal point */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: isStory ? 55 : 42, height: isStory ? 55 : 42,
          top: cy - (isStory ? 27 : 21), left: cx - (isStory ? 27 : 21),
          background: `radial-gradient(circle, ${mc}90 0%, ${mc}40 40%, transparent 70%)`,
          filter: 'blur(6px)',
        }}
      />
      {/* Hard center dot */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 6, height: 6, top: cy - 3, left: cx - 3,
          background: mc,
          boxShadow: `0 0 12px 4px ${mc}`,
        }}
      />

      {/* ── Club logo / athlete zone ── */}
      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{
          width: isStory ? 140 : 110, height: isStory ? 140 : 110,
          top: cy - (isStory ? 70 : 55), left: cx - (isStory ? 70 : 55),
        }}
      >
        {homeTeam?.logo ? (
          <img
            src={homeTeam.logo} alt={homeTeam.name || ''} crossOrigin="anonymous"
            className="w-full h-full object-contain"
            style={{ filter: `drop-shadow(0 0 18px ${mc}90)`, opacity: 0.95 }}
          />
        ) : (
          /* Abstract star-athlete SVG when no logo */
          <svg viewBox="0 0 80 80" fill="none" style={{ width: '65%', height: '65%', filter: `drop-shadow(0 0 10px ${mc})` }}>
            <circle cx="40" cy="14" r="7" fill={mc} opacity="0.95" />
            <path d="M40 21 C40 21 30 38 26 54 M40 21 C40 21 50 38 54 54" stroke={mc} strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M34 34 L20 26 M46 34 L60 26" stroke={mc} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M26 54 L18 66 M54 54 L62 66" stroke={mc} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* ── Scanline texture (subtle) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)', opacity: 0.5 }}
      />

      {/* ── Deep vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 82% 78% at 50% 50%, transparent 28%, rgba(0,0,0,0.88) 100%)' }}
      />

      {/* ── Content layer ── */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ padding: isStory ? '30px 22px 26px' : '20px 18px 18px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center" style={{ marginBottom: isStory ? 14 : 10 }}>
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-6" style={{ background: mc }} />
            <span
              className="uppercase tracking-[0.35em] font-bold"
              style={{ fontSize: 7.5, color: `${mc}BB`, letterSpacing: '0.35em', fontFamily: "'Inter', sans-serif" }}
            >
              {truncate(organizer || 'SPORTLINK', 20)}
            </span>
          </div>
          {sport && (
            <span
              className="uppercase tracking-[0.25em]"
              style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', fontFamily: "'Inter', sans-serif" }}
            >
              {sport}
            </span>
          )}
        </div>

        {/* Subtitle pill */}
        <div style={{ marginBottom: isStory ? 10 : 7 }}>
          <span
            className="uppercase tracking-[0.50em]"
            style={{
              fontSize: 7.5, fontFamily: "'Inter', sans-serif",
              color: `${mc}70`, letterSpacing: '0.5em',
            }}
          >
            ◈ {truncate(subtitle, 26)}
          </span>
        </div>

        {/* Spacer — visual breathing room for the spotlight */}
        <div className="flex-1" />

        {/* ── MASSIVE TITLE — gradient text, word by word ── */}
        <div
          data-block="title"
          style={{ marginBottom: isStory ? 20 : 13, ...tr('title') }}
        >
          {title.split(' ').map((word, i, arr) => (
            <div
              key={i}
              className="block uppercase leading-[0.92]"
              style={{
                fontFamily: "'Anton', 'Oswald', sans-serif",
                fontSize: Math.max(isStory ? 36 : 28, Math.min(isStory ? 78 : 58, Math.floor((isStory ? 310 : 240) / Math.max(word.length, 3)))),
                letterSpacing: word.length > 8 ? '-0.02em' : '-0.01em',
                background: i === 0
                  ? `linear-gradient(100deg, #ffffff 0%, ${mc} 80%)`
                  : i === arr.length - 1
                    ? `linear-gradient(100deg, ${mc}CC 0%, rgba(255,255,255,0.55) 100%)`
                    : `linear-gradient(100deg, rgba(255,255,255,0.88) 0%, ${mc}AA 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `drop-shadow(0 0 22px ${mc}45)`,
              }}
            >
              {word}
            </div>
          ))}
        </div>

        {/* Tournament categories */}
        {event?.tournamentCategories && (
          <div
            data-block="champ"
            className="flex flex-wrap"
            style={{ gap: 6, marginBottom: isStory ? 14 : 10, ...tr('champ') }}
          >
            {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((cat, i) => (
              <span
                key={i}
                className="uppercase font-bold tracking-wider"
                style={{
                  fontSize: 7.5, padding: '3px 10px', borderRadius: 5,
                  border: `1px solid ${mc}45`, background: `${mc}0D`,
                  color: `${mc}CC`, fontFamily: "'Inter', sans-serif", letterSpacing: '0.12em',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Bottom meta */}
        <div
          data-block="meta"
          style={{ borderTop: `1px solid ${mc}30`, paddingTop: isStory ? 14 : 10, ...tr('meta') }}
        >
          <div className="flex justify-between items-end">
            <div>
              <div
                className="font-bold uppercase"
                style={{
                  fontSize: isStory ? 17 : 13,
                  color: mc, letterSpacing: '-0.01em',
                  textShadow: `0 0 16px ${mc}65`,
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                {dt.weekday} {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                  {dt.time}
                </div>
              )}
            </div>
            <div className="text-right" style={{ maxWidth: 145 }}>
              <div
                style={{
                  fontSize: venueFs(venue, isStory ? 10 : 9),
                  color: 'rgba(255,255,255,0.42)', fontFamily: "'Inter', sans-serif",
                  fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word',
                }}
              >
                {venue}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span
                className="uppercase"
                style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.32em', fontFamily: "'Inter', sans-serif" }}
              >
                {tagline}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Neon accent edges ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${mc}CC, transparent)` }} />
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg, transparent, ${mc}80, transparent)` }} />
      <div className="absolute right-0 top-[30%] bottom-[30%] w-px" style={{ background: `linear-gradient(180deg, transparent, ${mc}30, transparent)` }} />
    </div>
  );
}
