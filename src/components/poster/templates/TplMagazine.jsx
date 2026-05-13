import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#0B0908';
const CREAM = '#EDE0CC';

export default function TplMagazine({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#C41E3A', bgImage, format = 'story' }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', backgroundColor: BG,
    }}>
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `${BG}EA` }} />
      </>}
      {/* Accent stripe on right edge */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', backgroundColor: a }} />
      {/* Subtle left vignette */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', background: `linear-gradient(to right, ${a}06, transparent)` }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '26px 32px 22px 26px' }}>

        {/* Issue header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.5em', color: a, textTransform: 'uppercase', marginBottom: 3 }}>SPORTLINK</div>
            <div style={{ fontSize: 7, fontWeight: 500, letterSpacing: '0.2em', color: `${CREAM}35`, textTransform: 'uppercase' }}>FINISTÈRE · ÉDITION SPÉCIALE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.22em', color: `${CREAM}35` }}>{dt.short}</div>
          </div>
        </div>

        {/* Massive title */}
        <div style={{ marginBottom: 16, lineHeight: 0.85 }}>
          <div style={{ fontSize: isStory ? 96 : 78, fontWeight: 900, color: CREAM, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            MATCH
          </div>
          <div style={{ fontSize: isStory ? 96 : 78, fontWeight: 900, color: a, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>
            DAY
          </div>
        </div>

        {/* Champ subtitle under rule */}
        <div style={{ borderTop: `2px solid ${a}`, paddingTop: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.35em', color: `${CREAM}55`, textTransform: 'uppercase' }}>
            {truncate(champ, 28)}
          </span>
        </div>

        {/* Team rows — flex 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
          {[
            { team: homeTeam, name: homeName, isHome: true },
            { team: awayTeam, name: awayName, isHome: false },
          ].map(({ team, name, isHome }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                border: isHome ? `1.5px solid ${a}80` : '1.5px solid rgba(255,255,255,0.12)',
                backgroundColor: isHome ? `${a}10` : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {team?.logo
                  ? <img src={team.logo} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} crossOrigin="anonymous" />
                  : <span style={{ fontSize: 15, fontWeight: 800, color: isHome ? a : `${CREAM}45` }}>{initials(name)}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: scaledFs(name, 19, 14, 12), fontWeight: 900, color: isHome ? CREAM : `${CREAM}65`, letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {truncate(name, 18)}
                </div>
                <div style={{ fontSize: 7.5, fontWeight: 600, color: `${CREAM}32`, letterSpacing: '0.2em', marginTop: 3, textTransform: 'uppercase' }}>
                  {isHome ? 'DOMICILE' : 'EXTÉRIEUR'}
                </div>
              </div>
              {isHome && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: a, boxShadow: `0 0 12px ${a}80`, flexShrink: 0 }} />}
            </div>
          ))}

          <div style={{ textAlign: 'left', paddingLeft: 66, paddingTop: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 200, color: `${CREAM}35`, letterSpacing: '0.45em' }}>VS</span>
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{ height: 1, backgroundColor: `${CREAM}10`, margin: '14px 0' }} />

        {/* Meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tagline ? 10 : 0 }}>
          {[
            { val: `${dt.day} ${dt.month}`, lbl: 'Date', align: 'left' },
            { val: dt.time, lbl: 'Heure', align: 'center' },
            { val: (event?.venue || event?.city || '—').slice(0, 10), lbl: 'Lieu', align: 'right' },
          ].map(({ val, lbl, align }, i) => (
            <div key={i} style={{ textAlign: align }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? a : `${CREAM}72`, letterSpacing: '0.04em' }}>{val}</div>
              <div style={{ fontSize: 7, fontWeight: 600, color: `${CREAM}30`, letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>

        {tagline && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.3em', color: a, textTransform: 'uppercase' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
