import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import { useDynamicMeta } from '../../hooks/useDynamicMeta.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  useClubPage, useClubAnalytics, getHeroBackground,
} from '../../hooks/useClubPage.js';
import { supabase } from '../../lib/supabase.js';
import FollowModal from '../FollowModal.jsx';
import ClubManagersPanel from './ClubManagersPanel.jsx';
import ClubDashboard from './ClubDashboard.jsx';
import ClubRosterPanel from './ClubRosterPanel.jsx';
import ClubSponsorsPanel from './ClubSponsorsPanel.jsx';
import SendAnnouncementModal from './SendAnnouncementModal.jsx';
import { useClubAnnouncements } from '../../hooks/useClubAnnouncements.js';
import ClubFormModal from './ClubFormModal.jsx';
import QuickAddTeamModal from './QuickAddTeamModal.jsx';
import { getRows } from './ClubPageBuilder.jsx';
import SubscriptionExpiryBanner from '../ui/SubscriptionExpiryBanner.jsx';
import { useClubManagers } from '../../hooks/useClubManagers.js';
import { useClubTrainings } from '../../hooks/useClubTrainings.js';
import { useShare } from '../../hooks/useShare.js';
import { useClubEvents } from '../../hooks/useClubEvents.js';
import { useClubPlan } from '../../hooks/useClubPlan.js';
import { downloadClubICS } from '../../utils/exportICS.js';

// New UI components
import ClubHero, { OverflowMenu } from './ClubHero.jsx';
import ClubAdminDrawer from './ClubAdminDrawer.jsx';
import ClubHomeTab from './tabs/ClubHomeTab.jsx';
import ClubNewsTab from './tabs/ClubNewsTab.jsx';
import ClubMatchesTab from './tabs/ClubMatchesTab.jsx';
import ClubRosterTab from './tabs/ClubRosterTab.jsx';
import ClubInfoTab from './tabs/ClubInfoTab.jsx';

const EventFormModal = lazy(() => import('../EventFormModal.jsx'));
const PosterStudio   = lazy(() => import('../PosterStudio.jsx'));


// ── Tabs config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'accueil',  label: 'Accueil' },
  { id: 'news',     label: 'Actualités' },
  { id: 'matchs',   label: 'Matchs' },
  { id: 'effectif', label: 'Effectif' },
  { id: 'infos',    label: 'Infos' },
];

// ── Tab navigation ─────────────────────────────────────────────────────────────
function TabNav({ activeTab, onTabChange, accentColor, announcementsCount }) {
  return (
    <div style={{
      flexShrink: 0, position: 'relative',
      backgroundColor: 'var(--sl-card)',
      borderBottom: '1px solid var(--sl-border)',
    }}>
      {/* Indicateur overflow droite */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, zIndex: 1,
        background: 'linear-gradient(to left, var(--sl-card), transparent)',
        pointerEvents: 'none',
      }} />
    <div style={{
      display: 'flex', overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={isActive}
            style={{
              flexShrink: 0, padding: '11px 14px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--sl-t1)' : 'var(--sl-t3)',
              borderBottom: `2.5px solid ${isActive ? accentColor : 'transparent'}`,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              position: 'relative',
              minHeight: 44,
            }}
          >
            {tab.label}
            {tab.id === 'news' && announcementsCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 4,
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: '#ef4444',
              }} />
            )}
          </button>
        );
      })}
      <div style={{ flexShrink: 0, width: 8 }} />
    </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClubPageView({
  club, allEvents, onBack, onAddEvent,
  canAddEvent: canAddEventProp, onUpdateClub, onArchiveSeason,
  initialAction, onInitialActionConsumed,
}) {
  const { allSports: SPORTS } = useSports();
  const { toast } = useToast();
  const {
    isAdmin, isClubAdmin, currentUser, isLoggedIn,
    followClub, updateFollow, isFollowingClub, getFollow,
  } = useAuth();
  const { share } = useShare();

  // ── Permissions ────────────────────────────────────────────────────────────
  const isOwner = isAdmin
    || club.userId === currentUser?.id
    || (isClubAdmin && currentUser?.clubId === club.id);
  const { managers, addManager, removeManager, updateManagerRole, isManager } = useClubManagers(club.id);
  const canEdit     = isOwner || isManager(currentUser?.email);
  const canAddEvent = (canAddEventProp ?? (isAdmin || isClubAdmin)) || isManager(currentUser?.email);

  const { periodEnd: clubPeriodEnd, plan: clubPlan, planMeta: clubPlanMeta } = useClubPlan(club.id);

  // ── Follow state ───────────────────────────────────────────────────────────
  const isFollowing = isFollowingClub(club.id);
  const currentFollow = getFollow(club.id);
  const [loginHint,  setLoginHint]  = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [heroMenuOpen, setHeroMenuOpen] = useState(false);

  // ── Page blocks ────────────────────────────────────────────────────────────
  const {
    blocks, isEditing, setIsEditing,
    addBlock, addBlockToRow,
    updateBlock, setBlockSpan, moveBlockInRow,
    deleteBlock, reorderRows, toggleBlock,
    typography, theme,
  } = useClubPage(club);

  useClubAnalytics(club.id);
  const rows = useMemo(() => getRows(blocks), [blocks]);

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('accueil');
  const [simpleMode, setSimpleMode] = useState(() => blocks.length === 0);
  const [openMenuAfter, setOpenMenuAfter] = useState(null);

  // ── Modals state ───────────────────────────────────────────────────────────
  // Panel/modal actif — null | 'followModal' | 'adminDrawer' | 'addTeam' | 'dashboard'
  //   | 'managersPanel' | 'rosterPanel' | 'sponsorsPanel' | 'announcement' | 'editInfo' | 'poster'
  const [modal, setModal] = useState(null);
  const showFollowModal   = modal === 'followModal';
  const showAdminDrawer   = modal === 'adminDrawer';
  const showAddTeam       = modal === 'addTeam';
  const showDashboard     = modal === 'dashboard';
  const showManagersPanel = modal === 'managersPanel';
  const showRosterPanel   = modal === 'rosterPanel';
  const showSponsorsPanel = modal === 'sponsorsPanel';
  const showAnnouncement  = modal === 'announcement';
  const showEditInfo      = modal === 'editInfo';
  const showPoster        = modal === 'poster';
  const [teamEventModal, setTeamEventModal] = useState(undefined);

  const checklistKey = `sl-club-checklist-dismissed-${club.id}`;
  const [checklistDismissed, setChecklistDismissed] = useState(() => !!localStorage.getItem(checklistKey));

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { announcements, sendAnnouncement } = useClubAnnouncements(club.id);
  const [teamTrainings, setTeamTrainings] = useClubTrainings(club.id);

  // ── Live events ────────────────────────────────────────────────────────────
  const liveEvents = useClubEvents(club.id, club.name ?? '');
  const effectiveEvents = useMemo(() => {
    if (!liveEvents.length) return allEvents ?? [];
    const liveIds = new Set(liveEvents.map(e => e.id));
    return [...liveEvents, ...(allEvents ?? []).filter(e => !liveIds.has(e.id))];
  }, [liveEvents, allEvents]);

  const clubEventIds = useMemo(
    () => effectiveEvents.filter(e => String(e.clubId) === String(club.id)).map(e => e.id),
    [effectiveEvents, club.id]
  );

  const allTeams = useMemo(
    () => (club.categories ?? []).flatMap(c => c.teams ?? []),
    [club.categories]
  );

  // ── Visual ────────────────────────────────────────────────────────────────
  const sportData = SPORTS[club.sport];
  const accentColor = theme.accent ?? sportData?.color ?? '#22C55E';
  const heroBackground = getHeroBackground(theme.primary, accentColor, theme.heroStyle ?? 'solid');

  // Comptage des matchs de la saison en cours (août N → juillet N+1)
  const seasonMatchesCount = useMemo(() => {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear() - (now.getMonth() < 7 ? 1 : 0), 7, 1);
    return effectiveEvents.filter(e =>
      String(e.clubId) === String(club.id) && new Date(e.date) >= seasonStart
    ).length;
  }, [effectiveEvents, club.id]);

  const posterEvent = useMemo(() => {
    const now = new Date();
    const next = effectiveEvents
      .filter(e => String(e.clubId) === String(club.id) && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    return next ?? {
      id: `club-poster-${club.id}`,
      sport: club.sport, title: club.name,
      date: new Date(new Date().getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16),
      city: club.city, eventType: 'friendly',
    };
  }, [effectiveEvents, club]);

  // ── SEO ───────────────────────────────────────────────────────────────────
  const clubUrl = `${window.location.origin}/clubs/${club.id}`;
  useDynamicMeta({
    title: club.name,
    description: club.description || `${club.name} — club de ${club.sport}${club.city ? ` à ${club.city}` : ''}`,
    image: club.logo_url || undefined,
    url: clubUrl,
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const key = `cpv_${club.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    supabase.from('club_page_views').insert({
      club_id: String(club.id), user_id: currentUser?.id ?? null, session_id: key,
    }).then(() => {});
  }, [club.id, currentUser?.id]);

  // Reset editing if user loses permissions
  useEffect(() => {
    if (!canEdit && isEditing) setIsEditing(false);
  }, [canEdit, isEditing, setIsEditing]);

  // Android back — ne ferme ClubPageView que si aucun sous-panel ouvert
  useAndroidBack(true, () => {
    if (modal || teamEventModal) return;
    onBack?.();
  });

  // Fermeture via Escape — ne ferme que si aucun sous-panel n'est ouvert
  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return;
      if (modal || teamEventModal) return;
      onBack?.();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onBack, modal, teamEventModal]);

  // ── Event handlers ─────────────────────────────────────────────────────────
  async function handleShare() {
    const result = await share({ title: club.name, text: `${club.name} — ${club.city}`, url: clubUrl });
    if (result.success) { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2200); }
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(`${window.location.origin}#club/${club.id}`)
      .then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2200); });
  }

  function handleFollow() {
    if (isLoggedIn) {
      setModal('followModal');
    } else {
      setLoginHint(true);
      setTimeout(() => setLoginHint(false), 2200);
    }
  }

  function handleCreateClubEvent() {
    setTeamEventModal({ _isNew: true, defaultSport: club.sport, defaultCity: club.city, defaultHomeOrAway: 'home' });
  }

  function handleAddEventForTeam(team) {
    const cat = (club.categories ?? []).find(c => c.teams?.some(t => t.id === team.id));
    setTeamEventModal({
      _isNew: true, defaultTeam: team.name,
      defaultCategory: cat?.name ?? '', defaultLevel: team.level ?? '',
      defaultSport: club.sport, defaultCity: club.city, defaultHomeOrAway: 'home',
    });
  }

  function handleAdminAction(actionId) {
    switch (actionId) {
      case 'dashboard':         setModal('dashboard'); break;
      case 'open-matchs-tab':  setActiveTab('matchs'); break;
      case 'open-news-announce': setActiveTab('news'); setModal('announcement'); break;
      case 'edit-page':       setIsEditing(e => !e); setActiveTab('accueil'); break;
      case 'event':       handleCreateClubEvent(); break;
      case 'announce':    setModal('announcement'); break;
      case 'edit-info':   setModal('editInfo'); break;
      case 'managers':    setModal('managersPanel'); break;
      case 'roster':      setModal('rosterPanel'); break;
      case 'add-team':    setModal('addTeam'); break;
      case 'sponsors':    setModal('sponsorsPanel'); break;
    }
  }

  useEffect(() => {
    if (!initialAction) return;
    handleAdminAction(initialAction);
    onInitialActionConsumed?.();
  }, [initialAction]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guard : club introuvable (deep link invalide ou club supprimé) ────────
  if (!club?.id) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: 'var(--sl-t2)', backgroundColor: 'var(--sl-bg)' }}>
        <span style={{ fontSize: 36 }}>🏟️</span>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', margin: 0 }}>Club introuvable</p>
        <p style={{ fontSize: 13, margin: 0 }}>Ce club n'existe pas ou a été supprimé.</p>
        <button onClick={onBack} style={{ marginTop: 4, padding: '10px 22px', borderRadius: 12, background: 'var(--sl-surface)', border: '1px solid var(--sl-border)', cursor: 'pointer', color: 'var(--sl-t1)', fontSize: 14, fontWeight: 600 }}>Retour</button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        overflowY: 'auto', overflowX: 'hidden',
        overscrollBehavior: 'contain',
        backgroundColor: 'var(--sl-bg)',
        fontFamily: `"${typography.bodyFont}", sans-serif`,
      }}
      role="main"
      aria-label={`Page du club ${club.name ?? ''}`}
    >

      {/* ── Hero ── */}
      <ClubHero
        club={club}
        accentColor={accentColor}
        heroBackground={heroBackground}
        isFollowing={isFollowing}
        onBack={onBack}
        onFollow={handleFollow}
        onShare={handleShare}
        matchesCount={seasonMatchesCount}
        onViewOnMap={(club.lat && club.lng) ? onBack : undefined}
        onMenuOpen={() => setHeroMenuOpen(true)}
      />

      {/* Login hint tooltip */}
      {loginHint && (
        <div style={{
          position: 'absolute', top: 120, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15,23,42,0.95)', color: '#f1f5f9',
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          padding: '7px 14px', borderRadius: 10, zIndex: 100,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          Connecte-toi pour suivre ce club
        </div>
      )}

      {/* Subscription banner */}
      {isOwner && (
        <div style={{ position: 'sticky', top: 0, zIndex: 14 }}>
          <SubscriptionExpiryBanner
            periodEnd={clubPeriodEnd}
            planId={clubPlan}
            planName={clubPlanMeta?.name}
            compact
          />
        </div>
      )}

      {/* Indicateur édition en haut — boutons déplacés dans la barre fixe du bas */}
      {isEditing && (
        <div style={{
          flexShrink: 0, padding: '7px 16px',
          backgroundColor: '#d97706',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.9 }}>
            {simpleMode ? 'Mode rapide' : 'Mode avancé — glissez pour réordonner'}
          </span>
        </div>
      )}

      {/* ── Tab Navigation (sticky) ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 15 }}>
        <TabNav
          activeTab={activeTab}
          onTabChange={tab => { setActiveTab(tab); setOpenMenuAfter(null); }}
          accentColor={accentColor}
          announcementsCount={announcements.length}
        />
      </div>

      {/* ── Tab content ── */}
      <div style={{ minHeight: 0 }}>
        {activeTab === 'accueil' && (
          <ClubHomeTab
            club={club}
            blocks={blocks}
            rows={rows}
            isEditing={isEditing}
            simpleMode={simpleMode}
            accentColor={accentColor}
            openMenuAfter={openMenuAfter}
            onSetOpenMenuAfter={setOpenMenuAfter}
            effectiveEvents={effectiveEvents}
            announcements={announcements}
            canEdit={canEdit}
            checklistDismissed={checklistDismissed}
            onDismissChecklist={() => { localStorage.setItem(checklistKey, '1'); setChecklistDismissed(true); }}
            onEditPage={() => { setIsEditing(true); setActiveTab('accueil'); }}
            onCreateEvent={handleCreateClubEvent}
            onSendAnnouncement={() => setModal('announcement')}
            onTabChange={setActiveTab}
            updateBlock={updateBlock}
            deleteBlock={deleteBlock}
            toggleBlock={toggleBlock}
            setBlockSpan={setBlockSpan}
            moveBlockInRow={moveBlockInRow}
            addBlockToRow={addBlockToRow}
            addBlock={addBlock}
            reorderRows={reorderRows}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'news' && (
          <ClubNewsTab
            announcements={announcements}
            canEdit={canEdit}
            onNewAnnouncement={() => setModal('announcement')}
          />
        )}

        {activeTab === 'matchs' && (
          <ClubMatchesTab
            effectiveEvents={effectiveEvents}
            club={club}
            accentColor={accentColor}
            canAddEvent={canAddEvent && !!onAddEvent}
            onCreateEvent={handleCreateClubEvent}
          />
        )}

        {activeTab === 'effectif' && (
          <ClubRosterTab
            club={club}
            allTeams={allTeams}
            blocks={blocks}
            isEditing={isEditing}
            updateBlock={updateBlock}
            addBlock={addBlock}
            effectiveEvents={effectiveEvents}
            trainings={teamTrainings}
            onUpdateTrainings={setTeamTrainings}
            onAddEventForTeam={handleAddEventForTeam}
            canAddEvent={canAddEvent && !!onAddEvent}
            onBulkAddTrainingEvents={async (events) => {
              for (const ev of events) await onAddEvent?.({ ...ev, clubId: club.id });
            }}
            currentUser={currentUser}
            accentColor={accentColor}
            canEdit={canEdit}
            onUpdateClub={onUpdateClub ? async (patch) => {
              await onUpdateClub({ ...club, ...patch });
            } : undefined}
          />
        )}

        {activeTab === 'infos' && (
          <ClubInfoTab club={club} accentColor={accentColor} />
        )}
      </div>

      {/*
        ── Contrôles flottants — position:sticky dans le conteneur scroll ──
        Contrairement à position:fixed (viewport global), position:sticky colle
        au bas de la zone visible de CE conteneur (ClubPageView overflow-y:auto).
        Le FAB et la barre d'édition restent donc strictement dans la page du club,
        sans jamais déborder sur la BottomNav ou d'autres éléments de navigation.
      */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 30, pointerEvents: 'none' }}>

        {/* Admin FAB */}
        {canEdit && !isEditing && !showAdminDrawer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 16px calc(20px + env(safe-area-inset-bottom, 0px)) 0', pointerEvents: 'none' }}>
            <motion.button
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setModal('adminDrawer')}
              aria-label="Ouvrir les outils d'administration"
              style={{
                pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 18px', borderRadius: 18, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                backgroundColor: 'rgba(15,23,42,0.92)',
                color: '#cbd5e1',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
              Admin
            </motion.button>
          </div>
        )}

        {/* Barre édition */}
        {isEditing && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              pointerEvents: 'auto',
              backgroundColor: '#d97706',
              padding: '10px 14px',
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', opacity: 0.9, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ✏️ {simpleMode ? 'Mode rapide' : 'Mode avancé'}
            </span>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setSimpleMode(v => !v)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff',
                  whiteSpace: 'nowrap',
                }}
              >
                {simpleMode ? '⚡ Avancé' : '○ Rapide'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setOpenMenuAfter(null); }}
                style={{
                  fontSize: 12, fontWeight: 800, padding: '6px 16px', borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.95)', color: '#d97706',
                  whiteSpace: 'nowrap',
                }}
              >
                ✓ Terminé
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Overflow menu du hero (⋯) — rendu ICI, après le sticky FAB,
            pour garantir qu'il s'affiche par-dessus dans l'ordre du DOM ── */}
      <OverflowMenu
        open={heroMenuOpen}
        onClose={() => setHeroMenuOpen(false)}
        items={[
          { icon: '🔗', label: linkCopied ? 'Lien copié !' : 'Copier le lien', action: handleCopyLink },
          { icon: '📤', label: 'Partager', action: handleShare },
          { icon: '🎨', label: "Créer l'affiche", action: () => setModal('poster') },
          { icon: '📅', label: 'Exporter le calendrier', action: () => {
            const upcoming = effectiveEvents.filter(e => e.clubId === club.id && new Date(e.date) >= new Date());
            downloadClubICS(upcoming, club.name);
          }},
          ...(club.email ? [{ icon: '✉️', label: `Contacter ${club.name}`, action: () => window.open(`mailto:${club.email}`) }] : []),
        ]}
      />

      {/* ── Quick Add Team ── */}
      <AnimatePresence>
        {showAddTeam && onUpdateClub && (
          <QuickAddTeamModal
            club={club}
            onSave={async (patch) => { await onUpdateClub({ ...club, ...patch }); setModal(null); }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Drawer ── */}
      <ClubAdminDrawer
        open={showAdminDrawer}
        onClose={() => setModal(null)}
        onAction={handleAdminAction}
        isEditing={isEditing}
      />

      {/* ── Modals ── */}

      {/* Edit club info */}
      {showEditInfo && onUpdateClub && (
        <ClubFormModal
          club={club}
          onSave={async (data) => { await onUpdateClub(data); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Event creation */}
      {teamEventModal !== undefined && (
        <Suspense fallback={null}>
          <EventFormModal
            event={teamEventModal}
            onSave={formData => { onAddEvent?.({ ...formData, clubId: club.id }); setTeamEventModal(undefined); }}
            onBulkSave={async events => { for (const ev of events) await onAddEvent?.({ ...ev, clubId: club.id }); setTeamEventModal(undefined); }}
            onClose={() => setTeamEventModal(undefined)}
          />
        </Suspense>
      )}

      {/* Poster studio */}
      {showPoster && (
        <Suspense fallback={null}>
          <PosterStudio event={posterEvent} club={club} onClose={() => setModal(null)} />
        </Suspense>
      )}

      {/* Managers panel */}
      {showManagersPanel && (
        <ClubManagersPanel
          managers={managers}
          ownerEmail={currentUser?.email}
          ownerName={currentUser?.name}
          onAdd={addManager}
          onRemove={removeManager}
          onRoleChange={updateManagerRole}
          onClose={() => setModal(null)}
        />
      )}

      {/* Roster panel */}
      {showRosterPanel && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, backgroundColor: 'var(--sl-card)' }}>
            <button
              onClick={() => setModal(null)}
              aria-label="Retour"
              style={{ width: 40, height: 40, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>Membres</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            <ClubRosterPanel
              clubId={String(club.id)}
              teams={allTeams}
              club={canEdit ? club : undefined}
              onUpdateClub={canEdit && onUpdateClub ? async (patch) => {
                await onUpdateClub({ ...club, ...patch });
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Sponsors panel */}
      {showSponsorsPanel && (
        <ClubSponsorsPanel
          clubId={String(club.id)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Follow modal */}
      {showFollowModal && (
        <FollowModal
          club={club}
          allEvents={effectiveEvents}
          currentFollow={currentFollow}
          onSave={(options) => {
            if (isFollowing) {
              updateFollow(club.id, options);
            } else {
              followClub(club.id, options);
              toast({ message: `Tu suis maintenant ${club.name} ! Les annonces apparaîtront dans ton fil.`, type: 'success' });
            }
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Announcement modal */}
      <AnimatePresence>
        {showAnnouncement && (
          <SendAnnouncementModal
            key="send-announcement"
            club={club}
            onSend={async (data) => {
              await sendAnnouncement(data);
              const msg = data.scheduledFor
                ? 'Annonce programmée avec succès'
                : 'Annonce envoyée à tes abonnés !';
              toast({ message: msg, type: 'success' });
            }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Dashboard */}
      <AnimatePresence>
        {showDashboard && (
          <ClubDashboard
            key="club-dashboard"
            club={club}
            clubEventIds={clubEventIds}
            allEvents={effectiveEvents}
            onArchiveSeason={onArchiveSeason}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
