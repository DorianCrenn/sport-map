import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import SportIcon from '../SportIcon.jsx';
import { IconMap, IconCar, IconMapPin } from '../icons.js';

function ClubLogoInitials({ club, accentColor, size = 72 }: { club: Record<string, any>; accentColor?: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = club.logoUrl || club.logo_url || club.logo;
  const initials = club.name.split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 3);
  const radius = Math.round(size * 0.22);

  if (logoUrl && !imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.9)', flexShrink: 0 }}>
        <img src={logoUrl} alt={club.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} onError={() => setImgError(true)} />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: radius, backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 3px rgba(255,255,255,0.9)', flexShrink: 0, fontSize: Math.round(size * 0.3), fontWeight: 800, color: '#fff', fontFamily: '"Oswald", "Inter", sans-serif', letterSpacing: '-0.01em' }}>
      {initials}
    </div>
  );
}

type IconComp = (p: { size?: number; color?: string }) => React.ReactElement;
interface OverflowMenuItem {
  icon?: string;
  Icon?: IconComp;
  label: string;
  action: () => void;
  danger?: boolean;
}

export function OverflowMenu({ items, open, onClose }: { items: (OverflowMenuItem | 'divider')[]; open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 310, backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 311, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', border: '1px solid var(--sl-border)', borderBottom: 'none', padding: '0 0 calc(8px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 'var(--sl-radius-xs)', backgroundColor: 'var(--sl-border)' }} />
            </div>
            <div style={{ padding: '4px 12px 0' }}>
              {items.map((item, i) =>
                item === 'divider' ? (
                  <div key={i} style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />
                ) : (
                  <button key={i} onClick={() => { item.action(); onClose(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 'var(--sl-radius-xl)', border: 'none', background: 'none', cursor: 'pointer', color: item.danger ? '#ef4444' : 'var(--sl-t1)', fontSize: 14, fontWeight: 600, textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', backgroundColor: item.danger ? 'rgba(239,68,68,0.1)' : 'var(--sl-surface)', border: `1px solid ${item.danger ? 'rgba(239,68,68,0.2)' : 'var(--sl-border-s)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.Icon ? <item.Icon size={17} color={item.danger ? '#ef4444' : 'var(--sl-t1)'} /> : <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>}
                    </div>
                    {item.label}
                  </button>
                )
              )}
              <button onClick={onClose} style={{ width: '100%', marginTop: 4, padding: '13px 14px', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--sl-t2)' }}>
                Annuler
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ value, label }: { value: string | number | null | undefined; label: string }) {
  if (value == null || value === 0 || value === '') return null;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', borderRight: '1px solid var(--sl-border)' }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500, marginTop: 2, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

interface ClubHeroProps {
  club: Record<string, any>;
  accentColor?: string;
  heroBackground?: React.CSSProperties;
  isFollowing?: boolean;
  onBack?: () => void;
  onFollow?: () => void;
  onShare?: () => void;
  matchesCount?: number;
  onViewOnMap?: () => void;
  onMenuOpen?: () => void;
}

export default function ClubHero({ club, accentColor, heroBackground, isFollowing, onBack, onFollow, onShare, matchesCount = 0, onViewOnMap, onMenuOpen }: ClubHeroProps) {
  const [mapsOpen, setMapsOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);

  useEffect(() => {
    if (!club.id) return;
    supabase.from('club_follows').select('*', { count: 'exact', head: true }).eq('club_id', club.id)
      .then(({ count }) => { if (count != null) setFollowersCount(count); });
  }, [club.id]);

  const teamCount    = (club.categories ?? []).flatMap((c: any) => c.teams ?? []).length;
  const venue        = club.venue || null;
  const clubEmail    = club.email || null;
  const foundingYear = club.foundingYear || club.founding_year || null;

  const addressParts = [venue, club.address, [club.postalCode, club.city].filter(Boolean).join(' ')].filter(Boolean);
  const fullAddress   = addressParts.join(', ');
  const shortLocation = [venue, club.city].filter(Boolean).join(' · ') || club.city || '';
  const mapsQuery     = encodeURIComponent(fullAddress || shortLocation);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isApple = /iPad|iPhone|iPod/.test(ua) || (/Mac/.test(ua) && navigator.maxTouchPoints > 1);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const appleMapsUrl  = `https://maps.apple.com/?q=${mapsQuery}`;
  const wazeUrl       = `https://waze.com/ul?q=${mapsQuery}&navigate=yes`;

  type MapOpt = { Icon: (p: { size?: number; color?: string }) => React.ReactElement; label: string; sub: string; href: string };
  const mapsOptions: MapOpt[] = isApple
    ? [{ Icon: IconMap, label: 'Plans', sub: 'Apple Maps', href: appleMapsUrl }, { Icon: IconCar, label: 'Waze', sub: 'Waze', href: wazeUrl }, { Icon: IconMapPin, label: 'Google Maps', sub: 'Google Maps', href: googleMapsUrl }]
    : [{ Icon: IconMap, label: 'Google Maps', sub: 'Google Maps', href: googleMapsUrl }, { Icon: IconCar, label: 'Waze', sub: 'Waze', href: wazeUrl }, { Icon: IconMap, label: 'Plans', sub: 'Apple Maps', href: appleMapsUrl }];

  return (
    <div role="banner">
      <AnimatePresence>
        {mapsOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={() => setMapsOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }} style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', border: '1px solid var(--sl-border)', borderBottom: 'none', padding: '0 0 calc(16px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 'var(--sl-radius-xs)', backgroundColor: 'var(--sl-border)' }} />
              </div>
              <div style={{ padding: '4px 18px 14px', borderBottom: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adresse</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)', lineHeight: 1.4 }}>
                  {venue && <div>{venue}</div>}
                  {club.address && <div style={{ fontWeight: 500, color: 'var(--sl-t2)' }}>{club.address}</div>}
                  {(club.postalCode || club.city) && <div style={{ fontWeight: 500, color: 'var(--sl-t2)' }}>{[club.postalCode, club.city].filter(Boolean).join(' ')}</div>}
                  {!venue && !club.address && !club.postalCode && club.city && <div>{club.city}</div>}
                </div>
              </div>
              <div style={{ padding: '8px 12px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {mapsOptions.map(opt => (
                  <a key={opt.href} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={() => setMapsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', textDecoration: 'none', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><opt.Icon size={18} color="var(--sl-green)" /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Ouvrir dans {opt.sub}</div>
                    </div>
                  </a>
                ))}
                {onViewOnMap && (
                  <button onClick={() => { setMapsOpen(false); onViewOnMap(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderRadius: 'var(--sl-radius-xl)', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', cursor: 'pointer', color: 'var(--sl-t1)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IconMapPin size={18} color="var(--sl-green)" /></div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Voir sur la carte</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Carte SportLink</div>
                    </div>
                  </button>
                )}
                <button onClick={() => setMapsOpen(false)} style={{ marginTop: 4, padding: '13px 14px', borderRadius: 'var(--sl-radius-xl)', border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--sl-t2)' }}>
                  Annuler
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', minHeight: 130, ...heroBackground, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 80% 30%, ${accentColor}22 0%, transparent 60%)` }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0', position: 'relative', zIndex: 2 }}>
          <button onClick={onBack} aria-label="Retour à la liste des clubs" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 'var(--sl-radius-xl)', border: 'none', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            ← Retour
          </button>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button onClick={onShare} aria-label="Partager" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: 'none', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button onClick={onMenuOpen} aria-label="Plus d'actions" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: 'none', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="4" viewBox="0 0 20 4" fill="currentColor"><circle cx="2" cy="2" r="2"/><circle cx="10" cy="2" r="2"/><circle cx="18" cy="2" r="2"/></svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, padding: '12px 16px 20px', position: 'relative', zIndex: 2 }}>
          <ClubLogoInitials club={club} accentColor={accentColor} size={68} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: '"Oswald", "Inter", sans-serif', margin: 0, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}>
                <SportIcon sport={club.sport} size={12} color="rgba(255,255,255,0.7)" />
                <span>{club.sport}</span>
                {club.level && (<><span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.level}</span></>)}
              </div>
              {shortLocation && (
                <button onClick={() => setMapsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.35)', textUnderlineOffset: 2 }}>{shortLocation}</span>
                  {fullAddress && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.6 }}><polyline points="9 18 15 12 9 6"/></svg>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)' }}>
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px 0' }}>
          <button
            onClick={onFollow}
            aria-label={isFollowing ? 'Modifier les préférences de suivi' : 'Suivre ce club'}
            data-demo="follow-club-btn"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 'var(--sl-radius-xl)', border: 'none', minHeight: 40, cursor: 'pointer', fontWeight: 700, fontSize: 13, backgroundColor: isFollowing ? `${accentColor}18` : accentColor, color: isFollowing ? accentColor : '#fff', boxShadow: isFollowing ? `inset 0 0 0 1.5px ${accentColor}50` : `0 3px 12px ${accentColor}40`, transition: 'all 0.15s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isFollowing ? accentColor : 'none'} stroke={isFollowing ? accentColor : '#fff'} strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {isFollowing ? 'Suivi' : 'Suivre le club'}
          </button>
          {clubEmail && (
            <a href={`mailto:${clubEmail}`} aria-label={`Envoyer un email à ${club.name}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 'var(--sl-radius-xl)', border: '1.5px solid var(--sl-border)', minHeight: 40, cursor: 'pointer', fontWeight: 700, fontSize: 13, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', textDecoration: 'none', transition: 'background 0.12s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t2)" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Message
            </a>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'stretch', margin: '12px 14px', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', overflow: 'hidden' }}>
          {teamCount > 0 && <StatCard value={teamCount} label="Équipes" />}
          {followersCount != null && <StatCard value={followersCount} label="Abonnés" />}
          {matchesCount > 0 && <StatCard value={matchesCount} label="Matchs" />}
          {foundingYear && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.2 }}>{foundingYear}</span>
              <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 500, marginTop: 2 }}>Création</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
