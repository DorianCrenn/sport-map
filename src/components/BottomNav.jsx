import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';

const BASE_TABS = [
  {
    id: 'home',
    label: 'Accueil',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'map',
    label: 'Carte',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/>
        <line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'favoris',
    label: 'Favoris',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 'clubs',
    label: 'Clubs',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'profil',
    label: 'Profil',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const ADMIN_TAB = {
  id: 'admin',
  label: 'Admin',
  icon: (active) => (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

export default function BottomNav({ activeTab, onTabChange, badgeCounts = {} }) {
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'var(--sl-bg)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'stretch',
          margin: '8px 12px 12px',
          borderRadius: 24,
          background: 'var(--sl-nav-bg)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          boxShadow: 'var(--sl-nav-shadow)',
          border: '1px solid var(--sl-nav-border)',
          overflow: 'hidden',
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const isAdminTab = tab.id === 'admin';
          const activeColor = isAdminTab ? '#3da5ff' : 'var(--sl-green)';
          const color = active ? activeColor : 'var(--sl-nav-inactive)';
          const badgeCount = badgeCounts[tab.id] || 0;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.86 }}
              onClick={() => onTabChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                padding: '10px 4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color,
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28,
                    height: 2,
                    borderRadius: 999,
                    backgroundColor: activeColor,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div style={{ position: 'relative' }}>
                {tab.icon(active)}
                {badgeCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 16,
                    }}
                  >
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 9, lineHeight: 1 }}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  </motion.div>
                )}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.01em',
                color,
              }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
