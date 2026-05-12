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
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const ACTIVE_GREEN = '#22C55E';
const ACTIVE_BLUE  = '#3b82f6';

export default function BottomNav({ activeTab, onTabChange, badgeCounts = {} }) {
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;

  return (
    <nav
      className="flex-shrink-0 flex items-stretch"
      style={{
        backgroundColor: 'var(--sl-nav-bg)',
        boxShadow: 'var(--sl-nav-shadow)',
        borderTop: '1px solid var(--sl-nav-border)',
      }}
    >
      {tabs.map((tab) => {
        const active       = activeTab === tab.id;
        const isAdminTab   = tab.id === 'admin';
        const activeColor  = isAdminTab ? ACTIVE_BLUE : ACTIVE_GREEN;
        const color        = active ? activeColor : 'var(--sl-nav-inactive)';
        const badgeCount   = badgeCounts[tab.id] || 0;

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.88 }}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 cursor-pointer relative"
            style={{ color }}
          >
            {active && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ backgroundColor: activeColor }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <div className="relative">
              {tab.icon(active)}
              {badgeCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#ef4444', minWidth: 16 }}
                >
                  <span className="text-white font-bold" style={{ fontSize: 9, lineHeight: 1 }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                </motion.div>
              )}
            </div>
            <span className="text-[10px] font-semibold font-poppins" style={{ color }}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
