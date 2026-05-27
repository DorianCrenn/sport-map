import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// ── Meta injection ─────────────────────────────────────────────────────────────

function setMeta(property, content) {
  const isOg = property.startsWith('og:') || property.startsWith('twitter:');
  const attr  = isOg ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function injectEventMeta(event, club) {
  const home  = event.standings?.home?.team ?? event.home_team ?? '';
  const away  = event.standings?.away?.team ?? event.away_team ?? '';
  const teams = home && away ? `${home} vs ${away}` : event.title ?? 'Événement sportif';

  const dateStr = event.date
    ? new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        .format(new Date(event.date))
    : '';

  const title = `${teams} — SportLink`;
  const desc  = [
    event.sport,
    dateStr,
    event.venue ?? event.city,
  ].filter(Boolean).join(' · ');

  const canonical = `${window.location.origin}/event-page.html?id=${event.id}`;
  const image     = event.poster_url ?? club?.logo_url ?? `${window.location.origin}/og-default.png`;

  document.title = title;
  setMeta('og:title',            title);
  setMeta('og:description',      desc);
  setMeta('og:url',              canonical);
  setMeta('og:type',             'article');
  setMeta('og:image',            image);
  setMeta('twitter:title',       title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image',       image);

  // <link rel="canonical">
  let canonicalEl = document.getElementById('canonical-link');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.id  = 'canonical-link';
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = canonical;

  // Schema.org SportsEvent
  const existing = document.getElementById('schema-org-event');
  if (existing) existing.remove();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: teams,
    description: desc,
    startDate: event.date,
    url: canonical,
    ...(event.venue   ? { location: { '@type': 'Place', name: event.venue, address: event.city } } : {}),
    ...(event.sport   ? { sport: event.sport } : {}),
    ...(club?.name    ? { organizer: { '@type': 'SportsOrganization', name: club.name } } : {}),
    ...(image !== `${window.location.origin}/og-default.png` ? { image } : {}),
  };
  const script = document.createElement('script');
  script.id   = 'schema-org-event';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function ScoreBadge({ score }) {
  if (!score) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
      <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{score.home}</span>
      <span style={{ fontSize: 20, fontWeight: 400, color: '#94a3b8' }}>—</span>
      <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{score.away}</span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function EventPublicPage() {
  const [event,   setEvent]   = useState(null);
  const [club,    setClub]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { setError('ID événement manquant'); setLoading(false); return; }

    supabase
      .from('events')
      .select('id, title, sport, date, venue, city, score, standings, home_or_away, club_id, man_of_match, event_type')
      .eq('id', id)
      .single()
      .then(async ({ data: ev, error: e }) => {
        if (e || !ev) { setError('Événement introuvable'); setLoading(false); return; }

        let clubData = null;
        if (ev.club_id) {
          const { data: c } = await supabase
            .from('clubs')
            .select('id, name, logo_url, city')
            .eq('id', ev.club_id)
            .single();
          clubData = c ?? null;
        }

        setEvent(ev);
        setClub(clubData);
        injectEventMeta(ev, clubData);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={styles.centered}><div style={{ color: '#64748b', fontSize: 14 }}>Chargement…</div></div>;
  }

  if (error || !event) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <div style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>{error ?? 'Événement introuvable'}</div>
        <a href="/" style={styles.ctaPrimary}>Retour à SportLink</a>
      </div>
    );
  }

  const home    = event.standings?.home?.team ?? '';
  const away    = event.standings?.away?.team ?? '';
  const hasTeams = home && away;
  const appUrl  = `${window.location.origin}/#event/${event.id}`;
  const isPast  = event.date && new Date(event.date) < new Date();

  return (
    <div style={styles.page}>
      {/* Sport badge */}
      {event.sport && (
        <div style={styles.sportBadge}>{event.sport}</div>
      )}

      {/* Title */}
      <h1 style={styles.title}>
        {hasTeams ? `${home} vs ${away}` : event.title}
      </h1>

      {/* Score */}
      {isPast && event.score && <ScoreBadge score={event.score} />}

      {/* Club info */}
      {club && (
        <div style={styles.clubRow}>
          {club.logo_url && <img src={club.logo_url} alt={club.name} style={styles.clubLogo} />}
          <span style={styles.clubName}>{club.name}</span>
        </div>
      )}

      {/* Meta */}
      <div style={styles.metaList}>
        {event.date && (
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>📅</span>
            <span style={styles.metaText}>{formatDate(event.date)}</span>
          </div>
        )}
        {(event.venue ?? event.city) && (
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>📍</span>
            <span style={styles.metaText}>{event.venue ?? event.city}</span>
          </div>
        )}
        {event.man_of_match && (
          <div style={styles.metaRow}>
            <span style={styles.metaIcon}>🏆</span>
            <span style={styles.metaText}>Joueur du match : <strong>{event.man_of_match}</strong></span>
          </div>
        )}
      </div>

      {/* CTA */}
      <a href={appUrl} style={styles.ctaPrimary}>
        {isPast ? 'Voir le résultat sur SportLink' : "Voir l'événement sur SportLink"}
      </a>

      <div style={styles.footer}>
        Propulsé par <strong>SportLink</strong> — La communauté sport en Finistère
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = {
  centered: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '0 24px',
  },
  page: { maxWidth: 480, margin: '0 auto', padding: '40px 20px' },
  sportBadge: {
    display: 'inline-block', padding: '4px 12px', borderRadius: 20,
    backgroundColor: '#dcfce7', color: '#15803d',
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 16,
  },
  title: {
    margin: '0 0 8px', fontSize: 24, fontWeight: 900, color: '#0f172a', lineHeight: 1.3,
  },
  clubRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  clubLogo: { width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: '#f1f5f9', border: '1px solid #e2e8f0' },
  clubName: { fontSize: 14, fontWeight: 600, color: '#475569' },
  metaList: { marginBottom: 28 },
  metaRow:  { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  metaIcon: { fontSize: 15, flexShrink: 0, marginTop: 1 },
  metaText: { fontSize: 14, color: '#334155', lineHeight: 1.5 },
  ctaPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '14px', borderRadius: 14,
    backgroundColor: '#22D96A', color: '#fff',
    fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 10,
  },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 11, color: '#94a3b8' },
};
