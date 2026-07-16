import { lazy, Suspense, useMemo, useCallback, useState, useEffect } from 'react';
import { Z } from '../constants/zIndex.js';
import { useAuth }               from '../contexts/AuthContext.jsx';
import { useManagedClubs }       from '../hooks/useManagedClubs.js';
import { useMyAnnouncements }    from '../hooks/useMyAnnouncements.js';
import { useWeekendPosters, getMockWeekendMatches } from '../hooks/useWeekendPosters.js';
import { useQuickActions }       from '../hooks/useQuickActions.js';
import { useDemoFeed }           from '../hooks/useDemoFeed.js';
import { isDemoMode, supabase }  from '../lib/supabase.js';
import LiveMultiplexSection      from '../components/home/LiveMultiplexSection.jsx';
import HypeBar                   from '../components/home/HypeBar.jsx';
import PlanningTimeline          from '../components/planning/PlanningTimeline.jsx';
import DiscoveryClubs            from '../components/home/DiscoveryClubs.js';
import FeedRecentResults         from '../components/home/FeedRecentResults.js';


const PosterStudio             = lazy(() => import('../components/PosterStudio.jsx'));
const CompoPoster              = lazy(() => import('../components/poster/simple/CompoPoster.jsx'));
const EventFormStepConvocation = lazy(() => import('../components/event/EventFormStepConvocation.jsx'));

interface ActualitesPageProps {
  followedClubIds?: string[];
  onNavigate?: (page: string) => void;
}

export default function ActualitesPage({
  followedClubIds = [],
  onNavigate,
}: ActualitesPageProps) {
  const { currentUser, isAdmin, isClubAdmin, loading: authLoading } = useAuth();
  const { managedClubs, isCoachOrManager, isCommunicant, teamFilters } = useManagedClubs();
  const { announcements, readIds, markRead } = useMyAnnouncements();
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
  });
  const effectiveLiveMatches = demo ? demoLiveMatches : quickActions.liveMatches;
  const liveWeekendMatches   = useWeekendPosters();
  const weekendMatches       = demo ? getMockWeekendMatches() : liveWeekendMatches;

  const allKnownClubs = useMemo(() => {
    const map: Record<string, any> = {};
    managedClubs.forEach((c: any) => { map[String(c.id)] = c; });
    return Object.values(map);
  }, [managedClubs]);


  const [studioConfig,     setStudioConfig]     = useState<Record<string, any> | null>(null);
  const [compoEvent,       setCompoEvent]       = useState<Record<string, any> | null>(null);
  const [convocationEvent, setConvocationEvent] = useState<Record<string, any> | null>(null);
  const [posterStatuses,   setPosterStatuses]   = useState<Record<string, 'draft' | 'saved'>>({});

  const [hypeStats, setHypeStats] = useState({ totalToday: 0, upcomingThisWeek: 0 });
  useEffect(() => {
    if (!feedClubIds.length || demo) return;
    let cancelled = false;
    const today   = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);
    supabase
      .from('events')
      .select('id, date')
      .in('club_id', feedClubIds)
      .gte('date', today)
      .lte('date', weekEndStr)
      .in('event_type', ['match', 'friendly'])
      .then(({ data }: { data: { id: string; date: string }[] | null }) => {
        if (cancelled || !data) return;
        setHypeStats({
          totalToday:      data.filter(e => e.date?.startsWith(today)).length,
          upcomingThisWeek: data.length,
        });
      });
    return () => { cancelled = true; };
  }, [feedClubIds.join(','), demo]);

  // Statuts affiches pour les matchs du week-end (draft / saved / absent)
  useEffect(() => {
    const ids = weekendMatches.map((m: any) => m.id);
    if (!ids.length) return;
    if (demo) {
      // Mock : 1re affiche sauvegardée, 2e en brouillon
      setPosterStatuses({ [ids[0]]: 'saved', [ids[1]]: 'draft' });
      return;
    }
    if (!currentUser?.id) return;
    let cancelled = false;
    supabase
      .from('posters')
      .select('event_id, status')
      .in('event_id', ids)
      .eq('user_id', currentUser.id)
      .then(({ data }: { data: { event_id: string; status: string }[] | null }) => {
        if (cancelled || !data) return;
        const map: Record<string, 'draft' | 'saved'> = {};
        data.forEach((p: any) => { map[p.event_id] = p.status as 'draft' | 'saved'; });
        setPosterStatuses(map);
      });
    return () => { cancelled = true; };
  }, [weekendMatches.map((m: any) => m.id).join(','), demo, currentUser?.id]);

  const sortedWeekendMatches = useMemo(
    () => [...weekendMatches].sort((a: any, b: any) => a.date.getTime() - b.date.getTime()),
    [weekendMatches],
  );

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

  const handleOpenPoster = useCallback(({ event, score, mode }: { event: any; score: any; mode: string }) => {
    // Compo / convocation → affiche « du groupe » (grille adaptative cohérente).
    if (mode === 'convocation' && event?.id) { setCompoEvent(event); return; }
    setStudioConfig({ event, resultMode: score ?? null, quickMode: !!score, convocationPlayers: null });
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
      {/* Colonne de contenu : pleine largeur sur mobile, largeur max centrée
          sur grand écran (évite le feed étiré sur tout l'écran). */}
      <div className="w-full lg:max-w-[1000px] lg:self-center">
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
                padding: '6px 12px', borderRadius: 'var(--sl-radius-4xl)',
                backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
                fontSize: 12, fontWeight: 600, color: 'var(--sl-t2)',
              }}>
                {icon} {label}
              </div>
            ))}
          </div>

          {/* Discovery clubs */}
          <DiscoveryClubs
            onNavigate={onNavigate}
            userSport={currentUser?.favoriteSports?.[0]}
          />

          {/* CTA "Tous les clubs" */}
          <button
            onClick={() => onNavigate?.('clubs')}
            style={{
              backgroundColor: 'transparent', color: 'var(--sl-t2)',
              padding: '12px 20px', borderRadius: 'var(--sl-radius-xl)', fontWeight: 600,
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
          totalToday={hypeStats.totalToday}
          upcomingThisWeek={hypeStats.upcomingThisWeek}
          clubCount={feedClubIds.length}
        />
      )}

      {/* ══ Affiches du week-end — scroll horizontal (staff + communicant) ═══ */}
      {!isNewUser && (isCoachOrManager || isCommunicant || isClubAdmin || isAdmin) && weekendMatches.length > 0 && (
        <div style={{ padding: '8px 0 0' }}>
          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--sl-radius-md)', flexShrink: 0,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #22d96a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>🎨</div>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Affiches du week-end</span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--sl-t3)',
              backgroundColor: 'var(--sl-surface)', padding: '2px 8px', borderRadius: 'var(--sl-radius-4xl)',
            }}>
              {weekendMatches.length} match{weekendMatches.length > 1 ? 's' : ''}
            </span>
          </div>
          {/* Cartes horizontales */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 4px', scrollbarWidth: 'none' }}>
            {sortedWeekendMatches.map((match: any) => {
              const sportEmoji: Record<string, string> = { football: '⚽', basket: '🏀', handball: '🤾', rugby: '🏉' };
              const emoji = sportEmoji[match.sport] ?? '🏆';
              const dayLabel = match.date.toLocaleDateString('fr-FR', { weekday: 'short' });
              const timeLabel = match.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const clubColor = managedClubs.find((c: any) => String(c.id) === match.clubId)?.primaryColor ?? null;
              const accent = clubColor ?? match.posterData?.accentColor ?? 'var(--sl-accent)';
              return (
                <button
                  key={match.id}
                  onClick={() => handleOpenPoster({
                    event: {
                      id: match.id,
                      club_id: match.clubId,
                      title: match.homeTeam.name,
                      sport: match.sport,
                      date: match.date.toISOString(),
                      adversaire: match.awayTeam.name,
                      venue: match.venue,
                    },
                    score: null,
                    mode: 'create',
                  })}
                  style={{
                    flexShrink: 0, width: 150,
                    display: 'flex', flexDirection: 'column', gap: 5,
                    padding: '10px 12px', borderRadius: 'var(--sl-radius-2xl)',
                    background: `linear-gradient(155deg, ${accent}22 0%, var(--sl-card) 65%)`,
                    border: `1px solid ${accent}44`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {/* Ligne 1 : emoji + jour/heure */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20 }}>{emoji}</span>
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600 }}>
                      {dayLabel} {timeLabel}
                    </span>
                  </div>
                  {/* Ligne 2 : équipes */}
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {match.homeTeam.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--sl-t2)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      vs {match.awayTeam.name}
                    </p>
                  </div>
                  {/* Ligne 3 : catégorie + championnat */}
                  <div style={{ borderTop: `1px solid ${accent}30`, paddingTop: 5 }}>
                    {match.category && (
                      <span style={{
                        display: 'inline-block', fontSize: 9, fontWeight: 800,
                        color: accent, backgroundColor: `${accent}20`,
                        padding: '1px 6px', borderRadius: 'var(--sl-radius-sm)', marginBottom: 3,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        {match.category}
                      </span>
                    )}
                    {match.competition && (
                      <p style={{ margin: 0, fontSize: 9, color: 'var(--sl-t3)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.competition}
                      </p>
                    )}
                  </div>
                  {/* Ligne 4 : statut (créée / brouillon / à créer) */}
                  {posterStatuses[match.id] === 'saved' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10 }}>✅</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>Créée</span>
                    </div>
                  ) : posterStatuses[match.id] === 'draft' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10 }}>📝</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#EA580C' }}>Brouillon</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: accent }}>Créer</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ Multiplex EN DIRECT ══════════════════════════════════════════════ */}
      {!isNewUser && <LiveMultiplexSection liveMatches={effectiveLiveMatches} />}

      {/* ══ Derniers résultats ═══════════════════════════════════════════════ */}
      {!isNewUser && <FeedRecentResults clubIds={feedClubIds} />}


      {/* ══ Planning de la Saison (inclut les annonces) ═════════════════════ */}
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
          teamFilter={teamFilters ?? []}
          onOpenPoster={handleOpenPoster}
          onConvocate={(event: any) => setConvocationEvent(event)}
          onNavigateRides={() => onNavigate?.('rides')}
          announcements={announcements ?? []}
          readIds={readIds ?? new Set()}
          onMarkRead={markRead}
        />
      )}

      </div>{/* fin colonne de contenu */}

      {/* Modale convocation (depuis cartes match) */}
      {convocationEvent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: Z.activityModal,
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
                  width: 44, height: 44, borderRadius: 'var(--sl-radius-lg)', border: 'none', cursor: 'pointer',
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

      {/* Affiche du groupe (compo) — grille adaptative, cadre partagé */}
      {compoEvent && (
        <Suspense fallback={null}>
          <CompoPoster
            event={compoEvent}
            club={managedClubs.find((c: any) => String(c.id) === String(compoEvent?.club_id)) ?? null}
            onClose={() => setCompoEvent(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
