import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import SportIcon from '../SportIcon.jsx';

// ── Logo initiales ────────────────────────────────────────────────────────────

function ClubLogoInitials({ club, accentColor, size = 72 }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = club.logo_url || club.logo || club.logoUrl;
  const initials = club.name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 3);
  const radius = Math.round(size * 0.22);

  if (logoUrl && !imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        overflow: 'hidden', backgroundColor: '#fff',
        boxShadow: '0 0 0 3px rgba(255,255,255,0.9)',
        flexShrink: 0,
      }}>
        <img
          src={logoUrl} alt={club.name} loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: accentColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 0 3px rgba(255,255,255,0.9)',
      flexShrink: 0,
      fontSize: Math.round(size * 0.3), fontWeight: 800, color: '#fff',
      fontFamily: '"Oswald", "Inter", sans-serif',
      letterSpacing: '-0.01em',
    }}>
      {initials}
    </div>
  );
}

// ── Overflow menu ─────────────────────────────────────────────────────────────

function OverflowMenu({ items, open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 80 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              zIndex: 90, minWidth: 200,
              backgroundColor: 'var(--sl-card)',
              border: '1px solid var(--sl-border)',
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {items.map((item, i) => (
              item === 'divider' ? (
                <div key={i} style={{ height: 1, backgroundColor: 'var(--sl-border)' }} />
              ) : (
                <button
                  key={i}
                  onClick={() => { item.action(); onClose(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', border: 'none', background: 'none',
                    cursor: 'pointer', color: item.danger ? '#ef4444' : 'var(--sl-t1)',
                    fontSize: 13, fontWeight: 600, textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--sl-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label }) {
  if (value == null || value === 0 || value === '') return null;
  return (
    <div style={{
      flex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 4px',
      borderRight: '1px solid var(--sl-border)',
    }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500, marginTop: 2, textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

// ── Hero principal ────────────────────────────────────────────────────────────

export default function ClubHero({
  club,
  accentColor,
  heroBackground,
  isFollowing,
  onBack,
  onFollow,
  onShare,
  onCopyLink,
  onPoster,
  onExportICS,
  onContact,
  linkCopied,
  matchesCount = 0,
  onViewOnMap,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(null);

  // Fetch du nombre d'abonnés
  useEffect(() => {
    if (!club.id) return;
    supabase
      .from('club_follows')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', club.id)
      .then(({ count }) => { if (count != null) setFollowersCount(count); });
  }, [club.id]);

  const teamCount = (club.categories ?? []).flatMap(c => c.teams ?? []).length;
  const venue    = club.venue || null;
  const location = [venue, club.city].filter(Boolean).join(' · ');
  const clubEmail = club.email || null;
  const foundingYear = club.foundingYear || club.founding_year || null;

  const overflowItems = [
    { icon: '🔗', label: linkCopied ? 'Lien copié !' : 'Copier le lien', action: onCopyLink },
    { icon: '📤', label: 'Partager', action: onShare },
    { icon: '🎨', label: "Créer l'affiche", action: onPoster },
    { icon: '📅', label: 'Exporter le calendrier', action: onExportICS },
    ...(clubEmail ? [{ icon: '✉️', label: `Contacter ${club.name}`, action: onContact ?? (() => window.open(`mailto:${clubEmail}`)) }] : []),
  ];

  return (
    <div role="banner">

      {/* ── Bannière hero ── */}
      <div style={{ position: 'relative', minHeight: 130, ...heroBackground, overflow: 'hidden' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 80% 30%, ${accentColor}22 0%, transparent 60%)` }} />

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0', position: 'relative', zIndex: 2 }}>
          <button
            onClick={onBack}
            aria-label="Retour à la liste des clubs"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 10, border: 'none',
              background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
              color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', minHeight: 36,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Clubs
          </button>

          <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
            {/* Share */}
            <button
              onClick={onShare}
              aria-label="Partager"
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>

            {/* Overflow */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Plus d'actions"
              aria-expanded={menuOpen}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="4" viewBox="0 0 20 4" fill="currentColor">
                <circle cx="2" cy="2" r="2"/><circle cx="10" cy="2" r="2"/><circle cx="18" cy="2" r="2"/>
              </svg>
            </button>
            <OverflowMenu items={overflowItems} open={menuOpen} onClose={() => setMenuOpen(false)} />
          </div>
        </div>

        {/* Identité */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '12px 16px 20px', position: 'relative', zIndex: 2 }}>
          <ClubLogoInitials club={club} accentColor={accentColor} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.02em', lineHeight: 1.15,
              fontFamily: '"Oswald", "Inter", sans-serif',
              margin: 0, marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {club.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>
              <SportIcon sport={club.sport} size={12} color="rgba(255,255,255,0.7)" />
              <span>{club.sport}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Carte blanche sous le hero ── */}
      <div style={{ backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)' }}>

        {/* Boutons Suivre + Message */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px 0' }}>
          <button
            onClick={onFollow}
            aria-label={isFollowing ? 'Modifier les préférences de suivi' : 'Suivre ce club'}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 12px', borderRadius: 12, border: 'none',
              minHeight: 40, cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              backgroundColor: isFollowing ? `${accentColor}18` : accentColor,
              color: isFollowing ? accentColor : '#fff',
              boxShadow: isFollowing ? `inset 0 0 0 1.5px ${accentColor}50` : `0 3px 12px ${accentColor}40`,
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={isFollowing ? accentColor : 'none'}
              stroke={isFollowing ? accentColor : '#fff'}
              strokeWidth="2" strokeLinecap="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {isFollowing ? 'Suivi ✓' : 'Suivre le club'}
          </button>

          {/* Message — visible si email connu */}
          {clubEmail && (
            <a
              href={`mailto:${clubEmail}`}
              aria-label={`Envoyer un email à ${club.name}`}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 12px', borderRadius: 12,
                border: '1.5px solid var(--sl-border)',
                minHeight: 40, cursor: 'pointer',
                fontWeight: 700, fontSize: 13,
                backgroundColor: 'var(--sl-surface)',
                color: 'var(--sl-t1)',
                textDecoration: 'none',
                transition: 'background 0.12s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Message
            </a>
          )}
        </div>

        {/* Lieu */}
        {location && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>{location}</span>
            </div>
            {(onViewOnMap || (club.lat && club.lng)) && (
              <button
                onClick={onViewOnMap}
                style={{
                  fontSize: 11, fontWeight: 700, color: accentColor,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                }}
              >
                Voir sur la carte
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Stats 4 cards */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          margin: '12px 14px',
          borderRadius: 14,
          border: '1px solid var(--sl-border)',
          backgroundColor: 'var(--sl-surface)',
          overflow: 'hidden',
        }}>
          {teamCount > 0 && (
            <StatCard value={teamCount} label="Équipes" />
          )}
          {followersCount != null && (
            <StatCard value={followersCount} label="Abonnés" />
          )}
          {matchesCount > 0 && (
            <StatCard value={matchesCount} label="Matchs" />
          )}
          {foundingYear && (
            <div style={{
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 4px',
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.2 }}>
                {foundingYear}
              </span>
              <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500, marginTop: 2 }}>
                Création
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
