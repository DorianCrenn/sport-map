import { motion } from 'framer-motion';
import { useClubDashboard } from '../../hooks/useClubDashboard.js';

function StatCard({ label, value, sub, color = 'var(--sl-t1)' }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 14, padding: '14px 12px',
      backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t2)' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            backgroundColor: d.count > 0 ? '#3b82f6' : 'var(--sl-border)',
            borderRadius: '3px 3px 0 0',
            height: d.count > 0 ? `${Math.round((d.count / max) * 48) + 4}px` : '2px',
            transition: 'height 0.4s',
          }} />
          <div style={{ fontSize: 7, color: 'var(--sl-t3)', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ClubDashboard({ club, clubEventIds, allEvents, onClose }) {
  const data = useClubDashboard(club.id, clubEventIds);
  const isEmpty = !data.loading && data.followers === 0 && data.pageViews.total === 0 && data.attendees.total === 0;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        backgroundColor: 'var(--sl-bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#0F1E3A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
        <button
          onClick={onClose}
          aria-label="Retour à la page du club"
          style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Tableau de bord</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{club.name}</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, WebkitOverflowScrolling: 'touch' }}>
        {data.loading ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--sl-t3)', fontSize: 13 }}>
            Chargement des statistiques…
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'flex', gap: 8 }}>
              <StatCard
                label="Abonnés"
                value={data.followers}
                sub="personnes suivent ce club"
                color="#3b82f6"
              />
              <StatCard
                label="Vues totales"
                value={data.pageViews.total}
                sub={`+${data.pageViews.weekly} cette semaine`}
                color="#f97316"
              />
              <StatCard
                label="J'y serai"
                value={data.attendees.total}
                sub="participations cumulées"
                color="#22d96a"
              />
            </div>

            {/* Page views chart */}
            <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>
                  Vues de la page — 8 semaines
                </div>
                {data.pageViews.distinctViewers > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                    {data.pageViews.distinctViewers} visiteur{data.pageViews.distinctViewers > 1 ? 's' : ''} identifié{data.pageViews.distinctViewers > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <BarChart data={data.pageViews.byWeek} />
            </div>

            {/* Top events by attendees */}
            {data.attendees.topEvents.length > 0 && (
              <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>
                  Top matchs — J'y serai
                </div>
                {data.attendees.topEvents.map((row, idx) => {
                  const ev = (allEvents ?? []).find(e => String(e.id) === String(row.event_id));
                  return (
                    <div key={row.event_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < data.attendees.topEvents.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev?.title ?? row.event_id}
                        </div>
                        {ev?.date && (
                          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                            {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#22d96a', fontVariantNumeric: 'tabular-nums' }}>{row.count}</div>
                        <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>J'y serai</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isEmpty && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--sl-t3)', fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                Aucune donnée pour l'instant.<br />
                Les statistiques s'alimenteront dès que des utilisateurs visiteront la page, suivront le club ou cliqueront sur "J'y serai".
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
