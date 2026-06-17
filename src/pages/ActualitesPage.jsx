import { lazy, Suspense, useMemo, useCallback, useState } from 'react';
import { useAuth }          from '../contexts/AuthContext.jsx';
import { useManagedClubs }  from '../hooks/useManagedClubs.js';
import { useQuickActions }  from '../hooks/useQuickActions.js';
import { useDemoFeed }      from '../hooks/useDemoFeed.js';
import { isDemoMode, supabase } from '../lib/supabase.js';
import LiveMultiplexSection from '../components/home/LiveMultiplexSection.jsx';
import PlanningTimeline     from '../components/planning/PlanningTimeline.jsx';

const PosterStudio             = lazy(() => import('../components/PosterStudio.jsx'));
const EventFormStepConvocation = lazy(() => import('../components/event/EventFormStepConvocation.jsx'));

export default function ActualitesPage({
  followedClubIds = [],
  onNavigate,
}) {
  const { currentUser, isAdmin, isClubAdmin } = useAuth();
  const { managedClubs, isCoachOrManager, isCommunicant } = useManagedClubs();
  const demo = isDemoMode();

  // ── IDs clubs ─────────────────────────────────────────────────────────────
  const managedClubIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedClubs]);
  const feedClubIds    = useMemo(
    () => [...new Set([...followedClubIds.map(String), ...managedClubIds])],
    [followedClubIds, managedClubIds],
  );

  // ── Multiplex EN DIRECT ───────────────────────────────────────────────────
  const { demoLiveMatches } = useDemoFeed();
  const quickActions        = useQuickActions({
    currentUser,
    managedClubs,
    followedClubIds: feedClubIds,
    isCoachOrManager,
    isCommunicant,
  });
  const effectiveLiveMatches = demo ? demoLiveMatches : quickActions.liveMatches;

  // ── Clubs pour PlanningTimeline ───────────────────────────────────────────
  const allKnownClubs = useMemo(() => {
    const map = {};
    managedClubs.forEach(c => { map[String(c.id)] = c; });
    return Object.values(map);
  }, [managedClubs]);

  // ── PosterStudio ──────────────────────────────────────────────────────────
  const [studioConfig,     setStudioConfig]     = useState(null);
  const [convocationEvent, setConvocationEvent] = useState(null);

  const handleOpenPoster = useCallback(async ({ event, score, mode }) => {
    let convPlayers = null;
    if (mode === 'convocation' && event?.id) {
      const { data: convocRows } = await supabase
        .from('event_convocations').select('player_id').eq('event_id', event.id).eq('status', 'accepted');
      const playerIds = (convocRows ?? []).map(r => r.player_id);
      if (playerIds.length) {
        const { data: playerRows } = await supabase.from('club_players').select('name').in('id', playerIds);
        convPlayers = (playerRows ?? []).map(p => p.name);
      } else {
        convPlayers = [];
      }
    }
    setStudioConfig({ event, resultMode: score ?? null, quickMode: !!score, convocationPlayers: convPlayers });
  }, []);

  return (
    <div
      className="flex flex-col h-full bg-[var(--sl-bg)] overflow-y-auto overscroll-contain"
      data-demo="agenda-section"
    >
      {/* ══ Multiplex EN DIRECT ══════════════════════════════════════════════ */}
      <LiveMultiplexSection liveMatches={effectiveLiveMatches} />

      {/* ══ Planning de la Saison ════════════════════════════════════════════ */}
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
        onConvocate={(event) => setConvocationEvent(event)}
        onNavigateRides={() => onNavigate?.('rides')}
      />

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
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          }}>
            {/* Poignée drag + bouton fermer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 16px 0', flexShrink: 0 }}>
              <button
                onClick={() => setConvocationEvent(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
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
            club={managedClubs.find(c => String(c.id) === String(studioConfig.event?.club_id)) ?? null}
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
