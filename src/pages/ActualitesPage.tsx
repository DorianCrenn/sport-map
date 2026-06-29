import { lazy, Suspense, useMemo, useCallback, useState, useEffect } from 'react';
import { useAuth }          from '../contexts/AuthContext.jsx';
import { useManagedClubs }  from '../hooks/useManagedClubs.js';
import { useQuickActions }  from '../hooks/useQuickActions.js';
import { useDemoFeed }      from '../hooks/useDemoFeed.js';
import { isDemoMode, supabase } from '../lib/supabase.js';
import LiveMultiplexSection  from '../components/home/LiveMultiplexSection.jsx';
import HypeBar               from '../components/home/HypeBar.jsx';
import StreakWidget           from '../components/home/StreakWidget.jsx';
import PlanningTimeline      from '../components/planning/PlanningTimeline.jsx';
import PosterFeatureStrip    from '../components/home/PosterFeatureStrip.jsx';
import DiscoveryClubs        from '../components/home/DiscoveryClubs.jsx';
import PosterShowcase        from '../components/planning/PosterShowcase.jsx';

const PosterStudio             = lazy(() => import('../components/PosterStudio.jsx'));
const EventFormStepConvocation = lazy(() => import('../components/event/EventFormStepConvocation.jsx'));

interface ActualitesPageProps {
  followedClubIds?: string[];
  onNavigate?: (page: string) => void;
}

export default function ActualitesPage({
  followedClubIds = [],
  onNavigate,
}: ActualitesPageProps) {
  const { currentUser, isAdmin, isClubAdmin, loading: authLoading } = useAuth() as any;
  const { managedClubs, isCoachOrManager, isCommunicant } = useManagedClubs() as any;
  const demo = isDemoMode();

  const managedClubIds = useMemo(() => managedClubs.map((c: any) => String(c.id)), [managedClubs]);
  const feedClubIds    = useMemo(
    () => [...new Set([...followedClubIds.map(String), ...managedClubIds])],
    [followedClubIds, managedClubIds],
  );

  const { demoLiveMatches } = useDemoFeed() as any;
  const quickActions        = useQuickActions({
    currentUser,
    managedClubs,
    followedClubIds: feedClubIds,
    isCoachOrManager,
    isCommunicant,
  }) as any;
  const effectiveLiveMatches = demo ? demoLiveMatches : quickActions.liveMatches;

  const allKnownClubs = useMemo(() => {
    const map: Record<string, any> = {};
    managedClubs.forEach((c: any) => { map[String(c.id)] = c; });
    return Object.values(map);
  }, [managedClubs]);

  const [studioConfig,     setStudioConfig]     = useState<Record<string, any> | null>(null);
  const [convocationEvent, setConvocationEvent] = useState<Record<string, any> | null>(null);

  // En mode démo, fermer les overlays locaux quand DemoApp demande close-overlay
  useEffect(() => {
    if (!demo) return;
    function onDemoNav(e: Event) {
      if (((e as CustomEvent).detail?.action) === 'close-overlay') {
        setConvocationEvent(null);
        setStudioConfig(null);
      }
    }
    window.addEventListener('sl-demo-navigate', onDemoNav);
    return () => window.removeEventListener('sl-demo-navigate', onDemoNav);
  }, [demo]);

  const handleOpenPoster = useCallback(async ({ event, score, mode }: { event: any; score: any; mode: string }) => {
    let convPlayers: string[] | null = null;
    if (mode === 'convocation' && event?.id) {
      const { data: convocRows } = await supabase
        .from('event_convocations').select('player_id').eq('event_id', event.id).eq('status', 'accepted');
      const playerIds = (convocRows ?? []).map((r: any) => r.player_id);
      if (playerIds.length) {
        const { data: playerRows } = await supabase.from('club_players').select('name').in('id', playerIds);
        convPlayers = (playerRows ?? []).map((p: any) => p.name);
      } else {
        convPlayers = [];
      }
    }
    setStudioConfig({ event, resultMode: score ?? null, quickMode: !!score, convocationPlayers: convPlayers });
  }, []);

  // Ne pas décider isNewUser tant que l'auth charge (évite un flash "nouveau compte")
  const isNewUser = !demo && !authLoading && feedClubIds.length === 0 && !isCoachOrManager && !isClubAdmin && !isAdmin;

  // Skeleton pendant le chargement auth (évite le flash "nouveau compte")
  if (authLoading && !demo) {
    return (
      <div className="flex flex-col h-full bg-[var(--sl-bg)]" style={{ padding: '16px 16px 0' }}>
        <div className="h-7 rounded-full animate-pulse bg-[var(--sl-surface)] mb-4" style={{ width: '60%' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl animate-pulse bg-[var(--sl-surface)] mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-[var(--sl-bg)] overflow-y-auto overscroll-contain"
      data-demo="agenda-section"
    >
      {/* ══ Empty state — nouveau compte sans club suivi ═══════════════════ */}
      {isNewUser && (
        <div style={{ padding: '32px 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Titre */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10, lineHeight: 1 }}>👋</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: 'var(--sl-t1)', fontFamily: "'Barlow Condensed', sans-serif" }}>
              Bienvenue sur SportLink
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--sl-t2)', lineHeight: 1.55, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
              Suivez des clubs pour voir leurs matchs, résultats et annonces ici.
            </p>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', label: 'Carte des événements' },
              { icon: '📅', label: 'Calendrier des clubs' },
              { icon: '🎨', label: 'Affiches sportives' },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 20,
                backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
                fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)',
              }}>
                {icon} {label}
              </div>
            ))}
          </div>

          {/* Discovery clubs */}
          <DiscoveryClubs onNavigate={onNavigate} />

          {/* Poster showcase */}
          <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 20 }}>
            <PosterShowcase onOpenPoster={handleOpenPoster ? () => handleOpenPoster({ event: null, score: null, mode: 'create' }) : undefined} />
          </div>

          {/* CTA "Tous les clubs" */}
          <button
            onClick={() => onNavigate?.('clubs')}
            style={{
              backgroundColor: 'transparent', color: 'var(--sl-t2)',
              padding: '12px 20px', borderRadius: 12, fontWeight: 600,
              border: '1px solid var(--sl-border)', cursor: 'pointer', fontSize: 13,
            }}
          >
            Voir tous les clubs →
          </button>
        </div>
      )}

      {/* ══ HypeBar — ticker activité ════════════════════════════════════════ */}
      {!isNewUser && (
        <HypeBar
          liveCount={effectiveLiveMatches.length}
        />
      )}

      {/* ══ Streak quotidien ════════════════════════════════════════════════ */}
      {!isNewUser && currentUser && (
        <div style={{ padding: '10px 16px 0' }}>
          <StreakWidget />
        </div>
      )}

      {/* ══ Studio d'affiches — strip toujours visible ═══════════════════════ */}
      {!isNewUser && (
        <PosterFeatureStrip
          onOpen={handleOpenPoster ? () => handleOpenPoster({ event: null, score: null, mode: 'create' }) : undefined}
        />
      )}

      {/* ══ Multiplex EN DIRECT ══════════════════════════════════════════════ */}
      {!isNewUser && <LiveMultiplexSection liveMatches={effectiveLiveMatches} />}

      {/* ══ Planning de la Saison ════════════════════════════════════════════ */}
      {!isNewUser && (
        <PlanningTimeline
          currentUser={currentUser}
          managedClubs={managedClubs}
          isCoachOrManager={isCoachOrManager}
          isCommunicant={isCommunicant}
          isClubAdmin={isClubAdmin}
          isAdmin={isAdmin}
          followedClubIds={feedClubIds}
          clubs={allKnownClubs}
          onOpenPoster={handleOpenPoster}
          onConvocate={(event: any) => setConvocationEvent(event)}
          onNavigateRides={() => onNavigate?.('rides')}
        />
      )}

      {/* Modale convocation (depuis cartes match) */}
      {convocationEvent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9500,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setConvocationEvent(null); }}
        >
          <div style={{
            backgroundColor: 'var(--sl-card)',
            borderRadius: '20px 20px 0 0',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}>
            {/* Poignée drag + bouton fermer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 16px 0', flexShrink: 0 }}>
              <button
                onClick={() => setConvocationEvent(null)}
                style={{
                  width: 44, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: 'var(--sl-t3)' }}>Chargement…</div>}>
              <EventFormStepConvocation
                event={convocationEvent}
                onDone={() => setConvocationEvent(null)}
                onClose={() => setConvocationEvent(null)}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* PosterStudio (depuis cartes match) */}
      {studioConfig && (
        <Suspense fallback={null}>
          <PosterStudio
            event={studioConfig.event}
            club={managedClubs.find((c: any) => String(c.id) === String(studioConfig.event?.club_id)) ?? null}
            onClose={() => setStudioConfig(null)}
            resultMode={studioConfig.resultMode}
            quickMode={studioConfig.quickMode}
            convocationPlayers={studioConfig.convocationPlayers}
          />
        </Suspense>
      )}
    </div>
  );
}
