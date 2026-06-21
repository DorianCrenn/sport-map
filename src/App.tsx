import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { supabase, setDemoMode, isDemoMode } from './lib/supabase.js';
import { AnimatePresence, motion } from 'framer-motion';
const DemoApp = lazy(() => import('./demo/DemoApp.jsx'));
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { useToast } from './contexts/ToastContext.jsx';
import { SportsProvider } from './contexts/SportsContext.jsx';
import { useLocalEvents } from './hooks/useLocalEvents.js';
import { useBadges } from './hooks/useBadges.js';
import { FavoritesProvider, useFavoritesContext } from './contexts/FavoritesContext.jsx';
import { AttendanceProvider, useAttendanceContext } from './contexts/AttendanceContext.jsx';
import { useClubMatches } from './hooks/useClubMatches.js';
import { useClubs } from './hooks/useClubs.js';
import { useSports } from './hooks/useSports.js';
import { useUpcomingFavorites } from './hooks/useUpcomingFavorites.js';
import { useCommunes } from './hooks/useCommunes.js';
import Header from './components/Header.jsx';
import ReminderBanner from './components/ReminderBanner.jsx';
import BottomNav from './components/BottomNav.jsx';
const ClubPageView   = lazy(() => import('./components/club/ClubPageView.jsx'));
const UserPublicView = lazy(() => import('./components/UserPublicView.jsx'));
import HomeScreen from './pages/HomeScreen.tsx';
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const FavorisPage = lazy(() => import('./pages/FavorisPage.jsx'));
const ClubsPage   = lazy(() => import('./pages/ClubsPage.jsx'));
const ProfilPage  = lazy(() => import('./pages/ProfilPage.jsx'));
const AuthPage    = lazy(() => import('./pages/AuthPage.jsx'));
import ErrorBoundary from './components/ErrorBoundary.jsx';
const AdminPage          = lazy(() => import('./pages/AdminPage.jsx'));
const OnboardingPage     = lazy(() => import('./pages/OnboardingPage.jsx'));
const EventFormModal     = lazy(() => import('./components/EventFormModal.jsx'));
const CSVImportModal     = lazy(() => import('./components/CSVImportModal.jsx'));
const BadgeUnlockModal   = lazy(() => import('./components/BadgeUnlockModal.jsx'));
const MyRidesPage           = lazy(() => import('./pages/MyRidesPage.jsx'));
const TrainingManagerPage   = lazy(() => import('./pages/TrainingManagerPage.jsx'));
const AnnouncementsCenter = lazy(() => import('./components/AnnouncementsCenter.jsx'));
const PosterStudio        = lazy(() => import('./components/PosterStudio.jsx'));
const LegalPage           = lazy(() => import('./pages/LegalPage.jsx'));
import OfflineBanner from './components/OfflineBanner.jsx';
import { useErrorBus } from './lib/errorBus.js';
import HelpFab from './components/HelpFab.jsx';
const HelpPage      = lazy(() => import('./pages/HelpPage.jsx'));
const FeedbackModal = lazy(() => import('./components/FeedbackModal.jsx'));
import { useRideNotifications } from './hooks/useRideNotifications.js';
import { useMyAnnouncements } from './hooks/useMyAnnouncements.js';
import { useManagedClubs } from './hooks/useManagedClubs.js';
import { useAttendeeCountActions } from './contexts/AttendeeCountContext.jsx';
import { useMyConvocations } from './hooks/useMyConvocations.js';
import { useFeedbackNotifications } from './hooks/useFeedbackNotifications.js';
import { useAnalyticsConsent } from './hooks/useAnalyticsConsent.js';
import { useAnalytics } from './hooks/useAnalytics.js';
import ConsentBanner from './components/ConsentBanner.jsx';
import ConvocReplyPanel from './components/ConvocReplyPanel.jsx';
const AdminFeedbackPage    = lazy(() => import('./pages/AdminFeedbackPage.jsx'));
const AdminAnalyticsPage   = lazy(() => import('./pages/AdminAnalyticsPage.jsx'));
const AdminPlansPage       = lazy(() => import('./pages/AdminPlansPage.jsx'));
const AdminLicensesPage    = lazy(() => import('./pages/AdminLicensesPage.jsx'));
const AdminPermissionsPage = lazy(() => import('./pages/AdminPermissionsPage.jsx'));
const AdminAuditLogPage    = lazy(() => import('./pages/AdminAuditLogPage.jsx'));
import SimulatorBanner from './components/SimulatorBanner.jsx';

function ModalLoader() {
  return (
    <>
      <style>{`@keyframes sl-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--sl-bg)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--sl-border)', borderTopColor: 'var(--sl-green)',
          animation: 'sl-spin 0.7s linear infinite',
        }} />
      </div>
    </>
  );
}

function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('sl-sw-update-ready', handler);
    return () => window.removeEventListener('sl-sw-update-ready', handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 10, padding: '9px 14px',
      backgroundColor: '#1a3a2a', borderBottom: '1px solid rgba(34,217,106,0.25)',
      fontSize: 13, color: '#22d96a', flexShrink: 0, zIndex: 200,
    }}>
      <span style={{ fontWeight: 600 }}>Nouvelle version disponible !</span>
      <button
        onClick={() => { if ('serviceWorker' in navigator && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' }); else window.location.reload(); }}
        style={{ padding: '5px 14px', borderRadius: 8, backgroundColor: '#22d96a', color: '#000', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, flexShrink: 0 }}
      >
        Recharger
      </button>
    </div>
  );
}

function AppInner() {
  const { currentUser, isAdmin, isClubAdmin, loading, followedClubs, followClub, isFollowingClub } = useAuth() as any;
  const { isCoachOrManager } = useManagedClubs();
  const { consent, showBanner: showConsentBanner, accept: acceptAnalytics, refuse: refuseAnalytics } = useAnalyticsConsent() as any;
  const { track } = useAnalytics(consent) as any;

  const [activeTab, _setActiveTab] = useState<string>(() => {
    const stored = sessionStorage.getItem('sl-tab') || 'home';
    if (stored === 'news' || stored === 'mon-club') return 'home';
    return stored;
  });
  const setActiveTab = useCallback((tab: string) => {
    sessionStorage.setItem('sl-tab', tab);
    _setActiveTab(tab);
    track('page_view', { tab });
  }, [track]);
  const [activeDepartment] = useState<string>('finistere');
  const [showAuth,     setShowAuth]     = useState(false);
  const [authInitMode, setAuthInitMode] = useState<string>('login');
  const [pendingOnboarding, setPendingOnboarding] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [studioEvent,     setStudioEvent]     = useState<Record<string, any> | null>(null);
  const [studioClub,      setStudioClub]      = useState<Record<string, any> | null>(null);
  const [studioQuickMode, setStudioQuickMode] = useState(false);
  const lastDemoCreatedEventRef = useRef<Record<string, any> | null>(null);

  const { toast } = useToast() as any;
  useErrorBus((msg: string) => {
    toast({
      message: msg,
      type: 'error',
      onReport: () => {
        setErrorForReport({ type: 'bug', title: msg, category: 'crash' });
        setShowFeedback(true);
      },
    });
  });
  const { events: userEvents, loading: eventsLoading, addEvent, addEventsBatch, updateEvent, deleteEvent, archiveSeason } = useLocalEvents() as any;
  const { unreadCount: rideNotifCount } = useRideNotifications() as any;
  const { unreadCount: announcementsUnreadCount } = useMyAnnouncements() as any;
  const { convocations: myConvocations, pendingCount: convocationsPending, respond: respondToConvocation } = useMyConvocations(currentUser?.id) as any;
  const { notifications: feedbackNotifs, unreadCount: feedbackNotifsCount, markRead: markFeedbackNotifRead, markAllRead: markAllFeedbackNotifsRead } = useFeedbackNotifications() as any;
  const [adminSubView, setAdminSubView] = useState<string | null>(null);
  const [showMyRides, setShowMyRides] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback,    setShowFeedback]    = useState(false);
  const [errorForReport,  setErrorForReport]  = useState<Record<string, any> | null>(null);

  const handleErrorReport = useCallback((prefilled: Record<string, any>) => {
    setErrorForReport(prefilled);
    setShowFeedback(true);
  }, []);
  const [showTrainings, setShowTrainings] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [legalSection, setLegalSection] = useState<string | null>(null);
  const [, setClubOverlayOpen] = useState(false);
  const [clubOverlayLoading, setClubOverlayLoading] = useState(false);
  const [publicUserId, setPublicUserId] = useState<string | null>(null);
  const [pendingClubAction, setPendingClubAction] = useState<string | null>(null);
  const [convocReplyToken, setConvocReplyToken] = useState<string | null>(null);

  const allClubsRef = useRef<Record<string, any>[]>([]);
  const demoNavRef  = useRef<Record<string, any>>({});
  const pendingDemoTabRef = useRef<string | null>(null);

  const handleOpenPoster = useCallback((eventData: Record<string, any>, opts: Record<string, any> = {}) => {
    setShowNewEventForm(false);
    const club = allClubsRef.current.find((c: any) => String(c.id) === String(eventData?.club_id || eventData?.clubId)) ?? null;
    setStudioQuickMode(opts.quickMode ?? false);
    setStudioEvent(eventData);
    setStudioClub(club);
    track('poster_opened', { sport: eventData?.sport, eventId: eventData?.id });
  }, [track]);

  const addEventWithToast = useCallback(async (data: Record<string, any>) => {
    try {
      const result = await addEvent(data);
      toast({ message: 'Événement créé !' });
      track('event_created', { sport: data.sport, type: data.type });
      if (isDemoMode()) {
        lastDemoCreatedEventRef.current = result ?? null;
        window.dispatchEvent(new CustomEvent('sl-demo-action', { detail: { type: 'event-created' } }));
      }
      return result;
    } catch (err: any) {
      toast({ message: err.message || 'Erreur lors de la création', type: 'error' });
      throw err;
    }
  }, [addEvent, toast, track]);

  const bulkAddEvents = useCallback(async (events: Record<string, any>[]) => {
    const saved = await addEventsBatch(events);
    toast({ message: `${saved.length} événement${saved.length > 1 ? 's' : ''} importé${saved.length > 1 ? 's' : ''} !` });
    return saved;
  }, [addEventsBatch, toast]);
  const { favorites } = useFavoritesContext() as any;
  const { attending } = useAttendanceContext() as any;
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const hasShownBadge = useRef(false);
  const clubMatchEvents = useClubMatches() as any;
  const { userClubs, updateClub } = useClubs() as any;
  const { allSports } = useSports() as any;
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [selectedSearchClub, setSelectedSearchClub] = useState<Record<string, any> | null>(null);
  const [focusEventId, setFocusEventId] = useState<string | number | null>(null);
  const pendingDeepLink = useRef<string | null>(null);

  const allEvents = useMemo(
    () => [...(userEvents ?? []), ...(clubMatchEvents ?? [])],
    [userEvents, clubMatchEvents]
  );

  const setKnownAttendeeIds = useAttendeeCountActions() as any;
  useEffect(() => {
    if (allEvents.length > 0) {
      setKnownAttendeeIds(allEvents.map((e: any) => String(e.id)));
    }
  }, [allEvents, setKnownAttendeeIds]);

  const allClubs = useMemo(() => userClubs ?? [], [userClubs]);

  allClubsRef.current = allClubs;

  const { earned: earnedBadges, newBadges, markSeen } = useBadges({ attending, allEvents }) as any;

  const pendingEventDeepLink = useRef<string | null>(null);

  // Retour Stripe Checkout (success / cancel)
  useEffect(() => {
    const qp = new URLSearchParams(window.location.search);
    const stripeResult = qp.get('stripe');
    if (stripeResult === 'success') {
      toast({ message: '🎉 Abonnement activé ! Bienvenue dans le plan supérieur.' });
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } else if (stripeResult === 'cancel') {
      toast({ message: 'Paiement annulé. Votre plan n\'a pas changé.', type: 'error' });
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const clubMatch     = window.location.hash.match(/^#club\/(.+)$/);
    const joinMatch     = window.location.hash.match(/^#join\/(.+)$/);
    const convocMatch   = window.location.hash.match(/^#convoc-reply\/([a-f0-9]+)/);
    const eventMatch    = window.location.hash.match(/^#event\/(.+)$/);
    const userMatch     = window.location.hash.match(/^#user\/(.+)$/);
    const legalMatch    = window.location.hash.match(/^#legal(?:\/(\w+))?$/);
    const registerMatch = window.location.hash === '#register';
    if (eventMatch) pendingEventDeepLink.current = eventMatch[1];
    if (userMatch) setPublicUserId(userMatch[1]);
    if (legalMatch) {
      setLegalSection(legalMatch[1] || 'mentions');
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (registerMatch) {
      setAuthInitMode('register');
      setShowAuth(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    if (joinMatch) {
      const id = joinMatch[1];
      // Ouvrir la page club ET auto-suivre si connecté
      window.history.replaceState(null, '', `#club/${id}`);
      supabase.from('clubs').select('*').eq('id', id).maybeSingle()
        .then(({ data }: any) => {
          if (!data) { toast({ message: 'Lien d\'invitation invalide', type: 'error' }); return; }
          const club = { id: data.id, name: data.name, sport: data.sport, city: data.city ?? '', description: data.description ?? '', logoUrl: data.logo_url ?? null, logo: data.logo_url ?? null, website: data.website ?? '', phone: data.phone ?? '', email: data.email ?? '', userId: data.user_id, isUserCreated: true };
          setSelectedSearchClub(club);
          if (currentUser && !isFollowingClub?.(id)) {
            followClub?.(id);
            toast({ message: `Tu suis maintenant ${data.name} ! 🎉` });
          } else if (!currentUser) {
            // Stocker pour auto-follow après connexion
            sessionStorage.setItem('sl-pending-join', id);
          }
        });
    }

    if (convocMatch) {
      const token = convocMatch[1];
      // Auto-enregistrer la réponse si query param ?s=... présent, sinon afficher le panneau
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
      const status = urlParams.get('s');
      if (status && ['accepted', 'declined', 'unavailable'].includes(status)) {
        supabase.from('convocation_reply_tokens')
          .update({ reply_status: status, replied_at: new Date().toISOString() })
          .eq('token', token)
          .then(({ error }: any) => {
            window.history.replaceState(null, '', window.location.pathname);
            if (!error) {
              const labels: Record<string, string> = { accepted: 'Présence confirmée ✅', declined: 'Absence signalée ❌', unavailable: 'Réponse enregistrée 🤔' };
              toast({ message: labels[status] ?? 'Réponse enregistrée' });
              // Mettre à jour la convocation dans event_convocations
              supabase.from('convocation_reply_tokens').select('convocation_id').eq('token', token).maybeSingle()
                .then(({ data: td }: any) => {
                  if (td?.convocation_id) {
                    supabase.from('event_convocations').update({ status }).eq('id', td.convocation_id).then(() => {});
                    window.dispatchEvent(new CustomEvent('sl-analytics', { detail: { type: 'convocation_responded', data: { status } } }));
                  }
                });
            } else {
              toast({ message: 'Lien expiré ou déjà utilisé', type: 'error' });
            }
          });
      } else {
        setConvocReplyToken(token);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    if (clubMatch) {
      const id = clubMatch[1];
      pendingDeepLink.current = id;

      setClubOverlayLoading(true);
      supabase.from('clubs').select('*').eq('id', id).maybeSingle()
        .then(({ data }: any) => {
          setClubOverlayLoading(false);
          if (!data) {
            toast({ message: 'Club introuvable ou lien invalide', type: 'error' });
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
          setSelectedSearchClub({
            id: data.id, name: data.name, sport: data.sport,
            city: data.city ?? '', description: data.description ?? '',
            logoUrl: data.logo_url ?? null, logo: data.logo_url ?? null, website: data.website ?? '',
            phone: data.phone ?? '', email: data.email ?? '',
            userId: data.user_id, isUserCreated: true,
          });
          pendingDeepLink.current = null;
        });
    }
  }, []);

  useEffect(() => {
    if (!pendingDeepLink.current || allClubs.length === 0) return;
    const club = allClubs.find((c: any) => String(c.id) === pendingDeepLink.current);
    if (club) { setSelectedSearchClub(club); pendingDeepLink.current = null; }
  }, [allClubs]);

  useEffect(() => {
    if (!pendingEventDeepLink.current || allEvents.length === 0) return;
    const id = pendingEventDeepLink.current;
    const event = allEvents.find((e: any) => String(e.id) === id);
    if (event) {
      setFocusEventId(event.id);
      setActiveTab('map');
      window.history.replaceState(null, '', window.location.pathname);
      pendingEventDeepLink.current = null;
    } else {
      toast({ message: 'Événement introuvable ou supprimé', type: 'error' });
      window.history.replaceState(null, '', window.location.pathname);
      pendingEventDeepLink.current = null;
    }
  }, [allEvents]);

  useEffect(() => {
    if (selectedSearchClub) {
      window.history.replaceState(null, '', `#club/${selectedSearchClub.id}`);
      document.title = `${selectedSearchClub.name} — SportLink`;
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      document.title = 'SportLink — Le sport près de toi';
    }
  }, [selectedSearchClub]);

  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentUser?.id && !prevUserIdRef.current) {
      track('user_login');
    }
    prevUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id, track]);

  const prevClubCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevClubCountRef.current !== null && allClubs.length > prevClubCountRef.current && !isDemoMode()) {
      track('club_created');
    }
    prevClubCountRef.current = allClubs.length;
  }, [allClubs.length, track]);

  useEffect(() => {
    function handleAnalyticsEvent(e: Event) {
      const { type, data } = (e as CustomEvent).detail ?? {};
      if (type) track(type, data ?? {});
    }
    window.addEventListener('sl-analytics', handleAnalyticsEvent);
    return () => window.removeEventListener('sl-analytics', handleAnalyticsEvent);
  }, [track]);

  useEffect(() => { hasShownBadge.current = false; }, [currentUser?.id]);

  // Auto-follow après connexion si lien #join/:clubId scanné avant login
  useEffect(() => {
    if (!currentUser?.id) return;
    const pendingJoin = sessionStorage.getItem('sl-pending-join');
    if (!pendingJoin) return;
    sessionStorage.removeItem('sl-pending-join');
    if (!isFollowingClub?.(pendingJoin)) {
      followClub?.(pendingJoin);
      supabase.from('clubs').select('name').eq('id', pendingJoin).maybeSingle()
        .then(({ data }: any) => {
          toast({ message: `Tu suis maintenant ${data?.name ?? 'le club'} ! 🎉` });
        });
    }
  }, [currentUser?.id]);
  useEffect(() => {
    if (newBadges.length > 0 && currentUser && !hasShownBadge.current) {
      hasShownBadge.current = true;
      setShowBadgeModal(true);
    }
  }, [newBadges.length, currentUser?.id]);

  const { communes } = useCommunes([activeDepartment]) as any;

  useEffect(() => {
    if (!('setAppBadge' in navigator)) return;
    if (convocationsPending > 0) {
      (navigator as any).setAppBadge(convocationsPending).catch(() => {});
    } else {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, [convocationsPending]);

  demoNavRef.current = { handleTabChange, handleOpenPoster, userEvents, handleClubAdminFabAction };

  useEffect(() => {
    if (!isDemoMode()) return;

    function onDemoNav(e: Event) {
      const { action } = (e as CustomEvent).detail ?? {};
      if (action === 'close-overlay') {
        setShowNewEventForm(false);
        setShowAnnouncements(false);
        setStudioEvent(null);
        setStudioClub(null);
        if (window.location.hash && window.location.hash.length > 1) {
          history.pushState(null, '', window.location.pathname);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    }

    function onCreateAccount() { setAuthInitMode('register'); setShowAuth(true); }

    window.addEventListener('sl-demo-navigate',       onDemoNav);
    window.addEventListener('sl-demo-create-account', onCreateAccount);
    return () => {
      window.removeEventListener('sl-demo-navigate',       onDemoNav);
      window.removeEventListener('sl-demo-create-account', onCreateAccount);
    };
  }, []);

  useEffect(() => {
    if (!isDemoMode() || !pendingDemoTabRef.current || userClubs.length === 0) return;
    const tab = pendingDemoTabRef.current;
    pendingDemoTabRef.current = null;
    handleTabChange(tab);
  }, [userClubs, handleTabChange]);

  const upcomingFavorites = useUpcomingFavorites(allEvents, favorites) as any;

  const navBadges = useMemo(() => {
    const todayCount = upcomingFavorites.today.length;
    const badges: Record<string, number> = {};
    if (todayCount > 0) badges.favoris = todayCount;
    if (convocationsPending > 0) badges.home = convocationsPending;
    return badges;
  }, [upcomingFavorites.today, convocationsPending]);

  const homeStats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
    const thisWeek = allEvents.filter((e: any) => { const d = new Date(e.date); return d >= now && d < weekEnd; }).length;
    return {
      clubs: userClubs?.length ?? 0,
      events: allEvents.length,
      sports: Object.keys(allSports ?? {}).length,
      thisWeek,
    };
  }, [userClubs, allEvents, allSports]);

  const onboardingLocalDone = currentUser ? !!localStorage.getItem(`sl_onboarded_${currentUser.id}`) : false;
  const shouldShowOnboarding = !!currentUser && !loading && (pendingOnboarding || (currentUser.onboardingDone === false && !onboardingLocalDone)) && !showAuth;

  function handleTabChange(tab: string) {
    if (tab === 'profil' && !currentUser) {
      setShowAuth(true);
      return;
    }
    if (tab === 'admin' && !isAdmin) return;
    if (tab === 'mon-club') {
      const myClub = userClubs.find((c: any) =>
        c.userId === currentUser?.id ||
        String(c.id) === String(currentUser?.clubId)
      ) ?? userClubs[0] ?? null;
      if (myClub) {
        setSelectedSearchClub(myClub);
        _setActiveTab('mon-club');
        if (isClubAdmin || isCoachOrManager) {
          setPendingClubAction('dashboard');
        }
      } else {
        setActiveTab('clubs');
      }
      return;
    }
    setSelectedSearchClub(null);
    setActiveTab(tab);
  }

  function handleClubAdminFabAction(actionId: string): boolean {
    const myClub = userClubs.find((c: any) =>
      c.userId === currentUser?.id ||
      String(c.id) === String(currentUser?.clubId)
    ) ?? userClubs[0] ?? null;
    if (myClub) {
      setSelectedSearchClub(myClub);
      _setActiveTab('mon-club');
      setPendingClubAction(actionId);
      return true;
    }
    return false;
  }

  function handleAuthClose() {
    setShowAuth(false);
    setAuthInitMode('login');
  }

  function handleNeedOnboarding() {
    setShowAuth(false);
    setPendingOnboarding(true);
  }

  const [onboardingSport, setOnboardingSport] = useState<string | null>(null);

  function handleOnboardingDone(selectedSports: string[]) {
    setPendingOnboarding(false);
    if (selectedSports?.length > 0) {
      setOnboardingSport(selectedSports[0]);
    }
    setActiveTab('home');
    if (isClubAdmin) {
      toast({ message: 'Bienvenue ! Crée ta première affiche depuis le menu ➕', type: 'info' });
    } else {
      toast({ message: 'Bienvenue sur SportLink ! Explore les clubs et événements autour de toi.', type: 'info' });
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex', height: '100dvh',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--sl-bg)',
    }}>
      <div className="w-11 h-11 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary name="AppShell" onReport={handleErrorReport}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', paddingTop: isDemoMode() ? 'calc(40px + env(safe-area-inset-top, 0px))' : 0 }}>
      <OfflineBanner />
      <UpdateBanner />
      {activeTab !== 'home' && (
        <Header
          cities={communes}
          clubs={allClubs}
          allEvents={allEvents}
          cityFilter={cityFilter}
          onCityFilter={(city: string) => { setCityFilter(city); setActiveTab('map'); }}
          onSelectClub={(club: Record<string, any>) => setSelectedSearchClub(club)}
          onSelectEvent={(event: Record<string, any>) => { setFocusEventId(event.id); setActiveTab('map'); }}
          onClearCity={() => setCityFilter(null)}
          onTabChange={handleTabChange}
          onShowAuth={() => setShowAuth(true)}
          onMyRides={() => setShowMyRides(true)}
          rideNotifCount={rideNotifCount}
          onShowAnnouncements={() => setShowAnnouncements(true)}
          announcementsUnreadCount={announcementsUnreadCount}
        />
      )}

      {activeTab === 'home' && (upcomingFavorites.today.length > 0 || upcomingFavorites.tomorrow.length > 0) && (
        <ReminderBanner
          today={upcomingFavorites.today}
          tomorrow={upcomingFavorites.tomorrow}
          onNavigateToFavoris={() => setActiveTab('favoris')}
        />
      )}

      <main id="main-content" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {activeTab === 'home' && (
              <ErrorBoundary name="Accueil" onReport={handleErrorReport}>
                <HomeScreen
                  followedClubIds={followedClubs}
                  onNavigate={handleTabChange}
                  stats={homeStats}
                  clubs={allClubs}
                  allEvents={allEvents}
                  onOpenTrainings={() => setShowTrainings(true)}
                  externalConvocations={myConvocations}
                  onConvocationRespond={respondToConvocation}
                  onShowLegal={(section: string) => setLegalSection(section || 'mentions')}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'map' && (
              <ErrorBoundary name="Carte" onReport={handleErrorReport}>
                <Suspense fallback={<ModalLoader />}>
                  <MapPage
                    allEvents={allEvents}
                    allClubs={allClubs}
                    activeDepartment={activeDepartment}
                    canAddEvent={isAdmin || isClubAdmin || isCoachOrManager}
                    onAddEvent={addEventWithToast}
                    onUpdateEvent={updateEvent}
                    onDeleteEvent={deleteEvent}
                    onGoToFavoris={() => setActiveTab('favoris')}
                    cityFilter={cityFilter}
                    focusEventId={focusEventId}
                    onFocusDone={() => setFocusEventId(null)}
                    eventsLoading={eventsLoading}
                    initialSportFilter={onboardingSport}
                    onInitialFilterApplied={() => setOnboardingSport(null)}
                  />
                </Suspense>
              </ErrorBoundary>
            )}
            {activeTab === 'favoris' && (
              <ErrorBoundary name="Favoris" onReport={handleErrorReport}>
                <FavorisPage allEvents={allEvents} allClubs={allClubs} onNavigate={setActiveTab} />
              </ErrorBoundary>
            )}
            {activeTab === 'clubs' && (
              <ErrorBoundary name="Clubs" onReport={handleErrorReport}>
                <ClubsPage allEvents={allEvents} onShowAuth={() => setShowAuth(true)} onAddEvent={addEventWithToast} canAddEvent={isAdmin || isClubAdmin || isCoachOrManager} onClubOverlayChange={setClubOverlayOpen} onArchiveSeason={archiveSeason} />
              </ErrorBoundary>
            )}
            {activeTab === 'profil' && (
              <ErrorBoundary name="Profil" onReport={handleErrorReport}>
                <ProfilPage
                  userEvents={userEvents}
                  earnedBadges={earnedBadges}
                  onNavigate={handleTabChange}
                  onShowAuth={() => setShowAuth(true)}
                  onMyRides={() => setShowMyRides(true)}
                  rideNotifCount={rideNotifCount}
                  onMyConvocations={currentUser ? () => setActiveTab('home') : undefined}
                  convocationsPendingCount={convocationsPending}
                  onShowLegal={(section: string) => setLegalSection(section || 'mentions')}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'admin' && isAdmin && (
              <ErrorBoundary name="Admin" onReport={handleErrorReport}>
                <Suspense fallback={<ModalLoader />}>
                  <AdminPage onNavigate={setAdminSubView} />
                </Suspense>
              </ErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>

        {showMyRides && (
          <Suspense fallback={<ModalLoader />}><MyRidesPage onBack={() => setShowMyRides(false)} /></Suspense>
        )}
        {showTrainings && (
          <Suspense fallback={<ModalLoader />}><TrainingManagerPage onBack={() => setShowTrainings(false)} /></Suspense>
        )}
        {clubOverlayLoading && <ModalLoader />}

        {publicUserId && (
          <AnimatePresence>
            <Suspense fallback={<ModalLoader />}>
              <UserPublicView
                key={publicUserId}
                userId={publicUserId}
                onClose={() => {
                  setPublicUserId(null);
                  window.history.replaceState(null, '', window.location.pathname);
                }}
              />
            </Suspense>
          </AnimatePresence>
        )}

        {convocReplyToken && (
          <ConvocReplyPanel token={convocReplyToken} onClose={() => setConvocReplyToken(null)} />
        )}

        {selectedSearchClub && (
          <Suspense fallback={<ModalLoader />}>
            <ClubPageView
              key={selectedSearchClub.id}
              club={selectedSearchClub}
              allEvents={allEvents}
              onBack={() => {
                setSelectedSearchClub(null);
                if (activeTab === 'mon-club') setActiveTab('home');
              }}
              onAddEvent={addEvent}
              canAddEvent={isAdmin || isClubAdmin || isCoachOrManager}
              onArchiveSeason={archiveSeason}
              onUpdateClub={async (data: Record<string, any>) => {
                await updateClub(selectedSearchClub.id, data);
                setSelectedSearchClub((prev: Record<string, any> | null) => prev ? { ...prev, ...data } : prev);
              }}
              initialAction={pendingClubAction}
              onInitialActionConsumed={() => setPendingClubAction(null)}
            />
          </Suspense>
        )}
      </main>

      <AnimatePresence>
        {showConsentBanner && !showAuth && !showHelp && !showFeedback && !studioEvent && (
          <ConsentBanner onAccept={acceptAnalytics} onRefuse={refuseAnalytics} />
        )}
      </AnimatePresence>

      {isAdmin && activeTab === 'admin' && <SimulatorBanner />}

      {isAdmin && activeTab === 'admin' && adminSubView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)' }}>
          <Suspense fallback={<ModalLoader />}>
            {adminSubView === 'feedback'
              ? <AdminFeedbackPage    onBack={() => setAdminSubView(null)} />
              : adminSubView === 'analytics'
              ? <AdminAnalyticsPage   onBack={() => setAdminSubView(null)} />
              : adminSubView === 'plans'
              ? <AdminPlansPage       onBack={() => setAdminSubView(null)} />
              : adminSubView === 'licenses'
              ? <AdminLicensesPage    onBack={() => setAdminSubView(null)} />
              : adminSubView === 'permissions'
              ? <AdminPermissionsPage onBack={() => setAdminSubView(null)} />
              : adminSubView === 'audit-log'
              ? <AdminAuditLogPage    onBack={() => setAdminSubView(null)} />
              : null}
          </Suspense>
        </div>
      )}

      <ErrorBoundary name="BottomNav" onReport={handleErrorReport}>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} badgeCounts={navBadges} onAddEvent={() => setShowNewEventForm(true)} onImportCSV={() => setShowCSVImport(true)} onOpenTrainings={() => setShowTrainings(true)} onClubAdminAction={handleClubAdminFabAction} overlayOpen={showAuth || showNewEventForm || showCSVImport || showAnnouncements || showTrainings || showMyRides || showHelp} />
      </ErrorBoundary>

      <Suspense fallback={<ModalLoader />}>
        <AnimatePresence>
          {showAuth && (
            <AuthPage
              key="auth"
              initialMode={authInitMode}
              onClose={handleAuthClose}
              onNeedOnboarding={handleNeedOnboarding}
              onShowLegal={(section: string) => { setShowAuth(false); setLegalSection(section || 'mentions'); }}
            />
          )}
          {shouldShowOnboarding && (
            <OnboardingPage
              key="onboarding"
              onDone={handleOnboardingDone}
            />
          )}
          {showNewEventForm && (
            <EventFormModal
              key="fab-event-form"
              event={{ _isNew: true }}
              onSave={async (data: Record<string, any>) => {
                const created = await addEventWithToast(data);
                setActiveTab('map');
                if (created?.id) setFocusEventId(created.id);
                return created;
              }}
              onBulkSave={async (events: Record<string, any>[]) => { await bulkAddEvents(events); setShowNewEventForm(false); setActiveTab('map'); }}
              onClose={() => setShowNewEventForm(false)}
              onOpenPoster={handleOpenPoster}
            />
          )}
          {showCSVImport && (
            <CSVImportModal
              key="csv-import"
              onBulkSave={bulkAddEvents}
              onClose={() => setShowCSVImport(false)}
            />
          )}
          {showBadgeModal && newBadges.length > 0 && (
            <BadgeUnlockModal
              key="badge-modal"
              badges={newBadges}
              onDone={() => { markSeen(); setShowBadgeModal(false); }}
            />
          )}
          {showAnnouncements && (
            <AnnouncementsCenter
              key="announcements"
              onClose={() => setShowAnnouncements(false)}
            />
          )}
          {studioEvent && (
            <PosterStudio
              key="global-poster-studio"
              event={studioEvent}
              club={studioClub}
              quickMode={studioQuickMode}
              onClose={() => { setStudioEvent(null); setStudioClub(null); setStudioQuickMode(false); }}
            />
          )}
          {legalSection && (
            <LegalPage
              key="legal"
              initialTab={legalSection}
              onClose={() => {
                setLegalSection(null);
                window.history.replaceState(null, '', window.location.pathname);
              }}
            />
          )}
        </AnimatePresence>
      </Suspense>

      <HelpFab
        onClick={() => setShowHelp(true)}
        hidden={showAuth || showNewEventForm || showCSVImport || showAnnouncements || showTrainings || showMyRides || showHelp || showFeedback || !!studioEvent || !!legalSection}
        notificationCount={feedbackNotifsCount}
      />

      <AnimatePresence>
        {showHelp && (
          <Suspense fallback={null}>
            <HelpPage
              onClose={() => setShowHelp(false)}
              onOpenFeedback={() => { setShowHelp(false); setShowFeedback(true); }}
              notifications={feedbackNotifs}
              unreadCount={feedbackNotifsCount}
              onMarkRead={markFeedbackNotifRead}
              onMarkAllRead={markAllFeedbackNotifsRead}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && (
          <Suspense fallback={null}>
            <FeedbackModal
              onClose={() => { setShowFeedback(false); setErrorForReport(null); }}
              prefilled={errorForReport ?? {}}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

function OAuthPopupCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const p = code
      ? supabase.auth.exchangeCodeForSession(code)
      : Promise.resolve();
    p.finally(() => window.close());
  }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#0a1628', color: 'white', fontSize: 15, fontFamily: 'sans-serif' }}>
      Connexion Google…
    </div>
  );
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (window.opener && (params.has('code') || params.has('error'))) {
    return <OAuthPopupCallback />;
  }

  const isDemo = window.location.pathname.startsWith('/demo');
  if (isDemo && !isDemoMode()) setDemoMode(true);

  return (
    <AuthProvider>
      <SportsProvider>
        <FavoritesProvider>
          <AttendanceProvider>
            {isDemo
              ? (
                <Suspense fallback={
                  <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(160deg, #0a0f1e 0%, #0f1729 50%, #0d1526 100%)',
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      border: '3px solid rgba(99,102,241,0.3)',
                      borderTopColor: '#818cf8',
                      animation: 'sl-spin 0.7s linear infinite',
                    }} />
                    <style>{`@keyframes sl-spin { to { transform: rotate(360deg) } }`}</style>
                  </div>
                }>
                  <DemoApp AppInner={AppInner} />
                </Suspense>
              )
              : <AppInner />
            }
          </AttendanceProvider>
        </FavoritesProvider>
      </SportsProvider>
    </AuthProvider>
  );
}
