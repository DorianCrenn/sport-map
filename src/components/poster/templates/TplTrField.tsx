import { fmtDate, truncate, blockStyle, venueFs } from './tourUtils.jsx'; // truncate used at lines 237,247

const H = { story: 640, post: 450 };

// ── The Field ──────────────────────────────────────────────────────────────────
// Immersive sport-terrain background. Football pitch markings on deep emerald,
// or basketball parquet geometry on navy. Lower dark panel holds the text.
// Tailwind v4 + inline styles for dynamic values.

function FootballField({ h, isStory: _isStory }: { h: any; isStory?: boolean }) {
  const w = 360;
  // fy = 0 for both modes — kept intentionally for future layouts
  const fh = Math.round(h * 0.56);   // field visible height

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: w, height: fh }}
      viewBox={`0 0 360 ${fh}`}
    >
      {/* Base pitch — deep emerald stripes */}
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={0} y={i * Math.round(fh / 7)} width={360} height={Math.round(fh / 7)}
          fill={i % 2 === 0 ? '#0A4A2A' : '#0C5430'}
        />
      ))}
      {/* Outer pitch boundary */}
      <rect x={22} y={10} width={316} height={fh - 20} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {/* Center line */}
      <line x1={22} y1={fh / 2} x2={338} y2={fh / 2} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {/* Center circle */}
      <circle cx={180} cy={fh / 2} r={42} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {/* Center spot */}
      <circle cx={180} cy={fh / 2} r={3} fill="rgba(255,255,255,0.70)" />
      {/* Top penalty area */}
      <rect x={103} y={10} width={154} height={44} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Top goal area */}
      <rect x={141} y={10} width={78} height={18} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Top penalty spot */}
      <circle cx={180} cy={64} r={2.5} fill="rgba(255,255,255,0.60)" />
      {/* Top penalty arc */}
      <path d="M 145 54 A 38 38 0 0 1 215 54" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Bottom penalty area */}
      <rect x={103} y={fh - 54} width={154} height={44} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Bottom goal area */}
      <rect x={141} y={fh - 28} width={78} height={18} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Bottom penalty spot */}
      <circle cx={180} cy={fh - 64} r={2.5} fill="rgba(255,255,255,0.60)" />
      {/* Bottom penalty arc */}
      <path d={`M 145 ${fh - 54} A 38 38 0 0 0 215 ${fh - 54}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Corner arcs */}
      <path d="M 22 22 A 10 10 0 0 1 32 12" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth={1.2} />
      <path d={`M 338 22 A 10 10 0 0 0 328 12`} fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth={1.2} />
      <path d={`M 22 ${fh - 22} A 10 10 0 0 0 32 ${fh - 12}`} fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth={1.2} />
      <path d={`M 338 ${fh - 22} A 10 10 0 0 1 328 ${fh - 12}`} fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth={1.2} />
      {/* Atmospheric top glow */}
      <defs>
        <linearGradient id="fieldFadeTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030F07" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fieldFadeBot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="#030F07" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={360} height={fh * 0.3} fill="url(#fieldFadeTop)" />
      <rect x={0} y={fh * 0.45} width={360} height={fh * 0.55} fill="url(#fieldFadeBot)" />
    </svg>
  );
}

function BasketballField({ h, isStory: _isStory }: { h: any; isStory?: boolean }) {
  const w = 360;
  const fh = Math.round(h * 0.56);
  const pw = 140;    // paint width
  const ph = 68;     // paint height
  const tpR = 100;   // three-point arc radius

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: w, height: fh }}
      viewBox={`0 0 360 ${fh}`}
    >
      {/* Parquet diagonal planks */}
      {Array.from({ length: 22 }, (_, i) => (
        <line
          key={i}
          x1={-20 + i * 18} y1={0} x2={-20 + i * 18 + fh * 0.3} y2={fh}
          stroke={i % 2 === 0 ? '#7B4E1A' : '#8A5A20'} strokeWidth={17} opacity={0.9}
        />
      ))}
      {/* Court boundary */}
      <rect x={16} y={8} width={328} height={fh - 16} fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth={1.5} />
      {/* Center circle */}
      <circle cx={180} cy={fh / 2} r={36} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      <circle cx={180} cy={fh / 2} r={5} fill="rgba(255,255,255,0.60)" />
      {/* Center line */}
      <line x1={16} y1={fh / 2} x2={344} y2={fh / 2} stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Top paint / key */}
      <rect x={180 - pw / 2} y={8} width={pw} height={ph} fill="rgba(220,80,30,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Top free-throw circle */}
      <circle cx={180} cy={8 + ph} r={28} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} strokeDasharray="4 4" />
      {/* Top three-point arc */}
      <path d={`M ${180 - tpR} 8 A ${tpR} ${tpR} 0 0 1 ${180 + tpR} 8`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={180 - tpR} y1={8} x2={180 - tpR} y2={32} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={180 + tpR} y1={8} x2={180 + tpR} y2={32} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {/* Bottom paint */}
      <rect x={180 - pw / 2} y={fh - 8 - ph} width={pw} height={ph} fill="rgba(220,80,30,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.2} />
      {/* Bottom free-throw circle */}
      <circle cx={180} cy={fh - 8 - ph} r={28} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} strokeDasharray="4 4" />
      {/* Bottom three-point arc */}
      <path d={`M ${180 - tpR} ${fh - 8} A ${tpR} ${tpR} 0 0 0 ${180 + tpR} ${fh - 8}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={180 - tpR} y1={fh - 32} x2={180 - tpR} y2={fh - 8} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      <line x1={180 + tpR} y1={fh - 32} x2={180 + tpR} y2={fh - 8} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
      {/* Fade overlays */}
      <defs>
        <linearGradient id="bkFadeTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0A0500" stopOpacity="0.55" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bkFadeBot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" stopOpacity="0" />
          <stop offset="100%" stopColor="#0A0500" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={360} height={fh * 0.3} fill="url(#bkFadeTop)" />
      <rect x={0} y={fh * 0.45} width={360} height={fh * 0.55} fill="url(#bkFadeBot)" />
    </svg>
  );
}

export default function TplTrField({
  event = {} as any, homeTeam, championship, tagline,
  accentColor, bgImage, format = 'story', transforms = {} as any,
}) {
  const h = H[format] || H.story;
  const isStory = format === 'story';
  const dt = fmtDate(event?.date);
  const tr = (id) => blockStyle(transforms, id);

  const sport = (event?.sport || '').toLowerCase();
  const isBasket = sport.includes('basket') || sport.includes('basketball');

  // Sport-adaptive colors
  const mc = accentColor || (isBasket ? '#E85D20' : '#22C55E');
  const bg = isBasket ? '#0A0500' : '#030F07';

  const title = (event?.tournamentName || championship || 'TOURNOI').toUpperCase();
  const subtitle = event?.tournamentType || tagline || 'TOURNOI OFFICIEL';
  const organizer = event?.organizer || homeTeam?.name || '';
  const venue = event?.venue || event?.city || '—';

  // Panel split: field occupies top 54%, dark panel bottom 46%
  const panelY = Math.round(h * (isStory ? 0.50 : 0.48));

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 360, height: h, background: bg, boxSizing: 'border-box', fontFamily: "'Oswald', sans-serif" }}
    >
      {/* ── Sport field ── */}
      {isBasket
        ? <BasketballField h={h} isStory={isStory} />
        : <FootballField h={h} isStory={isStory} />
      }

      {/* ── User photo overlay (dim + tint) ── */}
      {bgImage && (
        <>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImage})` }} />
          <div className="absolute inset-0" style={{ background: 'rgba(3,15,7,0.85)' }} />
        </>
      )}

      {/* ── Dark panel (angled top edge) ── */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          height: h - panelY + 30,
          clipPath: `polygon(0 30px, 100% 0, 100% 100%, 0 100%)`,
          background: `linear-gradient(170deg, ${bg}F2 0%, ${bg}FF 40%)`,
        }}
      />

      {/* ── Accent edge on panel ── */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: panelY - 2,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${mc}, transparent)`,
          opacity: 0.8,
        }}
      />

      {/* ── Sport badge top-right ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: isStory ? 18 : 12, right: isStory ? 18 : 14,
          background: `${mc}20`,
          border: `1px solid ${mc}55`,
          borderRadius: 6,
          padding: isStory ? '4px 10px' : '3px 8px',
        }}
      >
        <span
          className="uppercase font-bold tracking-widest"
          style={{ fontSize: isStory ? 7.5 : 6.5, color: mc, fontFamily: "'Inter', sans-serif", letterSpacing: '0.18em' }}
        >
          {sport || 'SPORT'}
        </span>
      </div>

      {/* ── Scanline texture ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)', opacity: 0.4 }}
      />

      {/* ── Content layer ── */}
      <div
        className="absolute inset-0 z-10 flex flex-col"
        style={{ padding: isStory ? '24px 22px 26px' : '16px 18px 18px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2" style={{ marginBottom: isStory ? 6 : 4 }}>
          <div className="h-[2px]" style={{ width: 18, background: mc }} />
          <span
            className="uppercase tracking-widest font-bold"
            style={{ fontSize: 7, color: `${mc}AA`, fontFamily: "'Inter', sans-serif", letterSpacing: '0.30em' }}
          >
            {truncate(organizer || 'SPORTLINK', 22)}
          </span>
        </div>

        {/* Subtitle */}
        <div style={{ marginBottom: 4 }}>
          <span
            className="uppercase tracking-widest"
            style={{ fontSize: 7, color: 'rgba(255,255,255,0.30)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.35em' }}
          >
            ◈ {truncate(subtitle, 28)}
          </span>
        </div>

        {/* Spacer — field zone */}
        <div className="flex-1" />

        {/* ── Main title in dark panel ── */}
        <div data-block="title" style={{ marginBottom: isStory ? 16 : 10, ...tr('title') }}>
          {title.split(' ').map((word, i) => (
            <div
              key={i}
              className="block uppercase leading-[0.90]"
              style={{
                fontFamily: "'Anton', 'Oswald', sans-serif",
                fontSize: Math.max(isStory ? 34 : 26, Math.min(isStory ? 76 : 56, Math.floor((isStory ? 305 : 235) / Math.max(word.length, 3)))),
                letterSpacing: word.length > 8 ? '-0.02em' : '-0.01em',
                background: i % 2 === 0
                  ? `linear-gradient(110deg, #ffffff 20%, ${mc}DD 100%)`
                  : `linear-gradient(110deg, ${mc}CC 0%, rgba(255,255,255,0.70) 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: `drop-shadow(0 2px 18px ${mc}40)`,
              }}
            >
              {word}
            </div>
          ))}
        </div>

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
                  border: `1px solid ${mc}40`, background: `${mc}12`,
                  color: `${mc}CC`, fontFamily: "'Inter', sans-serif", letterSpacing: '0.10em',
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
          style={{ borderTop: `1px solid ${mc}28`, paddingTop: isStory ? 12 : 8, ...tr('meta') }}
        >
          <div className="flex justify-between items-end">
            <div>
              <div
                className="font-bold uppercase"
                style={{
                  fontSize: isStory ? 16 : 12,
                  color: mc, letterSpacing: '-0.01em',
                  textShadow: `0 0 14px ${mc}60`,
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                {dt.weekday} {dt.day} {dt.month}
              </div>
              {dt.time !== '—' && (
                <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.28)', marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                  {dt.time}
                </div>
              )}
            </div>
            <div className="text-right" style={{ maxWidth: 140 }}>
              <div
                style={{
                  fontSize: venueFs(venue, isStory ? 10 : 8.5),
                  color: 'rgba(255,255,255,0.38)', fontFamily: "'Inter', sans-serif",
                  fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word',
                }}
              >
                {venue}
              </div>
            </div>
          </div>
          {tagline && tagline !== subtitle && (
            <div data-block="tagline" style={{ marginTop: 7, ...tr('tagline') }}>
              <span
                className="uppercase"
                style={{ fontSize: 7, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.30em', fontFamily: "'Inter', sans-serif" }}
              >
                {tagline}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Accent top bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${mc}BB, transparent)` }} />
      {/* ── Left edge ── */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(180deg, transparent, ${mc}70, transparent)` }} />
    </div>
  );
}
