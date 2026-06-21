import { parseVs, fmtDate, champLabel, initials, truncate, scaledFs, venueFs, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };
const BG = '#12100E';
const CREAM = '#F0E2C4';

export default function TplRetro({ event, homeTeam, awayTeam, championship, tagline, accentColor = '#D4A017', bgImage, format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const { home, away } = parseVs(event?.title || '');
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const a = accentColor;
  const homeName = homeTeam?.name || home || 'FC Club';
  const awayName = awayTeam?.name || away || 'Adversaire';
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  return (
    <div style={{ width: 360, height: h, position: 'relative', overflow: 'hidden', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backgroundColor: BG }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,0.014) 20px,rgba(255,255,255,0.014) 21px)' }} />
      <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 340, height: 240, borderRadius: '50%', background: `radial-gradient(ellipse, ${a}12 0%, transparent 65%)` }} />
      {bgImage && <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `${BG}DC` }} />
      </>}
      {/* Frame */}
      <div style={{ position: 'absolute', top: 11, left: 11, right: 11, bottom: 11, border: `1px solid ${a}28`, pointerEvents: 'none' }} />
      {/* Corner brackets */}
      {[[{top:18,left:18},{borderTop:`2px solid ${a}`,borderLeft:`2px solid ${a}`}],[{top:18,right:18},{borderTop:`2px solid ${a}`,borderRight:`2px solid ${a}`}],[{bottom:18,left:18},{borderBottom:`2px solid ${a}`,borderLeft:`2px solid ${a}`}],[{bottom:18,right:18},{borderBottom:`2px solid ${a}`,borderRight:`2px solid ${a}`}]].map(([pos, border], i) => (
        <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...pos, ...border, pointerEvents: 'none' }} />
      ))}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 28px 22px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>SPORTLINK</span>
          <div style={{ flex: 1, height: '0.5px', backgroundColor: `${a}28`, margin: '0 12px' }} />
          <span style={{ fontSize: 7, fontWeight: 600, letterSpacing: '0.25em', color: `${CREAM}30`, textTransform: 'uppercase' }}>FINISTÈRE</span>
        </div>

        <div data-block="champ" style={{ textAlign: 'center', marginBottom: 14, ...tr('champ') }}>
          <span style={{ display: 'inline-block', padding: '4px 14px', border: `1px solid ${a}38`, fontSize: 7.5, fontWeight: 700, letterSpacing: '0.35em', color: `${CREAM}50`, textTransform: 'uppercase', backgroundColor: `${a}08` }}>
            {truncate(champ, 24)}
          </span>
        </div>

        <div data-block="title" style={{ textAlign: 'center', lineHeight: 0.83, marginBottom: 16, ...tr('title') }}>
          <div style={{ fontSize: isStory ? 88 : 72, fontWeight: 900, color: CREAM, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>MATCH</div>
          <div style={{ fontSize: isStory ? 88 : 72, fontWeight: 900, color: a, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>DAY</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: '0.5px', backgroundColor: `${a}30` }} />
          <span style={{ fontSize: 9, color: a }}>✦</span>
          <div style={{ flex: 1, height: '0.5px', backgroundColor: `${a}30` }} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <div data-block="home-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('home-team') }}>
              <div style={{ width: 70, height: 70, borderRadius: 4, border: `1.5px solid ${a}`, backgroundColor: `${a}0C`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 16px ${a}08, 0 4px 18px rgba(0,0,0,0.55)` }}>
                {homeTeam?.logo ? <img src={homeTeam.logo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: 20, fontWeight: 800, color: a }}>{initials(homeName)}</span>}
              </div>
              <span style={{ fontSize: scaledFs(homeName, 10, 12, 8), fontWeight: 800, color: CREAM, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 96, wordBreak: 'break-word', lineHeight: 1.25 }}>{truncate(homeName, 16)}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: a, letterSpacing: '0.28em', textTransform: 'uppercase' }}>DOMICILE</span>
            </div>

            <div style={{ flexShrink: 0, padding: '0 10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${a}45`, backgroundColor: `${a}0C`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 300, color: `${CREAM}65`, letterSpacing: '0.08em' }}>VS</span>
              </div>
            </div>

            <div data-block="away-team" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, ...tr('away-team') }}>
              <div style={{ width: 70, height: 70, borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(0,0,0,0.45)' }}>
                {awayTeam?.logo ? <img src={awayTeam.logo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} crossOrigin="anonymous" /> : <span style={{ fontSize: 20, fontWeight: 800, color: `${CREAM}40` }}>{initials(awayName)}</span>}
              </div>
              <span style={{ fontSize: scaledFs(awayName, 10, 12, 8), fontWeight: 800, color: `${CREAM}62`, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 96, wordBreak: 'break-word', lineHeight: 1.25 }}>{truncate(awayName, 16)}</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: `${CREAM}30`, letterSpacing: '0.28em', textTransform: 'uppercase' }}>VISITEUR</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
          <div style={{ flex: 1, height: '0.5px', backgroundColor: `${a}30` }} />
          <span style={{ fontSize: 9, color: a }}>✦</span>
          <div style={{ flex: 1, height: '0.5px', backgroundColor: `${a}30` }} />
        </div>

        <div data-block="meta" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: tagline ? 10 : 0, ...tr('meta') }}>
          {[{ label: 'DATE', value: dt.short }, { label: 'HEURE', value: dt.time }, { label: 'LIEU', value: event?.venue || event?.city || '—' }].map(({ label, value }, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 6.5, fontWeight: 700, color: `${a}55`, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: i === 2 ? venueFs(value, 10.5) : 10.5, fontWeight: 700, color: `${CREAM}78`, wordBreak: i === 2 ? 'break-word' : undefined, lineHeight: i === 2 ? 1.25 : undefined }}>{value}</div>
            </div>
          ))}
        </div>

        {tagline && (
          <div data-block="tagline" style={{ textAlign: 'center', marginTop: 10, ...tr('tagline') }}>
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.38em', color: `${a}50`, textTransform: 'uppercase', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{tagline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
