import { motion } from 'framer-motion';
import { useNewsFeed } from '../hooks/useNewsFeed.js';
import SportIcon from '../components/SportIcon.jsx';

const TYPE_META = {
  urgent: { color: '#ef4444', label: 'Urgent' },
  result: { color: '#22d96a', label: 'Résultat' },
  event:  { color: '#3b82f6', label: 'Événement' },
  info:   { color: '#64748b', label: 'Info' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 3600) return `Il y a ${Math.round(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.round(diff / 3600)}h`;
  if (diff < 172800) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtDateFuture(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AnnouncementCard({ ann, index }) {
  const meta = TYPE_META[ann.type] ?? TYPE_META.info;
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        background: 'var(--sl-card)', borderRadius: 16,
        border: '1px solid var(--sl-border-s)', overflow: 'hidden',
      }}
    >
      <div style={{ height: 3, backgroundColor: meta.color }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            color: '#fff', backgroundColor: meta.color,
          }}>{meta.label}</span>
          <span style={{ fontSize: 11, color: 'var(--sl-t3)', marginLeft: 'auto' }}>
            {ann.club_name}
          </span>
          <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{fmtDate(ann.created_at)}</span>
        </div>
        {ann.title && (
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)', marginBottom: 4, lineHeight: 1.3 }}>
            {ann.title}
          </div>
        )}
        <p style={{ fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.5, margin: 0 }}>
          {ann.message}
        </p>
      </div>
    </motion.article>
  );
}

function ResultCard({ event, index }) {
  const sc = event.score;
  const scoreStr = sc && typeof sc === 'object' && 'home' in sc
    ? `${sc.home} — ${sc.away}`
    : (typeof sc === 'string' ? sc : '?');
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        background: 'var(--sl-card)', borderRadius: 16,
        border: '1px solid var(--sl-border-s)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        backgroundColor: 'rgba(34,217,106,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SportIcon sport={event.sport} size={22} color="var(--sl-green)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginBottom: 2 }}>
          {fmtDate(event.date)} · {event.sport}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        {event.venue || event.city
          ? <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>📍 {event.venue || event.city}</div>
          : null}
      </div>
      <div style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: 10,
        background: 'rgba(34,217,106,0.12)', border: '1px solid rgba(34,217,106,0.25)',
        fontWeight: 800, fontSize: 15, color: 'var(--sl-green)',
      }}>
        {scoreStr}
      </div>
    </motion.article>
  );
}

function UpcomingCard({ event, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      style={{
        background: 'var(--sl-card)', borderRadius: 16,
        border: '1px solid var(--sl-border-s)', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        backgroundColor: 'rgba(59,130,246,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SportIcon sport={event.sport} size={22} color="#3b82f6" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, marginBottom: 2 }}>
          {fmtDateFuture(event.date)}
        </div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        {event.venue || event.city
          ? <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>📍 {event.venue || event.city}</div>
          : null}
      </div>
      <div style={{
        flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
        background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
      }}>
        {event.home_or_away === 'away' ? 'Ext.' : 'Dom.'}
      </div>
    </motion.article>
  );
}

function EmptyFeed() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--sl-t3)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🏟️</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--sl-t1)', marginBottom: 6 }}>
        Aucune actualité pour l'instant
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 260, margin: '0 auto' }}>
        Suivez des clubs depuis la section Clubs pour voir leurs annonces et résultats ici.
      </p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NewsPage({ followedClubIds = [] }) {
  const { announcements, results, upcoming, loading, hasClubs } = useNewsFeed({ followedClubIds });

  const isEmpty = !loading && announcements.length === 0 && results.length === 0 && upcoming.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sl-bg)' }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, background: 'var(--sl-card)',
        padding: '16px 16px 12px', borderBottom: '1px solid var(--sl-border-s)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: 'var(--sl-t1)', margin: 0, fontFamily: 'Poppins, sans-serif' }}>
            Actualités
          </h1>
          {!loading && hasClubs && (
            <div style={{
              width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--sl-green)',
              boxShadow: '0 0 6px var(--sl-green)',
            }} title="Realtime actif" />
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--sl-t3)', margin: '2px 0 0' }}>
          {hasClubs ? 'Clubs que vous suivez · Realtime' : 'Suivez des clubs pour voir leurs actus'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--sl-t3)', fontSize: 13 }}>
            Chargement…
          </div>
        )}

        {!loading && isEmpty && <EmptyFeed />}

        {!loading && announcements.length > 0 && (
          <Section title="Annonces">
            {announcements.map((ann, i) => (
              <AnnouncementCard key={ann.id} ann={ann} index={i} />
            ))}
          </Section>
        )}

        {!loading && upcoming.length > 0 && (
          <Section title="Prochains matchs">
            {upcoming.map((ev, i) => (
              <UpcomingCard key={ev.id} event={ev} index={i} />
            ))}
          </Section>
        )}

        {!loading && results.length > 0 && (
          <Section title="Résultats récents">
            {results.map((ev, i) => (
              <ResultCard key={ev.id} event={ev} index={i} />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
