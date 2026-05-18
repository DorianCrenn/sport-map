import { useMemo } from 'react';

export default function NextMatchBlock({ data, allEvents, club }) {
  const next = useMemo(() => {
    const now = new Date();
    return (allEvents ?? [])
      .filter(e => String(e.clubId) === String(club?.id) && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] ?? null;
  }, [allEvents, club?.id]);

  if (!next) {
    return (
      <div style={{ borderRadius: 16, padding: '24px 20px', textAlign: 'center', backgroundColor: 'var(--sl-surface)', border: '1px dashed var(--sl-border-s)' }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
        <div style={{ fontSize: 13, color: 'var(--sl-t3)', fontWeight: 500 }}>Aucun prochain match programmé</div>
      </div>
    );
  }

  const dateObj = new Date(next.date);
  const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
  const dayNum  = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const typeLabelMap = { championship: 'Championnat', cup: 'Coupe', friendly: 'Amical' };
  const typeColorMap = { championship: '#3b82f6', cup: '#f97316', friendly: '#22c55e' };
  const typeLabel = typeLabelMap[next.eventType] ?? next.eventType ?? '';
  const typeColor = typeColorMap[next.eventType] ?? '#64748b';

  const label = data?.label ?? 'Prochain match';

  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--sl-surface) 0%, var(--sl-card) 100%)',
      border: '1px solid var(--sl-border-s)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
    }}>
      {/* Top label */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>
          {label}
        </span>
        {typeLabel && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: `${typeColor}20`, color: typeColor }}>
            {typeLabel}
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: '20px 20px 18px' }}>
        {/* Teams or title */}
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 14, textAlign: 'center' }}>
          {next.title}
        </div>

        {/* Team info */}
        {next.teamName && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border)' }}>
              {next.teamName}{next.category ? ` · ${next.category}` : ''}
            </span>
          </div>
        )}

        {/* Date / time / venue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-blue)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', textTransform: 'capitalize' }}>{dayName} {dayNum}</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{timeStr}</div>
            </div>
          </div>

          {next.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{next.venue || next.city}</div>
                {next.venue && next.city && <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{next.city}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
