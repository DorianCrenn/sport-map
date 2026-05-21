import { fmtDate, champLabel, truncate, blockStyle, initials } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplTournamentGrid({ event, homeTeam, championship, tagline, accentColor = '#8b5cf6', bgImage, format = 'story', transforms = {} }) {
  const h = H[format] || H.story;
  const dt = fmtDate(event?.date);
  const isStory = format === 'story';
  const a = accentColor;
  const tr = (id) => blockStyle(transforms, id);

  const tName = event?.tournamentName || championship || champLabel(event?.eventType, event?.level, event?.tournamentName);
  const numTeams = event?.numTeams ? Number(event.numTeams) : 8;
  const cats = event?.tournamentCategories ? event.tournamentCategories.split(',').map(s => s.trim()) : [];
  const fmt = event?.tournamentFormat;
  const tType = event?.tournamentType;

  // Team slot grid count
  const slotCount = Math.min(numTeams, isStory ? 8 : 6);
  const cols = slotCount <= 4 ? 2 : slotCount <= 6 ? 3 : 4;

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', backgroundColor: '#F5F4F0', boxSizing: 'border-box' }}>

      {/* Header block with accent color */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: isStory ? 200 : 150, backgroundColor: a }} />

      {/* Diagonal cut */}
      <div style={{ position: 'absolute', top: isStory ? 175 : 130, left: 0, right: 0, height: 50, backgroundColor: '#F5F4F0', clipPath: 'polygon(0 40px, 100% 0, 100% 50px, 0 50px)' }} />

      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header content */}
        <div style={{ padding: '22px 22px 0', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.4em', opacity: 0.7, textTransform: 'uppercase', marginBottom: 6 }}>
                TOURNOI {tType ? `· ${tType.toUpperCase()}` : ''}
              </div>
              <div data-block="title" style={{ fontSize: isStory ? 26 : 20, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 220, ...tr('title') }}>
                {truncate(tName, 28)}
              </div>
            </div>
            {homeTeam?.logo ? (
              <img src={homeTeam.logo} alt="" crossOrigin="anonymous"
                style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', backgroundColor: 'rgba(255,255,255,0.15)', padding: 4, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>{initials(homeTeam?.name || '')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, padding: '30px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Date + teams stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#999', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>DATE</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.02em' }}>{dt.day} {dt.month}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{dt.time}</div>
            </div>
            <div style={{ flex: 1, backgroundColor: a, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>ÉQUIPES</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'white', lineHeight: 1 }}>{numTeams}</div>
              {fmt && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 1.3 }}>{fmt}</div>}
            </div>
          </div>

          {/* Team slots grid */}
          <div data-block="champ" style={{ ...tr('champ') }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              PARTICIPANTS ({numTeams} équipes)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
              {Array.from({ length: slotCount }).map((_, i) => (
                <div key={i} style={{
                  height: isStory ? 38 : 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: i === 0 && homeTeam ? a : 'white',
                  border: `1.5px solid ${i === 0 && homeTeam ? a : '#e8e8e4'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}>
                  {i === 0 && homeTeam ? (
                    homeTeam.logo
                      ? <img src={homeTeam.logo} alt="" crossOrigin="anonymous" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                      : <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>{initials(homeTeam.name || '')}</span>
                  ) : (
                    <span style={{ fontSize: 8, fontWeight: 500, color: '#ccc', letterSpacing: '0.1em' }}>ÉQUIPE {i + 1}</span>
                  )}
                </div>
              ))}
              {numTeams > slotCount && (
                <div style={{
                  height: isStory ? 38 : 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${a}15`, border: `1.5px dashed ${a}55`,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: a }}>+{numTeams - slotCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Categories + venue */}
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
            {cats.length > 0 && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6 }}>CATÉGORIES</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {cats.slice(0, 4).map((c, i) => (
                    <span key={i} style={{ fontSize: 9, fontWeight: 700, color: a, backgroundColor: `${a}15`, padding: '3px 8px', borderRadius: 6 }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div data-block="meta" style={{ textAlign: 'right', ...tr('meta') }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#aaa', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>LIEU</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#444', lineHeight: 1.3, maxWidth: 120, wordBreak: 'break-word' }}>
                {event?.venue || event?.city || '—'}
              </div>
            </div>
          </div>

          {tagline && (
            <div data-block="tagline" style={{ ...tr('tagline') }}>
              <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.2em', color: `${a}88`, textTransform: 'uppercase' }}>{tagline}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
