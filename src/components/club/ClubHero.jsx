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

// Bottom sheet — exporté pour être rendu dans ClubPageView (après le sticky FAB)
export function OverflowMenu({ items, open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 310, backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 311,
              backgroundColor: 'var(--sl-card)',
              borderRadius: '18px 18px 0 0',
              border: '1px solid var(--sl-border)',
              borderBottom: 'none',
              padding: '0 0 calc(8px + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--sl-border)' }} />
            </div>

            {/* Items */}
            <div style={{ padding: '4px 12px 0' }}>
              {items.map((item, i) => (
                item === 'divider' ? (
                  <div key={i} style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />
                ) : (
                  <button
                    key={i}
                    onClick={() => { item.action(); onClose(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 13,
                      border: 'none', background: 'none',
                      cursor: 'pointer', color: item.danger ? '#ef4444' : 'var(--sl-t1)',
                      fontSize: 14, fontWeight: 600, textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, width: 24, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              ))}

              {/* Annuler */}
              <button
                onClick={onClose}
                style={{
                  width: '100%', marginTop: 4,
                  padding: '13px 14px', borderRadius: 13,
                  border: 'none', backgroundColor: 'var(--sl-surface)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  color: 'var(--sl-t2)',
                }}
              >
                Annuler
              </button>
            </div>
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
  matchesCount = 0,
  onViewOnMap,
  onMenuOpen,
}) {
  const [mapsOpen, setMapsOpen] = useState(false);
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

  const teamCount    = (club.categories ?? []).flatMap(c => c.teams ?? []).length;
  const venue        = club.venue || null;
  const clubEmail    = club.email || null;
  const foundingYear = club.foundingYear || club.founding_year || null;

  // Adresse complète pour affichage et liens maps
  const addressParts = [
    venue,
    club.address,
    [club.postalCode, club.city].filter(Boolean).join(' '),
  ].filter(Boolean);
  const fullAddress   = addressParts.join(', ');
  const shortLocation = [venue, club.city].filter(Boolean).join(' · ') || club.city || '';
  const mapsQuery     = encodeURIComponent(fullAddress || shortLocation);

  // Détection plateforme pour choisir l'app maps native
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isApple = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);

  const googleMapsUrl  = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const appleMapsUrl   = `https://maps.apple.com/?q=${mapsQuery}`;
  const wazeUrl        = `https://waze.com/ul?q=${mapsQuery}&navigate=yes`;

  // Options triées selon la plateforme
  const mapsOptions = isApple
    ? [
        { icon: '🗺️', label: 'Plans',        sub: 'Apple Maps',    href: appleMapsUrl },
        { icon: '🚗', label: 'Waze',          sub: 'Waze',          href: wazeUrl },
        { icon: '📍', label: 'Google Maps',   sub: 'Google Maps',   href: googleMapsUrl },
      ]
    : [
        { icon: '🗺️', label: 'Google Maps',  sub: 'Google Maps',   href: googleMapsUrl },
        { icon: '🚗', label: 'Waze',          sub: 'Waze',          href: wazeUrl },
        { icon: '🍎', label: 'Plans',         sub: 'Apple Maps',    href: appleMapsUrl },
      ];

  // overflowItems géré dans ClubPageView

  return (
    <div role="banner">

      {/* ── Sheet Maps (position fixed pour passer au-dessus du overflow:hidden hero) ── */}
      <AnimatePresence>
        {mapsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.45)' }}
              onClick={() => setMapsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
                backgroundColor: 'var(--sl-card)',
                borderRadius: '18px 18px 0 0',
                border: '1px solid var(--sl-border)',
                borderBottom: 'none',
                padding: '0 0 calc(16px + env(safe-area-inset-bottom, 0px))',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
              }}
            >
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--sl-border)' }} />
              </div>

              {/* Adresse */}
              <div style={{ padding: '4px 18px 14px', borderBottom: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adresse</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1.4 }}>
                  {venue && <div>{venue}</div>}
                  {club.address && <div style={{ fontWeight: 500, color: 'var(--sl-t2)' }}>{club.address}</div>}
                  {(club.postalCode || club.city) && (
                    <div style={{ fontWeight: 500, color: 'var(--sl-t2)' }}>
                      {[club.postalCode, club.city].filter(Boolean).join(' ')}
                    </div>
                  )}
                  {!venue && !club.address && !club.postalCode && club.city && (
                    <div>{club.city}</div>
                  )}
                </div>
              </div>

              {/* Actions — ordre adapté à la plateforme */}
              <div style={{ padding: '8px 12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mapsOptions.map(opt => (
                  <a
                    key={opt.href}
                    href={opt.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMapsOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 13,
                      backgroundColor: 'var(--sl-surface)', textDecoration: 'none',
                      border: '1px solid var(--sl-border-s)',
                      color: 'var(--sl-t1)',
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Ouvrir dans {opt.sub}</div>
                    </div>
                  </a>
                ))}

                {onViewOnMap && (
                  <button
                    onClick={() => { setMapsOpen(false); onViewOnMap(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 13,
                      backgroundColor: 'var(--sl-surface)',
                      border: '1px solid var(--sl-border-s)',
                      cursor: 'pointer', color: 'var(--sl-t1)',
                    }}
                  >
                    <span style={{ fontSize: 20, lineHeight: 1 }}>📍</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Voir sur la carte</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Carte SportLink</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setMapsOpen(false)}
                  style={{
                    marginTop: 4, padding: '13px 14px', borderRadius: 13,
                    border: 'none', backgroundColor: 'var(--sl-surface)',
                    cursor: 'pointer', fontSize: 14, fontWeight: 700,
                    color: 'var(--sl-t2)',
                  }}
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

            {/* Overflow — state géré dans ClubPageView */}
            <button
              onClick={onMenuOpen}
              aria-label="Plus d'actions"
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Sport + niveau */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>
                <SportIcon sport={club.sport} size={12} color="rgba(255,255,255,0.7)" />
                <span>{club.sport}</span>
                {club.level && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.level}</span>
                  </>
                )}
              </div>
              {/* Adresse cliquable → sheet maps */}
              {shortLocation && (
                <button
                  onClick={() => setMapsOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', padding: 0,
                    cursor: 'pointer', textAlign: 'left',
                    color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.35)', textUnderlineOffset: 2 }}>
                    {shortLocation}
                  </span>
                  {fullAddress && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.6 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  )}
                </button>
              )}
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

        {/* Lieu supprimé ici — affiché dans le hero avec lien maps */}

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
