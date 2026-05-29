import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useManagedClubs } from '../hooks/useManagedClubs.js';

const HOME_VISITOR = {
  id: 'home', label: 'Accueil',
  icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};
const HOME_FEED = {
  id: 'home', label: 'Actus',
  icon: (a) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/>
      <path fill={a ? 'currentColor' : 'none'} d="M10 6h8v4h-8z"/>
    </svg>
  ),
};
const MAP = {
  id: 'map', label: 'Carte',
  icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
};
const FAVORIS = {
  id: 'favoris', label: 'Favoris',
  icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
};
const CLUBS = {
  id: 'clubs', label: 'Clubs',
  icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};
const PROFIL = {
  id: 'profil', label: 'Profil',
  icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};
export default function BottomNav({ activeTab, onTabChange, badgeCounts = {}, onAddEvent, onImportCSV, onOpenTrainings, overlayOpen = false }) {
  const { isAdmin, isClubAdmin, currentUser } = useAuth();
  const { managedClubs } = useManagedClubs();
  const isCoach = !isAdmin && !isClubAdmin && managedClubs.length > 0;
  const canFab = isAdmin || isClubAdmin || isCoach;
  const HOME = currentUser ? HOME_FEED : HOME_VISITOR;
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => { if (overlayOpen) setFabOpen(false); }, [overlayOpen]);

  // Always 5 slots. Admin access is via Profil → "Tableau de bord"
  const tabs = canFab
    ? [HOME, MAP, null /* FAB slot */, CLUBS, PROFIL]
    : [HOME, MAP, FAVORIS, CLUBS, PROFIL];

  function handleFabAction(action) {
    setFabOpen(false);
    if (action === 'event')     onAddEvent?.();
    if (action === 'csv')       onImportCSV?.();
    if (action === 'trainings') onOpenTrainings?.();
    if (action === 'clubs')     onTabChange?.('clubs');
    if (action === 'map')       onTabChange?.('map');
  }

  return (
    <div style={{
      position: 'relative', flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'var(--sl-bg)',
      display: overlayOpen ? 'none' : undefined,
    }}>
      {/* FAB quick-action popover — hidden entirely when any full-screen overlay is active */}
      <AnimatePresence>
        {fabOpen && !overlayOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFabOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1001 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{
                position: 'fixed',
                bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)',
                left: 'calc(50% - 124px)',
                width: 248, zIndex: 1002,
                backgroundColor: 'var(--sl-card)', borderRadius: 20,
                border: '1px solid var(--sl-border-s)',
                boxShadow: 'var(--sl-shadow-xl)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: 6 }}>
                <FabAction
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
                  label="Créer un événement"
                  color="var(--sl-green)"
                  onClick={() => handleFabAction('event')}
                />
                <FabAction
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  label="Mes entraînements"
                  color="#22c55e"
                  onClick={() => handleFabAction('trainings')}
                />
                {!isCoach && (
                  <>
                    <FabAction
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                      label="Mon club"
                      color="var(--sl-blue)"
                      onClick={() => handleFabAction('clubs')}
                    />
                    <FabAction
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
                      label="Importer un CSV"
                      color="#a855f7"
                      onClick={() => handleFabAction('csv')}
                    />
                    <FabAction
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></svg>}
                      label="Voir la carte"
                      color="#f59e0b"
                      onClick={() => handleFabAction('map')}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav style={{
        display: 'flex', alignItems: 'stretch',
        margin: '8px 12px 12px', borderRadius: 24,
        background: 'var(--sl-nav-bg)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        boxShadow: 'var(--sl-nav-shadow)',
        border: '1px solid var(--sl-nav-border)',
        overflow: 'visible',
        position: 'relative',
      }}>
        {tabs.map((tab, i) => {
          if (tab === null) {
            // FAB slot
            return (
              <div key="fab" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setFabOpen(o => !o)}
                  aria-label={fabOpen ? 'Fermer le menu rapide' : 'Ouvrir le menu rapide'}
                  aria-expanded={fabOpen}
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    backgroundColor: 'var(--sl-green)',
                    border: `3px solid var(--sl-bg)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: fabOpen
                      ? '0 0 0 3px rgba(34,217,106,0.35), 0 6px 20px rgba(34,217,106,0.45)'
                      : '0 0 0 1px rgba(34,217,106,0.25), 0 4px 16px rgba(34,217,106,0.4)',
                    position: 'relative', bottom: 10,
                    transition: 'box-shadow 0.2s',
                    zIndex: 10,
                  }}
                >
                  <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.18 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </motion.div>
                </motion.button>
              </div>
            );
          }

          const active = activeTab === tab.id;
          const activeColor = 'var(--sl-green)';
          const color = active ? activeColor : 'var(--sl-nav-inactive)';
          const badgeCount = badgeCounts[tab.id] || 0;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.86 }}
              onClick={() => { setFabOpen(false); onTabChange(tab.id); }}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: '10px 4px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color, position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    width: 28, height: 3, borderRadius: 999,
                    backgroundColor: activeColor,
                    margin: '0 auto',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div style={{ position: 'relative' }}>
                {tab.icon(active)}
                {badgeCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      position: 'absolute', top: -4, right: -6,
                      width: 16, height: 16, borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 16,
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 9, lineHeight: 1 }}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  </motion.div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', color }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

function FabAction({ icon, label, color, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
        backgroundColor: hover ? 'var(--sl-hover)' : 'transparent',
        transition: 'background-color 0.1s',
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        backgroundColor: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{label}</span>
    </button>
  );
}
