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
  const [fabExpanded, setFabExpanded] = useState(false);
  const [fabHintSeen, setFabHintSeen] = useState(() => localStorage.getItem('sl-fab-hint') === 'true');
  const [fabWelcomeSeen, setFabWelcomeSeen] = useState(() => localStorage.getItem('sl-fab-welcome') === 'true');

  useEffect(() => { if (overlayOpen) { setFabOpen(false); setFabExpanded(false); } }, [overlayOpen]);

  useEffect(() => {
    if (fabHintSeen || !canFab) return;
    const t = setTimeout(() => { setFabHintSeen(true); localStorage.setItem('sl-fab-hint', 'true'); }, 5000);
    return () => clearTimeout(t);
  }, [fabHintSeen, canFab]);

  function dismissFabHint() {
    setFabHintSeen(true);
    localStorage.setItem('sl-fab-hint', 'true');
  }

  function dismissFabWelcome() {
    setFabWelcomeSeen(true);
    localStorage.setItem('sl-fab-welcome', 'true');
  }

  const tabs: (TabDef | null)[] = isClubAdminOnly
    ? [HOME, MAP, null, CLUBS, FAVORIS]
    : canFab
    ? [HOME, MAP, null, CLUBS, PROFIL]
    : [HOME, MAP, FAVORIS, CLUBS, PROFIL];

  function handleFabAction(action: string) {
    setFabOpen(false);
    setFabExpanded(false);
    if (action === 'event')     onAddEvent?.();
    if (action === 'csv')       onImportCSV?.();
    if (action === 'trainings') onOpenTrainings?.();
    if (action === 'clubs')     onTabChange?.('clubs');
    if (action === 'map')       onTabChange?.('map');
  }
  function handleClubAdminFabAction(actionId: string) { setFabOpen(false); setFabExpanded(false); onClubAdminAction?.(actionId); }

  return (
    <div style={{ position: 'relative', flexShrink: 0, paddingBottom: 'env(safe-area-inset-bottom, 0px)', background: 'var(--sl-bg)', display: overlayOpen ? 'none' : undefined }}>
      <AnimatePresence>
        {fabOpen && !overlayOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFabOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 1001 }} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 8 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 82px)', left: isClubAdminOnly ? 'calc(50% - 148px)' : 'calc(50% - 124px)', width: isClubAdminOnly ? 296 : 248, zIndex: 1002, backgroundColor: 'var(--sl-card)', borderRadius: 20, border: '1px solid var(--sl-border-s)', boxShadow: 'var(--sl-shadow-xl)', overflow: 'hidden' }}>
              {!fabWelcomeSeen && (
                <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--sl-border)', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>🎯 Votre centre de commande</span>
                    <button onClick={dismissFabWelcome} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: 'var(--sl-t3)', fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0, lineHeight: 1.4 }}>Créez événements, annonces et affiches depuis ici.</p>
                </div>
              )}
              <div style={{ padding: 6 }}>
                {isClubAdminOnly ? (
                  <>
                    {/* Actions principales — toujours visibles */}
                    <FabAction idx={0} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} label="Créer un événement" desc="Match, tournoi, entraînement" color="var(--sl-green)" onClick={() => handleClubAdminFabAction('event')} dataDemo="fab-event" />
                    <FabAction idx={1} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>} label="Envoyer une annonce" desc="Notifier tous les abonnés" color="#3b82f6" onClick={() => handleClubAdminFabAction('announce')} dataDemo="fab-announce" />
                    <FabAction idx={2} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="18" y="3" width="4" height="18"/><rect x="10" y="8" width="4" height="13"/><rect x="2" y="13" width="4" height="8"/></svg>} label="Tableau de bord" desc="Stats et activité du club" color="#6366f1" onClick={() => handleClubAdminFabAction('dashboard')} />
                    <FabAction idx={3} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} label="Ma page club" desc="Voir la page publique du club" color="#22d96a" onClick={() => { setFabOpen(false); setFabExpanded(false); onTabChange?.('mon-club'); }} dataDemo="fab-mon-club" />
                    {/* Bouton Voir toutes les actions */}
                    <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 6px' }} />
                    <motion.button
                      onClick={() => setFabExpanded(e => !e)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, delay: 4 * 0.04 }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'var(--sl-t2)' }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, backgroundColor: 'var(--sl-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div animate={{ rotate: fabExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </motion.div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{fabExpanded ? 'Réduire' : 'Toutes les actions'}</div>
                        {!fabExpanded && <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Modifier la page, membres, partenaires…</div>}
                      </div>
                    </motion.button>
                    {/* Actions secondaires — affichées uniquement si fabExpanded */}
                    <AnimatePresence>
                      {fabExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                          <FabAction idx={0} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Modifier la page" desc="Blocs, design, typographie" color="#f59e0b" onClick={() => handleClubAdminFabAction('edit-page')} />
                          <FabAction idx={1} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Infos du club" desc="Nom, sport, ville, équipes" color="#0ea5e9" onClick={() => handleClubAdminFabAction('edit-info')} />
                          <FabAction idx={2} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>} label="Créer une équipe" desc="Ajouter une catégorie" color="#22d96a" onClick={() => handleClubAdminFabAction('add-team')} />
                          <FabAction idx={3} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M6.34 6.34l-1.41-1.41M12 2v2M12 20v2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M2 12h2M20 12h2"/></svg>} label="Administrateurs" desc="Gérer les accès" color="#8b5cf6" onClick={() => handleClubAdminFabAction('managers')} />
                          <FabAction idx={4} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} label="Membres" desc="Effectif et rôles" color="#22d96a" onClick={() => handleClubAdminFabAction('roster')} />
                          <FabAction idx={5} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><line x1="12" y1="12" x2="12" y2="12"/></svg>} label="Partenaires" desc="Logos et liens sponsors" color="#f59e0b" onClick={() => handleClubAdminFabAction('sponsors')} />
                          <FabAction idx={6} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Mon abonnement" desc="Plan, factures, annulation" color="#8b5cf6" onClick={() => handleClubAdminFabAction('subscription')} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <>
                    <FabAction idx={0} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>} label="Créer un événement" color="var(--sl-green)" onClick={() => handleFabAction('event')} dataDemo="fab-event" />
                    <FabAction idx={1} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Mes entraînements" color="#22c55e" onClick={() => handleFabAction('trainings')} dataDemo="fab-training" />
                    {!isCoach && (
                      <>
                        <FabAction idx={2} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>} label="Mon club" color="var(--sl-blue)" onClick={() => handleFabAction('clubs')} />
                        <FabAction idx={3} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} label="Importer un fichier" color="#a855f7" onClick={() => handleFabAction('csv')} />
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
      <nav style={{ display: 'flex', alignItems: 'stretch', margin: '8px 12px 12px', borderRadius: 24, background: 'var(--sl-nav-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: 'var(--sl-nav-shadow)', border: '1px solid var(--sl-nav-border)', overflow: 'visible', position: 'relative' }}>
        {tabs.map((tab, tabIdx) => {
          if (tab === null) {
            return (
              <div key="fab" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <AnimatePresence>
                  {!fabHintSeen && canFab && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ delay: 0.8, duration: 0.3 }}
                      style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 12, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                    >
                      <div style={{ backgroundColor: 'var(--sl-green)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(34,217,106,0.45)' }}>
                        Appuyez pour créer
                      </div>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="#22d96a"><path d="M5 6L0 0h10z"/></svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!fabHintSeen && canFab && (
                  <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 68, height: 68, borderRadius: '50%', border: '2px solid rgba(34,217,106,0.6)', animation: 'sl-ring-pulse 1.6s ease-out infinite', pointerEvents: 'none' }} />
                )}
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => { hapticLight(); dismissFabHint(); setFabOpen(o => !o); }} aria-label={fabOpen ? 'Fermer le menu rapide' : 'Ouvrir le menu rapide'} aria-expanded={fabOpen} data-demo="fab-add" style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--sl-green)', border: `3px solid var(--sl-bg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: fabOpen ? '0 0 0 3px rgba(34,217,106,0.35), 0 6px 20px rgba(34,217,106,0.45)' : '0 0 0 1px rgba(34,217,106,0.25), 0 4px 16px rgba(34,217,106,0.4)', position: 'relative', bottom: 10, transition: 'box-shadow 0.2s', zIndex: 10 }}>
                  <motion.div animate={{ rotate: fabOpen ? 45 : 0 }} transition={{ duration: 0.18 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </motion.div>
                </motion.button>
              </div>
            );
          }
          const effectiveTab = activeTab === 'mon-club' ? 'clubs' : activeTab;
          const active = effectiveTab === tab.id;
          const activeColor = 'var(--sl-green)';
          const color = active ? activeColor : 'var(--sl-nav-inactive)';
          const badgeCount = badgeCounts[tab.id] || 0;
          return (
            <motion.button key={`${tab.id}-${tabIdx}`} whileTap={{ scale: 0.86 }} whileHover={{ color: active ? activeColor : 'rgba(222,238,255,0.7)' }} onClick={() => { setFabOpen(false); onTabChange(tab.id); }} data-demo={`tab-${tab.id}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 4px', background: 'transparent', border: 'none', cursor: 'pointer', color, position: 'relative' }}>
              {active && <motion.div layoutId="nav-indicator" style={{ position: 'absolute', top: 0, left: 0, right: 0, width: 28, height: 3, borderRadius: 999, backgroundColor: activeColor, margin: '0 auto' }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <div style={{ position: 'relative' }}>
                <motion.div
                  key={active ? 'a' : 'i'}
                  initial={active ? { scale: 0.6, y: 5 } : false}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 22 }}
                >
                  {tab.icon(active)}
                </motion.div>
                {badgeCount > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 16 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 9, lineHeight: 1 }}>{badgeCount > 9 ? '9+' : badgeCount}</span>
                  </motion.div>
                )}
              </div>
              <span className="sl-bottom-nav-label" style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--sl-font-ui)', letterSpacing: '0.01em', color }}>{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

interface FabActionProps { idx?: number; icon: React.ReactNode; label: string; desc?: string; color: string; onClick: () => void; dataDemo?: string; }
function FabAction({ idx = 0, icon, label, desc, color, onClick, dataDemo }: FabActionProps) {
  return (
    <motion.button
      onClick={onClick}
      data-demo={dataDemo}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ backgroundColor: 'var(--sl-hover)' }}
      whileTap={{ scale: 0.97 }}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{desc}</div>}
      </div>
    </motion.button>
  );
}
