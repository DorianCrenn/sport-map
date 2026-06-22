import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.js';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import { useCanDo } from '../hooks/useCanDo.js';
import SportLinkLogo from './SportLinkLogo.jsx';

interface SideNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  badgeCounts?: Record<string, number>;
  onAddEvent?: () => void;
  onImportCSV?: () => void;
  onOpenTrainings?: () => void;
  onClubAdminAction?: (action: string) => boolean | void;
}

type NavItem = { id: string; label: string; icon: (active: boolean) => React.ReactNode };

const NAV: NavItem[] = [
  {
    id: 'home', label: 'Agenda',
    icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path fill={a ? 'currentColor' : 'none'} d="M10 6h8v4h-8z"/></svg>,
  },
  {
    id: 'map', label: 'Carte',
    icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
  },
  {
    id: 'clubs', label: 'Clubs',
    icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: 'favoris', label: 'Favoris',
    icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    id: 'profil', label: 'Profil',
    icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

const ADMIN_NAV: NavItem = {
  id: 'admin', label: 'Administration',
  icon: a => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

function NavBtn({ item, active, badge, onClick }: { item: NavItem; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: active ? undefined : 'var(--sl-hover)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        width: '100%', padding: '9px 12px', borderRadius: 10,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: active ? 'rgba(34,217,106,0.12)' : 'transparent',
        color: active ? 'var(--sl-green)' : 'var(--sl-t2)',
        position: 'relative',
      }}
    >
      {item.icon(active)}
      <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: 'inherit', flex: 1 }}>{item.label}</span>
      {!!badge && badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9,
          backgroundColor: '#ef4444', color: '#fff',
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ backgroundColor: 'var(--sl-hover)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '8px 10px', borderRadius: 8,
        border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: 'transparent', color: 'var(--sl-t2)',
      }}
    >
      <span style={{ color: 'var(--sl-t3)', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
    </motion.button>
  );
}

export default function SideNav({
  activeTab, onTabChange, badgeCounts = {},
  onAddEvent, onImportCSV, onOpenTrainings, onClubAdminAction,
}: SideNavProps) {
  const { isAdmin, isClubAdmin, currentUser } = useAuth() as any;
  const { managedClubs = [] } = useManagedClubs() as any;
  const { can, isSimulating } = useCanDo() as any;

  const isClubAdminOnly = isClubAdmin && !isAdmin;
  const isCoach = !isAdmin && !isClubAdmin && managedClubs.length > 0;
  const canFab = isSimulating ? can('matches', 'create') : (isAdmin || isCoach || isClubAdminOnly);

  const [actionsOpen, setActionsOpen] = useState(true);

  const navItems = isAdmin ? [...NAV, ADMIN_NAV] : NAV;

  function doAction(action: string) {
    if (action === 'event')     { onAddEvent?.(); return; }
    if (action === 'csv')       { onImportCSV?.(); return; }
    if (action === 'trainings') { onOpenTrainings?.(); return; }
    if (action === 'clubs' || action === 'map') { onTabChange(action); return; }
    onClubAdminAction?.(action);
  }

  const displayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '';
  const initials = displayName[0]?.toUpperCase() ?? '?';
  const role = isAdmin ? 'Admin' : isClubAdminOnly ? 'Gestionnaire' : isCoach ? 'Coach' : 'Membre';

  return (
    <nav
      aria-label="Navigation principale"
      style={{
        width: 220, flexShrink: 0,
        height: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sl-card)',
        borderRight: '1px solid var(--sl-border)',
        userSelect: 'none',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '16px 16px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--sl-border)', flexShrink: 0,
      }}>
        <SportLinkLogo size={30} />
        <span style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 20, fontWeight: 900,
          color: 'var(--sl-t1)', letterSpacing: '-0.01em',
        }}>
          SportLink
        </span>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavBtn
            key={item.id}
            item={item}
            active={activeTab === item.id}
            badge={badgeCounts[item.id]}
            onClick={() => onTabChange(item.id)}
          />
        ))}
      </div>

      {/* Quick actions */}
      {canFab && (
        <div style={{ borderTop: '1px solid var(--sl-border)', padding: '10px 8px', flexShrink: 0 }}>
          <button
            onClick={() => setActionsOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-green)', color: '#000',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13, fontWeight: 800, letterSpacing: '0.03em',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Actions rapides
            <svg
              style={{ marginLeft: 'auto', transform: actionsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {actionsOpen && (
            <div style={{ marginTop: 4 }}>
              <ActionBtn
                onClick={() => doAction('event')}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>}
                label="Créer un événement"
              />
              {isClubAdminOnly ? (
                <>
                  <ActionBtn onClick={() => doAction('dashboard')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>} label="Tableau de bord" />
                  <ActionBtn onClick={() => doAction('edit-page')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Modifier la page" />
                  <ActionBtn onClick={() => doAction('announcements')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} label="Annonces" />
                  <ActionBtn onClick={() => doAction('subscription')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Abonnement" />
                </>
              ) : (
                <>
                  <ActionBtn onClick={() => doAction('csv')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>} label="Résultats / CSV" />
                  <ActionBtn onClick={() => doAction('trainings')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Entraînements" />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* User card */}
      {currentUser && (
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--sl-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            backgroundColor: 'rgba(34,217,106,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: 'var(--sl-green)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{role}</div>
          </div>
        </div>
      )}
    </nav>
  );
}
