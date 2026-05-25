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

function injectClubMeta(club) {
  const title = `${club.name} — SportLink`;
  const desc  = club.description ?? `Club ${club.sport} à ${club.city}`;
  const url   = window.location.href;

  document.title = title;
  setMeta('og:title',          title);
  setMeta('og:description',    desc);
  setMeta('og:url',            url);
  setMeta('og:type',           'website');
  setMeta('twitter:title',     title);
  setMeta('twitter:description', desc);
  if (club.logo_url) {
    setMeta('og:image',       club.logo_url);
    setMeta('twitter:image',  club.logo_url);
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ClubPublicPage() {
  const [club,    setClub]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      setError('ID club manquant');
      setLoading(false);
      return;
    }

    supabase
      .from('clubs')
      .select('id, name, sport, city, description, logo_url, website')
      .eq('id', id)
      .single()
      .then(({ data, error: e }) => {
        if (e || !data) {
          setError('Club introuvable');
        } else {
          setClub(data);
          injectClubMeta(data);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Chargement…</div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div style={styles.centered}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
        <div style={{ color: '#64748b', marginBottom: 24, fontSize: 14 }}>{error ?? 'Club introuvable'}</div>
        <a href="/" style={styles.ctaPrimary}>Retour à SportLink</a>
      </div>
    );
  }

  const appUrl = `${window.location.origin}/#club/${club.id}`;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        {club.logo_url ? (
          <img src={club.logo_url} alt={club.name} loading="lazy" style={styles.logo} />
        ) : (
          <div style={styles.logoPlaceholder}>⚽</div>
        )}
        <div>
          <h1 style={styles.name}>{club.name}</h1>
          <div style={styles.meta}>{club.sport}{club.city ? ` · ${club.city}` : ''}</div>
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <p style={styles.description}>{club.description}</p>
      )}

      {/* CTA */}
      <a href={appUrl} style={styles.ctaPrimary}>
        Voir le club sur SportLink
      </a>

      {club.website && (
        <a href={club.website} target="_blank" rel="noopener noreferrer" style={styles.ctaSecondary}>
          Site officiel
        </a>
      )}

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
    justifyContent: 'center', height: '100vh', textAlign: 'center',
    padding: '0 24px',
  },
  page: {
    maxWidth: 480, margin: '0 auto', padding: '32px 20px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
  },
  logo: {
    width: 72, height: 72, borderRadius: 16,
    objectFit: 'contain', background: '#f1f5f9',
    border: '1px solid #e2e8f0', flexShrink: 0,
  },
  logoPlaceholder: {
    width: 72, height: 72, borderRadius: 16,
    background: '#dcfce7', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 30, flexShrink: 0,
  },
  name: {
    margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a',
    lineHeight: 1.2,
  },
  meta: {
    marginTop: 4, fontSize: 13, color: '#64748b',
  },
  description: {
    color: '#334155', lineHeight: 1.7, fontSize: 14,
    marginBottom: 24, marginTop: 0,
  },
  ctaPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '14px', borderRadius: 14,
    backgroundColor: '#22D96A', color: '#fff',
    fontWeight: 800, fontSize: 15, textDecoration: 'none',
    marginBottom: 10,
  },
  ctaSecondary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '12px', borderRadius: 14,
    border: '1px solid #e2e8f0', color: '#475569',
    fontWeight: 600, fontSize: 14, textDecoration: 'none',
    marginBottom: 10,
  },
  footer: {
    marginTop: 40, textAlign: 'center',
    fontSize: 11, color: '#94a3b8',
  },
};
