import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useClubLeaderboard } from '../hooks/useClubLeaderboard.js';
import SportIcon from '../components/SportIcon.jsx';
const ClubPageView       = lazy(() => import('../components/club/ClubPageView.jsx'));
const ClubCreationWizard = lazy(() => import('../components/club/ClubCreationWizard.jsx'));
const ClubFormModal      = lazy(() => import('../components/club/ClubFormModal.jsx'));
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { SkeletonClubCard } from '../components/Skeleton.jsx';
import { generateDemoData } from '../lib/demoDataGenerator.js';

interface ClubsPageProps {
  allEvents?: Record<string, any>[];
  onShowAuth?: () => void;
  onAddEvent?: (...args: any[]) => any;
  canAddEvent?: boolean;
  onClubOverlayChange?: (open: boolean) => void;
  onArchiveSeason?: (...args: any[]) => any;
}

export default function ClubsPage({ allEvents, onShowAuth, onAddEvent, canAddEvent, onClubOverlayChange, onArchiveSeason }: ClubsPageProps) {
  const { allSports: SPORTS } = useSports() as any;
  const { userClubs, loading: clubsLoading, addClubAndNotify, updateClub, deleteClub } = useClubs() as any;
  const { currentUser, isAdmin, isClubAdmin, followClub, unfollowClub, isFollowingClub, refetchProfile } = useAuth() as any;

  const [search, setSearch]               = useState('');
  const [sportFilter, setSportFilter]     = useState<string | null>(null);
  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const newClubRef = useRef<Record<string, any> | null>(null);
  const { leaderboard } = useClubLeaderboard({ limit: 5, sportFilter }) as any;
  const [showAllSports, setShowAllSports]       = useState(false);
  const [selectedClub, setSelectedClub]         = useState<Record<string, any> | null>(null);
  const [leaderboardOpen, setLeaderboardOpen]   = useState(false);
  const [formClub, setFormClub]           = useState<Record<string, any> | boolean | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    onClubOverlayChange?.(!!selectedClub);
    return () => onClubOverlayChange?.(false);
  }, [selectedClub, onClubOverlayChange]);

  const allClubs: Record<string, any>[] = userClubs;
  const favoriteSports: string[] = currentUser?.favoriteSports || [];
  const inFavoritesMode = favoriteSports.length > 0 && !showAllSports;

  const myClub = isClubAdmin && currentUser?.clubId
    ? userClubs.find((c: Record<string, any>) => c.id === currentUser.clubId)
    : null;

  const filtered = allClubs.filter((c: Record<string, any>) => {
    if (myClub && c.id === myClub.id) return false;
    const matchSearch = (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase());
    const matchSport = sportFilter ? c.sport === sportFilter
      : inFavoritesMode ? favoriteSports.includes(c.sport)
      : true;
    return matchSearch && matchSport;
  }).sort((a: Record<string, any>, b: Record<string, any>) => {
    const aF = isFollowingClub(a.id) ? 0 : 1;
    const bF = isFollowingClub(b.id) ? 0 : 1;
    return aF - bF;
  });

  async function handleSave(data: Record<string, any>) {
    if (formClub && formClub !== true) {
      await updateClub((formClub as Record<string, any>).id, data);
      setFormClub(null);
    } else {
      const created = await addClubAndNotify(data);
      setSelectedClub(created);
      await refetchProfile();
      setFormClub(null);
      if (created?.id) {
        newClubRef.current = created;
        setShowDemoDialog(true);
      }
    }
  }

  async function handleAcceptDemo() {
    setShowDemoDialog(false);
    const club = newClubRef.current;
    if (!club || !currentUser) return;
    try {
      await generateDemoData(club.id, currentUser.id, club.name, club.sport);
    } catch { /* silencieux — la démo est optionnelle */ }
    newClubRef.current = null;
  }

  function handleDeclineDemo() {
    setShowDemoDialog(false);
    newClubRef.current = null;
  }

  function handleDelete(club: Record<string, any>) {
    deleteClub(club.id);
    setConfirmDelete(null);
    if (selectedClub?.id === club.id) setSelectedClub(null);
  }

  function isOwnClub(club: Record<string, any>): boolean {
    if (isAdmin) return club.isUserCreated;
    if (currentUser) return club.userId === currentUser.id || club.ownerId === currentUser.id;
    return false;
  }

  const allVisible = Object.values(SPORTS).filter((s: any) => !s.isArchived);
  const visibleSports = inFavoritesMode
    ? allVisible.filter((s: any) => favoriteSports.includes(s.id))
    : allVisible;
  const hiddenCount = inFavoritesMode
    ? allVisible.filter((s: any) => !favoriteSports.includes(s.id)).length
    : 0;

  const inExpandedMode = favoriteSports.length > 0 && showAllSports;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--sl-bg)' }}>

      <AnimatePresence>
        {selectedClub && (
          <Suspense fallback={null}>
            <ClubPageView
              key={selectedClub.id}
              club={selectedClub}
              allEvents={allEvents ?? []}
              onBack={() => setSelectedClub(null)}
              onAddEvent={onAddEvent}
              canAddEvent={canAddEvent}
              onArchiveSeason={onArchiveSeason}
              onUpdateClub={async (data: Record<string, any>) => {
                await updateClub(selectedClub.id, data);
                setSelectedClub((prev: Record<string, any> | null) => prev ? ({ ...prev, ...data }) : prev);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formClub === true && (
          <Suspense fallback={null}>
            <ClubCreationWizard
              onSave={handleSave}
              onClose={() => setFormClub(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formClub !== null && formClub !== true && (
          <ClubFormModal
            club={formClub as any}
            onSave={handleSave}
            onClose={() => setFormClub(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDemoDialog}
        title="Générer des données d'exemple ?"
        message="SportLink peut créer 5 événements, 1 annonce et 1 covoiturage fictifs pour vous montrer toutes les fonctionnalités. Vous pourrez les supprimer à tout moment depuis le dashboard."
        confirmLabel="Générer les exemples"
        confirmColor="var(--sl-green)"
        onConfirm={handleAcceptDemo}
        onCancel={handleDeclineDemo}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer le club ?"
        message={confirmDelete ? `Cette action supprimera ${confirmDelete.name} et sa page définitivement.` : ''}
        confirmLabel="Supprimer"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />

      <div style={{
        padding: '14px 14px 10px', flexShrink: 0,
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--sl-t1)', letterSpacing: '-0.01em', fontFamily: "'Barlow Condensed', sans-serif" }}>
            Clubs
          </span>
          {currentUser && !isClubAdmin && (
            <button
              onClick={() => setFormClub(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Créer un club
            </button>
          )}
          {!currentUser && (
            <button
              onClick={() => onShowAuth?.()}
              style={{
                fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', border: '1px solid var(--sl-border)', cursor: 'pointer',
              }}
            >
              Se connecter
            </button>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un club ou une ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 12, fontSize: 13, fontFamily: 'Inter, sans-serif',
              backgroundColor: 'var(--sl-input-bg)',
              border: '1px solid var(--sl-input-border)',
              color: 'var(--sl-t1)', outline: 'none',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 24,
            background: 'linear-gradient(to left, var(--sl-card) 20%, transparent)',
            zIndex: 10, pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {inExpandedMode && (
              <button
                onClick={() => { setShowAllSports(false); setSportFilter(null); }}
                style={{
                  padding: '8px 10px', borderRadius: 999, border: '1px solid var(--sl-green)',
                  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Mes sports
              </button>
            )}
            <button
              onClick={() => setSportFilter(null)}
              style={{
                padding: '8px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                backgroundColor: sportFilter === null ? 'var(--sl-green)' : 'transparent',
                color: sportFilter === null ? '#fff' : 'var(--sl-t2)',
                border: sportFilter === null ? '1px solid transparent' : '1px solid var(--sl-border-s)',
              }}
            >
              {inFavoritesMode ? 'Mes sports' : 'Tous'}
            </button>
            {(visibleSports as any[]).map((sport: any) => (
              <button
                key={sport.id}
                onClick={() => setSportFilter(sportFilter === sport.id ? null : sport.id)}
                style={{
                  padding: '8px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  backgroundColor: sportFilter === sport.id ? sport.color : 'transparent',
                  color: sportFilter === sport.id ? '#fff' : 'var(--sl-t2)',
                  border: sportFilter === sport.id ? '1px solid transparent' : '1px solid var(--sl-border-s)',
                }}
              >
                <SportIcon sport={sport.id} size={12} color={sportFilter === sport.id ? '#fff' : sport.color} />
                {sport.label}
              </button>
            ))}
            {inFavoritesMode && hiddenCount > 0 && (
              <button
                onClick={() => { setShowAllSports(true); setSportFilter(null); }}
                style={{
                  padding: '8px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)',
                  border: '1px dashed var(--sl-green)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {hiddenCount} sport{hiddenCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px calc(90px + env(safe-area-inset-bottom, 0px))' }}>

        {leaderboard.length > 0 && (
          <div style={{ marginBottom: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
            <button
              onClick={() => setLeaderboardOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)' }}>
                <span>🏆</span> Clubs actifs ce mois
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: leaderboardOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <AnimatePresence>
              {leaderboardOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {leaderboard.map(({ rank, club: lClub, eventCount }: any) => (
                    <div
                      key={lClub.id}
                      onClick={() => { const found = allClubs.find((c: Record<string, any>) => String(c.id) === String(lClub.id)); if (found) setSelectedClub(found); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 14px', borderTop: '1px solid var(--sl-border)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ width: 20, fontSize: 12, fontWeight: 800, color: rank <= 3 ? '#f59e0b' : 'var(--sl-t3)', textAlign: 'center', flexShrink: 0 }}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      {lClub.logo_url
                        ? <img src={lClub.logo_url} alt={lClub.name} loading="lazy" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain', flexShrink: 0 }} />
                        : <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--sl-surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚽</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lClub.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{lClub.city}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-green)', flexShrink: 0 }}>
                        {eventCount} événement{eventCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {(() => { const n = filtered.length + (myClub ? 1 : 0); return `${n} club${n !== 1 ? 's' : ''}`; })()}
        </div>

        {myClub && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 10, borderRadius: 14, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myClub.name}</div>
              <div style={{ fontSize: 11, color: '#f59e0b' }}>Votre club · {myClub.city}</div>
            </div>
            <button
              onClick={() => setSelectedClub(myClub)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                backgroundColor: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              Gérer
            </button>
          </motion.div>
        )}

        {myClub && myClub.status === 'pending_verification' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 10, borderRadius: 14, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#92400e' }}>Club en cours de vérification</div>
              <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.5 }}>Vous pouvez utiliser SportLink dès maintenant. Validation sous 48h.</div>
            </div>
          </motion.div>
        )}

        {clubsLoading && filtered.length === 0 && (
          <div aria-label="Chargement des clubs" aria-live="polite">
            {[0, 1, 2, 3, 4].map(i => <SkeletonClubCard key={i} />)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 8 }}>
        {filtered.map((club: Record<string, any>, i: number) => {
          const sport = SPORTS[club.sport];
          const sportColor = sport?.color ?? '#64748b';
          const own = isOwnClub(club);
          const initials = club.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase().slice(0, 3);

          return (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 340, damping: 28 }}
              whileHover={{ y: -3, boxShadow: `0 8px 28px ${sportColor}28, 0 2px 8px rgba(0,0,0,0.18)` }}
              style={{
                borderRadius: 14, overflow: 'hidden',
                backgroundColor: 'var(--sl-card)',
                border: `1px solid ${own ? 'rgba(34,217,106,0.35)' : 'var(--sl-border)'}`,
                cursor: 'pointer',
              }}
            >
              {/* Gradient banner sport */}
              <div aria-hidden="true" style={{ height: 4, background: `linear-gradient(90deg, ${sportColor} 0%, ${sportColor}66 60%, transparent 100%)` }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px 10px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: club.logo ? 'transparent' : sportColor,
                  fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: 'Inter, sans-serif',
                  boxShadow: `0 0 0 2px var(--sl-card), 0 0 0 3px var(--sl-border-s)`,
                }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {club.name}
                    </div>
                    {own && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0,
                        backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)',
                      }}>
                        {isAdmin ? 'Géré' : 'Mon club'}
                      </span>
                    )}
                    {!own && isFollowingClub(club.id) && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0,
                        backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                      }}>
                        Suivi
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{club.city}</span>
                    {club.members > 0 && (
                      <>
                        <span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{club.members} membres</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                      backgroundColor: sportColor, color: '#fff', flexShrink: 0,
                    }}>
                      {club.sport}
                    </span>
                    {club.categories?.slice(0, 4).map((cat: any) => (
                      <span key={cat.id} style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 6,
                        backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', flexShrink: 0,
                      }}>
                        {cat.name}
                      </span>
                    ))}
                    {club.categories?.length > 4 && (
                      <span style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0 }}>
                        +{club.categories.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid var(--sl-border)' }}>
                {own ? (
                  <>
                    <button
                      onClick={() => setFormClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '12px 0', fontSize: 12, fontWeight: 600,
                        color: 'var(--sl-t2)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Éditer
                    </button>
                    <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                    <button
                      onClick={() => setSelectedClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '12px 0', fontSize: 12, fontWeight: 700,
                        color: 'var(--sl-green)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ma page
                    </button>
                    <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                    <button
                      onClick={() => setConfirmDelete(club)}
                      aria-label={`Supprimer ${club.name}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '12px', color: '#ef4444',
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {currentUser && (() => {
                      const following = isFollowingClub(club.id);
                      return (
                        <>
                          <button
                            onClick={() => following ? unfollowClub(club.id) : followClub(club.id)}
                            aria-label={following ? 'Ne plus suivre ce club' : 'Suivre ce club'}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: 5, padding: '12px 0', fontSize: 12, fontWeight: 700,
                              color: following ? 'var(--sl-green)' : 'var(--sl-t2)',
                              backgroundColor: following ? 'var(--sl-green-dim)' : 'transparent',
                              border: 'none', cursor: 'pointer',
                            }}
                          >
                            {following ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            )}
                            {following ? 'Suivi ✓' : 'Suivre'}
                          </button>
                          <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                        </>
                      );
                    })()}
                    {club.contact && (
                      <>
                        <a
                          href={`mailto:${club.contact}`}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 5, padding: '12px 0', fontSize: 12, fontWeight: 600,
                            color: 'var(--sl-t2)', textDecoration: 'none',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Contacter
                        </a>
                        <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                      </>
                    )}
                    <button
                      onClick={() => setSelectedClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '12px 0', fontSize: 12, fontWeight: 700,
                        color: sportColor, backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Voir la page
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
