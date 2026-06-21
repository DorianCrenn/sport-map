import { blockStyle } from '../posterUtils.js';

const H = { story: 640, post: 450 };

// ── Utilitaire : liste de noms en colonne centrée ─────────────────────────────
function PlayerList({ players = [], accentColor }) {
  const maxShow = 14;
  const list    = players.slice(0, maxShow);
  if (!list.length) {
    return (
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 11, letterSpacing: '0.1em' }}>
        AUCUN JOUEUR CONVOQUÉ
      </div>
    );
  }

  const fontSize = list.length > 11 ? 10.5 : list.length > 8 ? 12 : 13.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: list.length > 10 ? 3.5 : 5, width: '100%' }}>
      {list.map((name, i) => (
        <div
          key={i}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingBottom: list.length > 10 ? 3 : 4,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span style={{
            fontSize: 8.5, fontWeight: 800, color: accentColor,
            fontVariantNumeric: 'tabular-nums', width: 16, textAlign: 'right', flexShrink: 0,
          }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span style={{
            fontSize, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function TplConvocation({
  event,
  homeTeam,
  championship,
  accentColor = '#6366f1',
  bgImage,
  format = 'story',
  transforms = {} as any,
  convocationPlayers = [],
}) {
  const h        = H[format] || H.story;
  const isStory  = format === 'story';
  const tr       = (id) => blockStyle(transforms, id);

  const dateStr  = event?.date
    ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';
  const timeStr  = event?.date?.length > 10
    ? new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const homeName  = homeTeam?.name  || event?.team_name  || 'Mon Équipe';
  const awayName  = event?.adversaire || 'Adversaire';
  const champ     = championship || event?.eventType || 'Match officiel';
  const venue     = event?.city || event?.venue || '';

  return (
    <div style={{
      width: 360, height: h,
      position: 'relative', overflow: 'hidden',
      fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box',
      backgroundColor: '#0a0f1c',
    }}>
      {/* Fond image floutée */}
      {bgImage && <>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(4px)', transform: 'scale(1.06)',
        }} />
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(10,15,28,0.88)' }} />
      </>}

      {/* Accent dégradé diagonal en arrière-plan */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 220, height: 220, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}28, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Contenu */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        height: '100%', padding: isStory ? '22px 24px 20px' : '18px 22px 16px',
      }}>

        {/* Header : SPORTLINK + badge CONVOCATION */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isStory ? 18 : 14 }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
            SPORTLINK
          </span>
          <span style={{
            fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: accentColor, backgroundColor: `${accentColor}1a`,
            padding: '3px 8px', borderRadius: 20, border: `1px solid ${accentColor}40`,
          }}>
            CONVOCATION
          </span>
        </div>

        {/* Match info block */}
        <div
          data-block="title"
          style={{
            marginBottom: isStory ? 12 : 10, borderLeft: `3px solid ${accentColor}`,
            paddingLeft: 12, ...tr('title'),
          }}
        >
          <p style={{ margin: 0, fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: 3 }}>
            {champ}
          </p>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {homeName}
          </p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em' }}>
            <span style={{ color: accentColor, fontWeight: 800 }}>vs</span> {awayName}
          </p>
        </div>

        {/* Meta : date + heure + lieu */}
        <div
          data-block="meta"
          style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: isStory ? 16 : 12, ...tr('meta'),
          }}
        >
          {dateStr && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: accentColor,
              backgroundColor: `${accentColor}15`,
              padding: '3px 8px', borderRadius: 20,
              textTransform: 'capitalize', letterSpacing: '0.05em',
            }}>
              📅 {dateStr}
            </span>
          )}
          {timeStr && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
              backgroundColor: 'rgba(255,255,255,0.07)',
              padding: '3px 8px', borderRadius: 20,
            }}>
              ⏰ {timeStr}
            </span>
          )}
          {venue && (
            <span style={{
              fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              padding: '3px 8px', borderRadius: 20,
            }}>
              📍 {venue}
            </span>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, backgroundColor: `${accentColor}25`, marginBottom: isStory ? 14 : 10 }} />

        {/* Titre liste joueurs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isStory ? 10 : 8 }}>
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', color: accentColor, textTransform: 'uppercase' }}>
            Joueurs convoqués
          </span>
          {convocationPlayers.length > 0 && (
            <span style={{
              fontSize: 8, fontWeight: 800, color: accentColor,
              backgroundColor: `${accentColor}18`, padding: '2px 6px', borderRadius: 12,
            }}>
              {Math.min(convocationPlayers.length, 14)}
            </span>
          )}
        </div>

        {/* Liste joueurs — prend tout l'espace disponible */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PlayerList
            players={convocationPlayers}
            accentColor={accentColor}
          />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 10, paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 7.5, fontWeight: 600, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em' }}>
            Préparez-vous · Soyez prêts
          </span>
        </div>
      </div>
    </div>
  );
}
