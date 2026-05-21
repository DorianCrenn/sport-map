import { fmtDate, champLabel, truncate, blockStyle, venueFs, initials } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTournamentStripes({ event, homeTeam, championship, tagline, accentColor = '#8b5cf6', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const fmt = event?.tournamentFormat;
  const tType = event?.tournamentType;
  const prize = event?.prize;

  // Stripe count based on format
  const stripes = isStory ? 8 : 6;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', backgroundColor: '#080C14', boxSizing: 'border-box' }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(8,12,20,0.93)' }} />
      </>}

      {/* Diagonal stripes — athletic feel */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.08 }}>
        {Array.from({ length: stripes }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: -200,
            left: `${-20 + i * 60}px`,
            width: 28,
            height: h + 400,
            backgroundColor: a,
            transform: 'rotate(20deg)',
          }} />
        ))}
      </div>

      {/* Top thick accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, ${a}, ${a}AA)` }} />

      {/* Bottom accent bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: `${a}55` }} />

      {/* Full-width accent block in the middle (jersey number style) */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        top: isStory ? '45%' : '42%',
        height: isStory ? 90 : 70,
        backgroundColor: a,
        opacity: 0.12,
      }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '22px 22px 18px' }}>

        {/* Top header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 32 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo ? (
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', border: `1.5px solid ${a}55` }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${a}20`, border: `1.5px solid ${a}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: a }}>{initials(homeTeam?.name || '')}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: 8.5, fontWeight: 800, color: a, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                {homeTeam?.name || 'SPORTLINK'}
              </div>
              {tType && <div style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 1 }}>{tType}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>ÉDITION</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: `${a}AA` }}>
              {event?.date ? new Date(event.date).getFullYear() : '2025'}
            </div>
          </div>
        </div>

        {/* Giant number / title block */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          {numTeams && (
            <div style={{ fontSize: isStory ? 100 : 76, fontWeight: 900, color: a, lineHeight: 0.9, letterSpacing: '-0.06em', opacity: 0.18, position: 'absolute', right: 16, top: isStory ? '35%' : '30%' }}>
              {numTeams}
            </div>
          )}
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', color: `${a}80`, textTransform: 'uppercase', marginBottom: 10 }}>
            ◆ TOURNOI ◆
          </div>
          <div style={{ fontSize: isStory ? 38 : 28, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'uppercase', maxWidth: 260 }}>
            {truncate(tName, 26)}
          </div>

          {/* Info row */}
          <div data-block="champ" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap', ...tr('champ') }}>
            {numTeams && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: a }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: a }}>{numTeams} ÉQUIPES</span>
              </div>
            )}
            {fmt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{fmt}</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {cats.slice(0, 4).map((c, i) => (
                <span key={i} style={{
                  fontSize: 9, fontWeight: 700, color: '#080C14', backgroundColor: a,
                  padding: '3px 10px', borderRadius: 6,
                }}>
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Prize */}
          {prize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: `${a}99` }}>{prize}</span>
            </div>
          )}
        </div>

        {/* Bottom meta bar */}
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.07)`, paddingTop: 12 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 18 : 14, fontWeight: 900, color: a, letterSpacing: '-0.01em' }}>
                {dt.day} {dt.month} · {dt.time}
              </div>
              <div style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: 3, maxWidth: 220, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 8, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.3em', color: `${a}44`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
