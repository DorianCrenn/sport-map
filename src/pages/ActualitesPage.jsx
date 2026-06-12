import { lazy, Suspense, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeedItems }     from '../hooks/useFeedItems.ts';
import { useFeaturedEvents } from '../hooks/useFeaturedEvents.ts';
import { useClubSponsors }  from '../hooks/useClubSponsors.ts';
import { useAuth }          from '../contexts/AuthContext.jsx';
import { useToast }         from '../contexts/ToastContext.jsx';
import { useManagedClubs }  from '../hooks/useManagedClubs.js';
import { useMyConvocations } from '../hooks/useMyConvocations.js';
import { useParentChildren } from '../hooks/useParentChildren.js';
import { useQuickActions }  from '../hooks/useQuickActions.js';
import { useDemoFeed }      from '../hooks/useDemoFeed.js';
import { isDemoMode, supabase } from '../lib/supabase.js';
import ClubFeed             from '../components/feed/ClubFeed.tsx';
import QuickActionsSection  from '../components/home/QuickActionsSection.jsx';
import LiveMultiplexSection from '../components/home/LiveMultiplexSection.jsx';
import ParentConvocationCard from '../components/home/ParentConvocationCard.jsx';

const PosterStudio           = lazy(() => import('../components/PosterStudio.jsx'));
const EventFormStepConvocation = lazy(() => import('../components/event/EventFormStepConvocation.jsx'));

export default function ActualitesPage({
  followedClubIds = [],
  onNavigate,
  onOpenTrainings,
  externalConvocations,
  onConvocationRespond,
}) {
  const { currentUser, isAdmin, isClubAdmin, follows } = useAuth();
  const { toast } = useToast();
  const { managedClubs, isCoachOrManager, isCommunicant } = useManagedClubs();
  const demo = isDemoMode();

  // ── Détection de rôle ─────────────────────────────────────────────────────
  const { isParent: isParentByChild } = useParentChildren(currentUser?.id);
  const jobRole    = currentUser?.job_role;
  const isParent   = isParentByChild || jobRole === 'parent';
  const isCoach    = isCoachOrManager;
  const isComm     = isCommunicant || jobRole === 'communicant';
  const isPresident = isAdmin || isClubAdmin || jobRole === 'president';

  // ── Convocations parent ───────────────────────────────────────────────────
  // Pas de fetch réel en mode démo — useDemoFeed fournit les convocations fictives
  const localConv = useMyConvocations(
    !demo && !externalConvocations ? currentUser?.id : null
  );
  const onRespond = onConvocationRespond ?? localConv.respond;

  // ── Demo state ────────────────────────────────────────────────────────────
  const { demoConvocations, setDemoConvocations, demoLiveMatches } = useDemoFeed();

  const allRealConvocs   = externalConvocations ?? localConv.convocations;
  const pendingConvocations = demo
    ? demoConvocations
    : allRealConvocs.filter(c => c.status === 'pending');

  // ── Feed data ─────────────────────────────────────────────────────────────
  const managedClubIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedClubs]);
  const feedClubIds    = useMemo(
    () => [...new Set([...followedClubIds, ...managedClubIds])],
    [followedClubIds, managedClubIds],
  );

  const { items, loading }  = useFeedItems(feedClubIds, follows, managedClubIds);
  const { items: featured } = useFeaturedEvents({ clubIds: feedClubIds });
  const { sponsors }        = useClubSponsors(feedClubIds);

  // ── Quick Actions (coach / communicant) ───────────────────────────────────
  const quickActions = useQuickActions({
    currentUser,
    managedClubs,
    followedClubIds: feedClubIds,
    isCoachOrManager,
    isCommunicant,
  });

  const effectiveLiveMatches = demo ? demoLiveMatches : quickActions.liveMatches;

  // ── Convocation modale ────────────────────────────────────────────────────
  const [convocationEvent, setConvocationEvent] = useState(null);

  // ── PosterStudio ──────────────────────────────────────────────────────────
  const [studioConfig, setStudioConfig] = useState(null);

  const handleOpenPoster = useCallback(async ({ event, score, mode }) => {
    let convPlayers = null;
    if (mode === 'convocation' && event?.id) {
      const { data: convocRows } = await supabase
        .from('event_convocations')
        .select('player_id')
        .eq('event_id', event.id)
        .eq('status', 'accepted');
      const playerIds = (convocRows ?? []).map(r => r.player_id);
      if (playerIds.length) {
        const { data: playerRows } = await supabase
          .from('club_players')
          .select('name')
          .in('id', playerIds);
        convPlayers = (playerRows ?? []).map(p => p.name);
      } else {
        convPlayers = [];
      }
    }
    setStudioConfig({
      event,
      resultMode:         score ?? null,
      quickMode:          !!score,
      convocationPlayers: convPlayers,
    });
  }, []);

  // ── Handlers parent (demo blindé) ─────────────────────────────────────────
  const handleParentRespond = useCallback(async (id, status, note, transportMode, driverSeats) => {
    if (demo) {
      setDemoConvocations(prev => prev.filter(c => c.id !== id));
      return;
    }
    try {
      await onRespond(id, status, note, transportMode, driverSeats);
    } catch {
      toast({ message: "Erreur lors de l'envoi", type: 'error' });
    }
  }, [demo, onRespond, setDemoConvocations, toast]);

  const handleParentDismiss = useCallback((id) => {
    if (demo) setDemoConvocations(prev => prev.filter(c => c.id !== id));
  }, [demo, setDemoConvocations]);

  // ── Visibilité des zones ──────────────────────────────────────────────────
  const showParentCards = (isParent || isPresident) && pendingConvocations.length > 0;
  const showCoachComm   = isCoach || isComm || isPresident;

  return (
    <div
      className="flex flex-col h-full bg-[var(--sl-bg)] overflow-y-auto overscroll-contain"
    >

      {/* ══ ZONE 1 — Bandeau Quick Actions ══════════════════════════════════ */}
      {(showParentCards || showCoachComm) && (
        <section className="px-4 pt-4 pb-2">

          {/* Convocations parent */}
          {showParentCards && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-black tracking-[0.15em] uppercase text-[var(--sl-t3)]">
                  Convocations en attente
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              </div>
              <AnimatePresence mode="popLayout">
                {pendingConvocations.map(c => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 36 }}
                    className="mb-3"
                  >
                    <ParentConvocationCard
                      convocation={c}
                      onDismiss={handleParentDismiss}
                      onRespond={handleParentRespond}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

          {/* Coach + communicant + président (QuickActionsSection a son propre en-tête) */}
          {showCoachComm && (
            <QuickActionsSection
              quickActions={quickActions}
              isCoachOrManager={isCoach || isPresident}
              isCommunicant={isComm || isPresident}
              isPresident={isPresident}
              managedClubs={managedClubs}
              onNavigate={onNavigate}
              onOpenTrainings={onOpenTrainings}
              onOpenPoster={handleOpenPoster}
              onConvocate={(event) => setConvocationEvent(event)}
            />
          )}

        </section>
      )}

      {/* ══ ZONE 2 — Multiplex en direct ════════════════════════════════════ */}
      <LiveMultiplexSection liveMatches={effectiveLiveMatches} />

      {/* ══ ZONE 3 — Feed chronologique ═════════════════════════════════════ */}
      <ClubFeed
        clubId="followed"
        clubName="Actualités"
        items={items}
        featuredItems={featured}
        sponsorItems={sponsors}
        loading={loading}
        currentUser={currentUser}
        onNavigateClubs={onNavigate ? () => onNavigate('clubs') : undefined}
        onOpenTrainings={onOpenTrainings}
        hideHeader={false}
      />

      {/* Modale convocation depuis CoachMatchCard */}
      {convocationEvent && (
        <Suspense fallback={null}>
          <EventFormStepConvocation
            event={convocationEvent}
            onClose={() => setConvocationEvent(null)}
          />
        </Suspense>
      )}

      {/* PosterStudio (lazy) */}
      {studioConfig && (
        <Suspense fallback={null}>
          <PosterStudio
            event={studioConfig.event}
            club={
              managedClubs.find(
                c => String(c.id) === String(studioConfig.event?.club_id)
              ) ?? null
            }
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
