import { fmtDate, truncate, blockStyle, venueFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTrGlass({ event, homeTeam, championship, tagline, accentColor = '#6366F1', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || 'TOURNOI';
  const numTeams = event?.numTeams;
  const tType = event?.tournamentType;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const organizer = event?.organizer || homeTeam?.name;
  const prize = event?.prize;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', boxSizing: 'border-box', background: `linear-gradient(145deg, #0D0D1A 0%, #12102A 50%, #0A0A18 100%)` }}>

      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,13,26,0.93)' }} />
      </>}

      {/* Orb glows */}
      <div style={{ position: 'absolute', top: isStory ? '-8%' : '-10%', left: '20%', width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${a}30 0%, transparent 65%)`, filter: 'blur(30px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: isStory ? '5%' : '3%', right: '-5%', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, #EC4899 25, transparent 65%)`, filter: 'blur(40px)', pointerEvents: 'none', opacity: 0.5 }} />

      {/* Subtle dot grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(circle, ${a} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      {/* Glass card */}
      <div style={{
        position: 'absolute',
        top: isStory ? '10%' : '8%',
        left: '5%', right: '5%',
        bottom: isStory ? '8%' : '6%',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 20px 60px rgba(0,0,0,0.5)`,
      }} />

      {/* Glass card inner highlight top */}
      <div style={{ position: 'absolute', top: isStory ? 'calc(10% + 1px)' : 'calc(8% + 1px)', left: '6%', right: '6%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: isStory ? '52px 30px 40px' : '36px 26px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isStory ? 22 : 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {homeTeam?.logo && (
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: 'contain' }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 8, fontWeight: 800, color: `${a}CC`, letterSpacing: '0.22em', textTransform: 'uppercase' }}>{organizer || 'SPORTLINK'}</div>
              {tType && <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em', marginTop: 1 }}>{tType.toUpperCase()}</div>}
            </div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: `${a}22`, border: `1px solid ${a}35` }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: `${a}CC`, letterSpacing: '0.12em' }}>TOURNOI</span>
          </div>
        </div>

        {/* Title */}
        <div data-block="title" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...tr('title') }}>
          <div style={{ fontSize: isStory ? 40 : 30, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 18, textShadow: `0 0 40px ${a}40` }}>
            {truncate(tName, 28)}
          </div>

          {/* Glass pills */}
          <div data-block="champ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, ...tr('champ') }}>
            {numTeams && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: `${a}18`, border: `1px solid ${a}30` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={a} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 800, color: a }}>{numTeams}</span>
                <span style={{ fontSize: 9, color: `${a}80`, fontWeight: 600 }}>éq.</span>
              </div>
            )}
            {cats.slice(0, 3).map((c, i) => (
              <div key={i} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>{c}</span>
              </div>
            ))}
          </div>

          {prize && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', width: 'fit-content' }}>
              <span style={{ fontSize: 12 }}>🏆</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C' }}>{prize}</span>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
          <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', ...tr('meta') }}>
            <div>
              <div style={{ fontSize: isStory ? 17 : 13, fontWeight: 900, color: a, letterSpacing: '-0.01em', textShadow: `0 0 20px ${a}60` }}>
                {dt.weekday} {dt.day} {dt.month}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{dt.time}</div>
            </div>
            <div style={{ textAlign: 'right', maxWidth: 150 }}>
              <div style={{ fontSize: venueFs(event?.venue || '', 10), fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>
          {tagline && (
            <div data-block="tagline" style={{ marginTop: 10, ...tr('tagline') }}>
              <span style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
