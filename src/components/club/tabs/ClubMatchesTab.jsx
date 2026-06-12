import { useMemo, useState, lazy, Suspense } from 'react';
import { useEventConvocations } from '../../../hooks/useEventConvocations.js';

const EventFormStepConvocation = lazy(() => import('../../event/EventFormStepConvocation.jsx'));

/** Badge compact résumant les réponses à une convocation. */
function ConvocBadge({ eventId }) {
  const { stats, loading } = useEventConvocations(eventId);
  if (loading || stats.total === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      backgroundColor: stats.pending > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
      color: stats.pending > 0 ? '#f59e0b' : '#22c55e',
      border: `1px solid ${stats.pending > 0 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
    }}>
      📋 {stats.responded}/{stats.total}
    </div>
  );
}

function ScoreBadge({ scoreHome, scoreAway, isHome }) {
  if (scoreHome === null || scoreHome === undefined) {
    return <span style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>À venir</span>;
  }
  const h = Number(scoreHome), a = Number(scoreAway);
  const won = isHome !== false ? h > a : a > h;
  const draw = h === a;
  const color = draw ? '#f59e0b' : won ? '#22C55E' : '#ef4444';
  return (
    <span style={{
      fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
      color, fontVariantNumeric: 'tabular-nums',
    }}>
      {scoreHome} – {scoreAway}
    </span>
  );
}

function MatchRow({ event, canConvoque, onConvoque }) {
  const now = new Date();
  const eventDate = new Date(event.date);
  const isPast = eventDate < now;
  const isHome = event.homeOrAway !== 'away';

  return (
    <div style={{
      padding: '11px 14px', borderRadius: 12,
      backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Date */}
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 36 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1 }}>
          {eventDate.getDate()}
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--sl-t3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
        </div>
      </div>

      {/* Teams + convoc badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.homeTeam ?? '—'} <span style={{ color: 'var(--sl-t3)', fontWeight: 500 }}>vs</span> {event.awayTeam ?? '—'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{event.championship || event.eventType || 'Match'}{event.venue ? ` · ${event.venue}` : ''}</span>
          {/* Indicateur convocations (coach, matchs à venir) */}
          {canConvoque && !isPast && <ConvocBadge eventId={event.id} />}
        </div>
      </div>

      {/* Score ou bouton convoquer */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <ScoreBadge scoreHome={event.scoreHome} scoreAway={event.scoreAway} isHome={isHome} />
        {canConvoque && !isPast && (
          <button
            onClick={() => onConvoque?.(event)}
            data-demo="convocations-tab"
            style={{
              fontSize: 9, fontWeight: 700, padding: '5px 10px', minHeight: 28, borderRadius: 7, cursor: 'pointer',
              backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#6366f1', whiteSpace: 'nowrap',
            }}
          >
            Convoquer ›
          </button>
        )}
      </div>
    </div>
  );
}

function StatsRow({ W, D, L, played }) {
  if (!played) return null;
  const items = [
    { label: 'V', value: W, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
    { label: 'N', value: D, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'D', value: L, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
      {items.map(it => (
        <div key={it.label} style={{
          flex: 1, padding: '8px 0', borderRadius: 12,
          backgroundColor: it.bg, border: `1px solid ${it.color}30`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: it.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{it.value}</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: it.color, letterSpacing: '0.08em' }}>{it.label}</span>
        </div>
      ))}
      <div style={{
        flex: 1, padding: '8px 0', borderRadius: 12,
        backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{played}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.08em' }}>JOUÉS</span>
      </div>
    </div>
  );
}

export default function ClubMatchesTab({ effectiveEvents, club, accentColor, canAddEvent, onCreateEvent }) {
  const now = new Date();
  const [convocEvent, setConvocEvent] = useState(null);

  const clubEvents = useMemo(() =>
    effectiveEvents.filter(e => String(e.clubId) === String(club.id)),
    [effectiveEvents, club.id]
  );

  const upcoming = clubEvents
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = clubEvents
    .filter(e => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Stats
  const played = past.filter(m => m.scoreHome !== null && m.scoreHome !== undefined);
  let W = 0, D = 0, L = 0;
  for (const m of played) {
    const h = Number(m.scoreHome), a = Number(m.scoreAway);
    const isHome = m.homeOrAway !== 'away';
    if (h === a) { D++; } else if (isHome ? h > a : a > h) { W++; } else { L++; }
  }

  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>
          Matchs
        </h2>
        {canAddEvent && (
          <button
            onClick={onCreateEvent}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 10, border: 'none',
              backgroundColor: accentColor, color: '#fff',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Événement
          </button>
        )}
      </div>

      {/* Stats */}
      <StatsRow W={W} D={D} L={L} played={played.length} />

      {clubEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 6 }}>
            Aucun match programmé
          </div>
          {canAddEvent && (
            <button
              onClick={onCreateEvent}
              style={{
                marginTop: 12, padding: '10px 20px', borderRadius: 12, border: 'none',
                backgroundColor: accentColor, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              + Créer un événement
            </button>
          )}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 8 }}>
                À venir ({upcoming.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {upcoming.map(e => (
                  <MatchRow key={e.id} event={e} canConvoque={canAddEvent} onConvoque={setConvocEvent} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 8 }}>
                Résultats ({past.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {past.map(e => <MatchRow key={e.id} event={e} canConvoque={false} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Panel convocations (slide depuis la droite) */}
      {convocEvent && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, backgroundColor: 'var(--sl-card)', borderRadius: 'inherit', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => setConvocEvent(null)}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              aria-label="Retour"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)' }}>
              {convocEvent.homeTeam ?? convocEvent.title ?? 'Match'}
            </span>
          </div>
          <Suspense fallback={null}>
            <EventFormStepConvocation
              event={convocEvent}
              onDone={() => setConvocEvent(null)}
              onClose={() => setConvocEvent(null)}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
