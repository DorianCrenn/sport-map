import { lazy, Suspense, useMemo, useCallback, useState } from 'react';
import { useAuth }          from '../contexts/AuthContext.jsx';
import { useManagedClubs }  from '../hooks/useManagedClubs.js';
import { useQuickActions }  from '../hooks/useQuickActions.js';
import { useDemoFeed }      from '../hooks/useDemoFeed.js';
import { isDemoMode, supabase } from '../lib/supabase.js';
import LiveMultiplexSection from '../components/home/LiveMultiplexSection.jsx';
import HypeBar              from '../components/home/HypeBar.jsx';
import StreakWidget         from '../components/home/StreakWidget.jsx';
import PlanningTimeline     from '../components/planning/PlanningTimeline.jsx';

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
  const { currentUser, isAdmin, isClubAdmin } = useAuth() as any;
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

  const isNewUser = !demo && feedClubIds.length === 0 && !isCoachOrManager && !isClubAdmin && !isAdmin;

  return (
    <div
      className="flex flex-col h-full bg-[var(--sl-bg)] overflow-y-auto overscroll-contain"
      data-demo="agenda-section"
    >
      {/* ══ Empty state — nouveau compte sans club suivi ═══════════════════ */}
      {isNewUser && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🏆</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Suivez vos premiers clubs
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--sl-t2)', lineHeight: 1.6, maxWidth: 280 }}>
            Abonnez-vous à des clubs pour voir leur calendrier, résultats et annonces ici.
          </p>
          <button
            onClick={() => onNavigate?.('clubs')}
            style={{ backgroundColor: 'var(--sl-green)', color: '#fff', padding: '14px 28px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}
          >
            Découvrir les clubs
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
