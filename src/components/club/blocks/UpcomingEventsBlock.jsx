import { useSports } from '../../../hooks/useSports.js';
import SportIcon from '../../SportIcon.jsx';

export default function UpcomingEventsBlock({ data, allEvents, club, isEditing, onUpdate }) {
  const { allSports: SPORTS } = useSports();
  const now = new Date();
  const events = (allEvents ?? [])
    .filter(e =>
      new Date(e.date) >= now &&
      (!data.sport || e.sport === data.sport) &&
      (!club || e.clubId === club.id)
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, data.maxItems ?? 5);

  return (
    <div>
      {isEditing && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12,
          padding: 12, borderRadius: 12,
          backgroundColor: 'var(--sl-surface)',
          border: '1.5px dashed var(--sl-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Sport</label>
            <select
              value={data.sport || ''}
              onChange={e => onUpdate({ sport: e.target.value || null })}
              style={{
                fontSize: 11, border: '1px solid var(--sl-border)', borderRadius: 8,
                padding: '3px 8px', backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)',
                outline: 'none',
              }}
            >
              <option value="">Tous</option>
              {Object.values(SPORTS).map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600 }}>Nombre</label>
            <select
              value={data.maxItems ?? 5}
              onChange={e => onUpdate({ maxItems: Number(e.target.value) })}
              style={{
                fontSize: 11, border: '1px solid var(--sl-border)', borderRadius: 8,
                padding: '3px 8px', backgroundColor: 'var(--sl-card)', color: 'var(--sl-t1)',
                outline: 'none',
              }}
            >
              {[3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--sl-t3)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
          Aucun événement à venir{data.sport ? ` en ${data.sport}` : ''}.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.map(event => {
            const sp = SPORTS[event.sport];
            const d = new Date(event.date);
            return (
              <div
                key={event.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 12,
                  backgroundColor: 'var(--sl-surface)',
                  border: '1px solid var(--sl-border)',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  backgroundColor: `${sp?.color ?? '#64748b'}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SportIcon sport={event.sport} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>
                    {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#fff',
                  padding: '3px 8px', borderRadius: 999, flexShrink: 0,
                  backgroundColor: sp?.color ?? '#64748b',
                }}>
                  {event.city}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
