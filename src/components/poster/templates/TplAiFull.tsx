import { fmtDate, champLabel, truncate, blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

export default function TplAiFull({ event, homeTeam, awayTeam, championship, bgImage, accentColor = '#6366f1', format = 'story', transforms = {} as any }) {
  const h = H[format] || H.story;
  const homeName = homeTeam?.name || '';
  const awayName = awayTeam?.name || '';
  const dt = fmtDate(event?.date);
  const champ = championship || champLabel(event?.eventType, event?.level);
  const isStory = format === 'story';
  const tr = (id) => blockStyle(transforms, id);

  return (
    <div style={{
      width: 360, height: h, position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      backgroundColor: '#060610', boxSizing: 'border-box',
    }}>
      {bgImage ? (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, #0f0f1e 0%, #1a1030 50%, #0a0a18 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: 0.35 }}>
            <div style={{ fontSize: 52 }}>✨</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'white', textAlign: 'center', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Générez votre affiche IA</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Onglet Modèles → Affiche IA</div>
          </div>
        </div>
      )}

      {/* Bottom gradient for text legibility */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isStory ? 280 : 200, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.96))' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>SPORTLINK</span>
          {champ && (
            <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
              {truncate(champ, 22)}
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom: teams + meta */}
        <div style={{ padding: isStory ? '0 22px 28px' : '0 18px 20px' }}>
          {champ && (
            <div data-block="champ" style={{ marginBottom: 10, ...tr('champ') }}>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.2em', color: accentColor, textTransform: 'uppercase' }}>
                {truncate(champ, 30)}
              </span>
            </div>
          )}

          <div data-block="home-team" style={{ ...tr('home-team') }}>
            <div style={{ fontSize: isStory ? 30 : 24, fontWeight: 900, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {truncate(homeName || '—', 16)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '7px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: accentColor, opacity: 0.5 }} />
            <span style={{ fontSize: 9.5, fontWeight: 900, color: accentColor, letterSpacing: '0.15em' }}>VS</span>
            <div style={{ flex: 1, height: 1, backgroundColor: accentColor, opacity: 0.5 }} />
          </div>

          <div data-block="away-team" style={{ ...tr('away-team') }}>
            <div style={{ fontSize: isStory ? 30 : 24, fontWeight: 900, color: 'rgba(255,255,255,0.60)', letterSpacing: '-0.03em', textTransform: 'uppercase', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {truncate(awayName || '—', 16)}
            </div>
          </div>

          <div data-block="meta" style={{ marginTop: 14, ...tr('meta') }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>
              {[
                dt.short && dt.short !== '—' ? dt.short : null,
                dt.time ? dt.time : null,
                (event?.venue || event?.city) ? truncate(event.venue || event.city, 18) : null,
              ].filter(Boolean).join(' · ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
