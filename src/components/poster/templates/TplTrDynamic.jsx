import { fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx';

const H = { story: 640, post: 450 };

// ── Dynamic Tournament ─────────────────────────────────────────────────────────
// Deep navy base. Diagonal accent block (right ~45%) in accent color.
// Dual-clip text technique: title rendered twice with complementary clip-paths
// so the text color switches cleanly as it crosses the diagonal — white on
// dark left side, dark-navy on light right side. No blend-mode hacks needed.
// Tailwind v4 + inline styles for dynamic values.

export default function TplTrDynamic({
  event, homeTeam, championship, tagline,
  accentColor = '#FF6B00', bgImage, format = 'story', transforms = {},
}) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const mc = accentColor;
  const navy = '#0F1629';

  const title = (event?.tournamentName || championship || 'TOURNOI').toUpperCase();
  const subtitle = event?.tournamentType || tagline || 'TOURNOI OFFICIEL';
  const sport = event?.sport || '';
  const organizer = event?.organizer || homeTeam?.name || '';
  const venue = event?.venue || event?.city || '—';

  // Diagonal split: the accent polygon runs from (splitX + skew, 0) to (360, 0)
  // to (360, h) to (splitX - skew, h). The "title zone" Y position.
  const splitX = isStory ? 165 : 155;  // horizontal center of diagonal
  const skew   = isStory ? 38 : 30;    // px of slant offset top→bottom
  const titleY = isStory ? Math.round(h * 0.36) : Math.round(h * 0.30);
  const titleH = isStory ? Math.round(h * 0.38) : Math.round(h * 0.40);

  // Clip-path strings for the dual-text technique
  const clipDark  = `polygon(0 0, ${splitX + skew}px 0, ${splitX - skew}px ${h}px, 0 ${h}px)`;
  const clipLight = `polygon(${splitX + skew}px 0, 360px 0, 360px ${h}px, ${splitX - skew}px ${h}px)`;

  // Font size: fit widest word across full 320px, clamp
  const titleWords = title.split(' ');
  const longestWord = titleWords.reduce((a, b) => (b.length > a.length ? b : a), '');
  const baseFontSize = Math.max(isStory ? 46 : 34, Math.min(isStory ? 88 : 65,
    Math.floor((isStory ? 330 : 250) / Math.max(longestWord.length, 3))
  ));

  const sharedTitleStyle = {
    position: 'absolute',
    top: titleY,
    left: 0,
    width: 360,
    padding: isStory ? '0 22px' : '0 18px',
    boxSizing: 'border-box',
  };

  const sharedWordStyle = (i) => ({
    display: 'block',
    fontFamily: "'Anton', 'Oswald', sans-serif",
    fontSize: Math.max(isStory ? 46 : 34, Math.min(isStory ? 88 : 65,
      Math.floor((isStory ? 330 : 250) / Math.max(titleWords[i]?.length || 1, 3))
    )),
    lineHeight: 0.88,
    letterSpacing: (titleWords[i]?.length || 1) > 7 ? '-0.025em' : '-0.01em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 360, height: h, background: navy, boxSizing: 'border-box', fontFamily: "'Oswald', sans-serif" }}
    >
      {/* ── User photo ── */}
      {bgImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
          <div className="absolute inset-0" style={{ background: 'rgba(15,22,41,0.90)' }} />
        </>
      )}

      {/* ── Accent diagonal block ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: clipLight,
          background: `linear-gradient(135deg, ${mc}F0 0%, ${mc}CC 100%)`,
        }}
      />

      {/* ── Geometric noise on accent side ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: clipLight,
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 18px,
            rgba(0,0,0,0.06) 18px,
            rgba(0,0,0,0.06) 19px
          )`,
        }}
      />

      {/* ── Dark side subtle texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: clipDark,
          backgroundImage: `radial-gradient(circle at 25% 50%, ${mc}12 0%, transparent 60%)`,
        }}
      />

      {/* ── Speed lines on dark side ── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: 360, height: h, clipPath: clipDark }}
        viewBox={`0 0 360 ${h}`}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const y = Math.round(h * 0.28) + i * (isStory ? 22 : 16);
          const op = i === 0 || i === 11 ? 0.06 : i % 3 === 0 ? 0.14 : 0.08;
          return (
            <line
              key={i}
              x1={-20} y1={y} x2={splitX + skew + 10} y2={y}
              stroke={mc} strokeWidth={i % 3 === 0 ? 1 : 0.5} opacity={op}
            />
          );
        })}
      </svg>

      {/* ── Diagonal edge glow ── */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: 360, height: h }}
        viewBox={`0 0 360 ${h}`}
      >
        <line
          x1={splitX + skew} y1={0}
          x2={splitX - skew} y2={h}
          stroke={mc} strokeWidth={2.5} opacity={0.90}
        />
        <line
          x1={splitX + skew - 4} y1={0}
          x2={splitX - skew - 4} y2={h}
          stroke="rgba(255,255,255,0.35)" strokeWidth={1} opacity={1}
        />
      </svg>

      {/* ── Scanline texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 4px)', opacity: 0.5 }}
      />

      {/* ── DUAL-CLIP TITLE ── */}
      {/* White text — visible only on the dark left side */}
      <div style={{ ...sharedTitleStyle, clipPath: clipDark, overflow: 'hidden' }}>
        {titleWords.map((word, i) => (
          <span key={i} style={{ ...sharedWordStyle(i), color: '#FFFFFF' }}>
            {word}
          </span>
        ))}
      </div>
      {/* Navy text — visible only on the accent right side */}
      <div style={{ ...sharedTitleStyle, clipPath: clipLight, overflow: 'hidden' }}>
        {titleWords.map((word, i) => (
          <span key={i} style={{ ...sharedWordStyle(i), color: navy }}>
            {word}
          </span>
        ))}
      </div>

      {/* ── Content layer (UI elements, sits above dual-clip) ── */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ padding: isStory ? '28px 22px 24px' : '18px 18px 16px' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start" style={{ marginBottom: isStory ? 8 : 6 }}>
          <div className="flex items-center gap-2">
            <div className="h-[2px]" style={{ width: 16, background: mc }} />
            <span
              className="uppercase font-bold tracking-widest"
              style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.30em' }}
            >
              {truncate(organizer || 'SPORTLINK', 20)}
            </span>
          </div>
          {sport && (
            <span
              className="uppercase font-bold"
              style={{
                fontSize: 7, color: navy, fontFamily: "'Inter', sans-serif", letterSpacing: '0.18em',
                background: 'rgba(255,255,255,0.92)',
                padding: '2px 8px', borderRadius: 4,
              }}
            >
              {sport}
            </span>
          )}
        </div>

        {/* Subtitle */}
        <div style={{ marginBottom: 4 }}>
          <span
            className="uppercase tracking-widest"
            style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.35em' }}
          >
            ◈ {truncate(subtitle, 28)}
          </span>
        </div>

        {/* Spacer — title zone */}
        <div style={{ height: titleH + (isStory ? 60 : 42) }} />

        {/* Categories */}
        {event?.tournamentCategories && (
          <div
            data-block="champ"
            className="flex flex-wrap"
            style={{ gap: 5, marginBottom: isStory ? 12 : 8, ...tr('champ') }}
          >
            {event.tournamentCategories.split(',').map(c => c.trim()).filter(Boolean).slice(0, 4).map((cat, i) => (
              <span
                key={i}
                className="uppercase font-bold"
                style={{
                  fontSize: 7, padding: '2px 9px', borderRadius: 4,
                  border: `1px solid rgba(255,255,255,0.25)`, background: 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.70)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.10em',
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* ── Date strip at bottom ── */}
        <div
          data-block="meta"
          style={{
            borderTop: `1px solid rgba(255,255,255,0.15)`,
            paddingTop: isStory ? 12 : 8,
            ...tr('meta'),
          }}
        >
          <div className="flex justify-between items-end">
            <div>
              <div
                className="font-bold uppercase"
                style={{
                  fontSize: isStory ? 17 : 13, color: '#FFFFFF',
                  letterSpacing: '-0.01em', fontFamily: "'Oswald', sans-serif",
                  textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                }}
              >
                {dt.weekday} {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && (
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                  {dt.time}
                </div>
              )}
            </div>
            <div className="text-right" style={{ maxWidth: 140 }}>
              <div
                style={{
                  fontSize: venueFs(venue, isStory ? 10 : 9),
                  color: 'rgba(255,255,255,0.40)', fontFamily: "'Inter', sans-serif",
                  fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word',
                }}
              >
                {venue}
              </div>
            </div>
          </div>
          {tagline && tagline !== subtitle && (
            <div data-block="tagline" style={{ marginTop: 6, ...tr('tagline') }}>
              <span
                className="uppercase"
                style={{ fontSize: 7, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.30em', fontFamily: "'Inter', sans-serif" }}
              >
                {tagline}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Accent top bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px]" style={{ background: `linear-gradient(90deg, ${mc}CC, ${mc}, rgba(255,255,255,0.6) ${Math.round((splitX / 360) * 100)}%, ${mc} 100%)` }} />
      {/* ── Bottom edge ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px]" style={{ background: `linear-gradient(90deg, ${mc}40, ${mc}80 50%, ${mc}40)` }} />
    </div>
  );
}
