import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SportIcon from '../SportIcon.jsx';

// ── Logo initiales ────────────────────────────────────────────────────────────

function ClubLogoInitials({ club, accentColor, size = 72 }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = club.logo_url || club.logo;
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
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 80 }}
            onClick={onClose}
          />
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
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const teamCount = (club.categories ?? []).flatMap(c => c.teams ?? []).length;
  const memberCount = club.members ?? 0;

  const overflowItems = [
    {
      icon: '🔗',
      label: linkCopied ? 'Lien copié !' : 'Copier le lien',
      action: onCopyLink,
    },
    {
      icon: '📤',
      label: 'Partager',
      action: onShare,
    },
    {
      icon: '🎨',
      label: 'Créer l\'affiche',
      action: onPoster,
    },
    {
      icon: '📅',
      label: 'Exporter le calendrier',
      action: onExportICS,
    },
    ...(club.contact ? [{
      icon: '✉️',
      label: `Contacter ${club.name}`,
      action: onContact,
    }] : []),
  ];

  return (
    <div style={{ flexShrink: 0 }} role="banner">
      {/* Banner */}
      <div
        style={{
          position: 'relative',
          minHeight: 140,
          ...heroBackground,
          overflow: 'hidden',
        }}
      >
        {/* Glow overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 80% 30%, ${accentColor}22 0%, transparent 60%)`,
        }} />

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 0',
          position: 'relative', zIndex: 2,
        }}>
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

          {/* Overflow "..." */}
          <div style={{ position: 'relative' }}>
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
            <OverflowMenu
              items={overflowItems}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
            />
          </div>
        </div>

        {/* Identity row */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 14,
          padding: '16px 16px 20px',
          position: 'relative', zIndex: 2,
        }}>
          <ClubLogoInitials club={club} accentColor={accentColor} size={72} />

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
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500,
            }}>
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

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
      }}>
        {/* Follow — primary action */}
        <button
          onClick={onFollow}
          aria-label={isFollowing ? 'Modifier les préférences de suivi' : 'Suivre ce club'}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '11px 16px', borderRadius: 12, border: 'none',
            minHeight: 44, cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
            backgroundColor: isFollowing ? `${accentColor}20` : accentColor,
            color: isFollowing ? accentColor : '#fff',
            boxShadow: isFollowing ? `inset 0 0 0 1.5px ${accentColor}50` : `0 3px 12px ${accentColor}50`,
            transition: 'all 0.15s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24"
            fill={isFollowing ? accentColor : 'none'}
            stroke={isFollowing ? accentColor : '#fff'}
            strokeWidth="2" strokeLinecap="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {isFollowing ? 'Suivi ✓' : 'Suivre le club'}
        </button>

        {/* Stats chips */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {teamCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 10,
              backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)' }}>{teamCount}</span>
            </div>
          )}
          {memberCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 10,
              backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)' }}>{memberCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
