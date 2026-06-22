import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.js';
import { useManagedClubs } from '../hooks/useManagedClubs.js';
import { useCanDo } from '../hooks/useCanDo.js';
import { hapticLight } from '../lib/haptic.js';

type TabId = string;
interface TabDef { id: TabId; label: string; icon: (active: boolean) => React.ReactNode; }
interface BottomNavProps { activeTab: string; onTabChange: (id: string) => void; badgeCounts?: Record<string, number>; onAddEvent?: () => void; onImportCSV?: () => void; onOpenTrainings?: () => void; onClubAdminAction?: (action: string) => void; overlayOpen?: boolean; }

const HOME_VISITOR: TabDef = { id: 'home', label: 'Accueil', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> };
const HOME_FEED: TabDef = { id: 'home', label: 'Agenda', icon: (a) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2z"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path fill={a ? 'currentColor' : 'none'} d="M10 6h8v4h-8z"/></svg>) };
const MAP: TabDef = { id: 'map', label: 'Carte', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg> };
const FAVORIS: TabDef = { id: 'favoris', label: 'Favoris', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> };
const CLUBS: TabDef = { id: 'clubs', label: 'Clubs', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> };
const PROFIL: TabDef = { id: 'profil', label: 'Profil', icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> };
const MON_CLUB: TabDef = { id: 'mon-club', label: 'Mon Club', icon: (a) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={a ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>) };

export default function BottomNav({ activeTab, onTabChange, badgeCounts = {}, onAddEvent, onImportCSV, onOpenTrainings, onClubAdminAction, overlayOpen = false }: BottomNavProps) {
  const { isAdmin, isClubAdmin, currentUser } = useAuth();
  const { managedClubs = [] } = useManagedClubs();
  const { can, isSimulating } = useCanDo();

  const isClubAdminOnly = isClubAdmin && !isAdmin;
  const isCoach = !isAdmin && !isClubAdmin && managedClubs.length > 0;
  const canFab = isSimulating ? can('matches', 'create') : (isAdmin || isCoach || isClubAdminOnly);
  const HOME = currentUser ? HOME_FEED : HOME_VISITOR;
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => { if (overlayOpen) setFabOpen(false); }, [overlayOpen]);

  const tabs: (TabDef | null)[] = isClubAdminOnly
    ? [HOME, MAP, null, CLUBS, FAVORIS]
    : canFab
    ? [HOME, MAP, null, CLUBS, PROFIL]
    : [HOME, MAP, FAVORIS, CLUBS, PROFIL];

  function handleFabAction(action: string) {
    setFabOpen(false);
    if (action === 'event')     onAddEvent?.();
    if (action === 'csv')       onImportCSV?.();
    if (action === 'trainings') onOpenTrainings?.();
    if (action === 'clubs')     onTabChange?.('clubs');
    if (action === 'map')       onTabChange?.('map');
  }
  function handleClubAdminFabAction(actionId: string) { setFabOpen(false); onClubAdminAction?.(actionId); }

  return (
    <div style={{ position: 'relative', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'var(--sl-bg)', display: overlayOpen ? 'none' : undefined }}>
      <AnimatePresence>
        {fabOpen && !overlayOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1001 }} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 8 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)', left: isClubAdminOnly ? 'calc(50% - 148px)' : 'calc(50% - 124px)', width: isClubAdminOnly ? 296 : 248, zIndex: 1002, backgroundColor: 'var(--sl-card)', borderRadius: 20, border: '1px solid var(--sl-border-s)', boxShadow: 'var(--sl-shadow-xl)', overflow: 'hidden' }}>
              <div style={{ padding: 6 }}>
                {isClubAdminOnly ? (
                  <>
                    <FabAction idx={0} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>} label="Tableau de bord" desc="Stats, vues, conversions" color="#6366f1" onClick={() => handleClubAdminFabAction('dashboard')} />
                    <FabAction idx={1} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Modifier la page" desc="Blocs, design, typographie" color="#f59e0b" onClick={() => handleClubAdminFabAction('edit-page')} />
                    <FabAction idx={2} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} label="Créer un événement" desc="Match, tournoi, entraînement" color="var(--sl-green)" onClick={() => handleClubAdminFabAction('event')} />
                    <FabAction idx={3} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} label="Envoyer une annonce" desc="Tous les abonnés ou une équipe" color="#3b82f6" onClick={() => handleClubAdminFabAction('announce')} />
                    <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 6px' }} />
                    <FabAction idx={4} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Infos du club" desc="Nom, sport, ville, équipes" color="#0ea5e9" onClick={() => handleClubAdminFabAction('edit-info')} />
                    <FabAction idx={5} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>} label="Créer une équipe" desc="Ajouter une catégorie ou une équipe" color="#22d96a" onClick={() => handleClubAdminFabAction('add-team')} />
                    <FabAction idx={6} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M6.34 6.34l-1.41-1.41M12 2v2M12 20v2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M2 12h2M20 12h2"/></svg>} label="Administrateurs" desc="Gérer les accès au club" color="#8b5cf6" onClick={() => handleClubAdminFabAction('managers')} />
                    <FabAction idx={7} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Membres" desc="Effectif et rôles" color="#22d96a" onClick={() => handleClubAdminFabAction('roster')} />
                    <FabAction idx={8} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><line x1="12" y1="12" x2="12" y2="12"/></svg>} label="Partenaires" desc="Logos et liens sponsors" color="#f59e0b" onClick={() => handleClubAdminFabAction('sponsors')} />
                    <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 6px' }} />
                    <FabAction idx={9} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} label="Ma page club" desc="Voir la page publique du club" color="#22d96a" onClick={() => { setFabOpen(false); onTabChange?.('mon-club'); }} />
                    <FabAction idx={10} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Mon abonnement" desc="Plan, factures, annulation" color="#8b5cf6" onClick={() => handleClubAdminFabAction('subscription')} />
                  </>
                ) : (
                  <>
                    <FabAction idx={0} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>} label="Créer un événement" color="var(--sl-green)" onClick={() => handleFabAction('event')} />
                    <FabAction idx={1} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Mes entraînements" color="#22c55e" onClick={() => handleFabAction('trainings')} />
                    {!isCoach && (
                      <>
                        <FabAction idx={2} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Mon club" color="var(--sl-blue)" onClick={() => handleFabAction('clubs')} />
                        <FabAction idx={3} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} label="Importer un CSV" color="#a855f7" onClick={() => handleFabAction('csv')} />
                        <FabAction idx={4} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></svg>} label="Voir la carte" color="#f59e0b" onClick={() => handleFabAction('map')} />
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <nav style={{ display: 'flex', alignItems: 'stretch', margin: '8px 12px 12px', borderRadius: 24, background: 'var(--sl-nav-bg)', backdropFilter: 'blur(20px) saturate(160%)', WebkitBackdropFilter: 'blur(20px) saturate(160%)', boxShadow: 'var(--sl-nav-shadow)', border: '1px solid var(--sl-nav-border)', overflow: 'visible', position: 'relative' }}>
        {tabs.map((tab, tabIdx) => {
          if (tab === null) {
            return (
              <div key="fab" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => { hapticLight(); setFabOpen(o => !o); }} aria-label={fabOpen ? 'Fermer le menu rapide' : 'Ouvrir le menu rapide'} aria-expanded={fabOpen} data-demo="fab-add" style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--sl-green)', border: `3px solid var(--sl-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: fabOpen ? '0 0 0 3px rgba(34,217,106,0.35), 0 6px 20px rgba(34,217,106,0.45)' : '0 0 0 1px rgba(34,217,106,0.25), 0 4px 16px rgba(34,217,106,0.4)', position: 'relative', bottom: 10, transition: 'box-shadow 0.2s', zIndex: 10 }}>
                  <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.18 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
            <motion.button key={`${tab.id}-${tabIdx}`} whileTap={{ scale: 0.86 }} whileHover={{ color: active ? activeColor : 'rgba(222,238,255,0.7)' }} onClick={() => { setFabOpen(false); onTabChange(tab.id); }} data-demo={`tab-${tab.id}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px', background: 'transparent', border: 'none', cursor: 'pointer', color, position: 'relative' }}>
              {active && <motion.div layoutId="nav-indicator" style={{ position: 'absolute', top: 0, left: 0, right: 0, width: 28, height: 3, borderRadius: 999, backgroundColor: activeColor, margin: '0 auto' }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <div style={{ position: 'relative' }}>
                {tab.icon(active)}
                {badgeCount > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 16 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 9, lineHeight: 1 }}>{badgeCount > 9 ? '9+' : badgeCount}</span>
                  </motion.div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', letterSpacing: '0.01em', color }}>{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

interface FabActionProps { idx?: number; icon: React.ReactNode; label: string; desc?: string; color: string; onClick: () => void; }
function FabAction({ idx = 0, icon, label, desc, color, onClick }: FabActionProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ backgroundColor: 'var(--sl-hover)' }}
      whileTap={{ scale: 0.97 }}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{desc}</div>}
      </div>
    </motion.button>
  );
}
