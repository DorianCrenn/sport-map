import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonPlanning }      from '../../hooks/useSeasonPlanning.js';
import { useFeedRides }           from '../../hooks/useFeedRides.js';
import type { MyAnnouncement }    from '../../hooks/useMyAnnouncements.js';
import TrainingPlanningCard       from './TrainingPlanningCard.jsx';
import MatchPlanningCard          from './MatchPlanningCard.jsx';
import AnnouncementPlanningCard   from './AnnouncementPlanningCard.jsx';

const WEEKDAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR     = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function DateBubble({ dateStr }: { dateStr: string }) {
  const d = new Date((dateStr ?? '') + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const day    = d.getDate();
  const mon    = (MONTHS_FR[d.getMonth()] ?? '').toUpperCase();
  const wkFull = WEEKDAYS_FULL[d.getDay()] ?? '';
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center flex-shrink-0 relative z-10 shadow-lg" style={{ background: '#22d96a' }}>
        <span className="text-black font-black text-xl leading-none">{day}</span>
        <span className="text-black/75 text-[9px] font-black leading-tight tracking-wide">{mon}</span>
      </div>
      <span className="text-[11px] font-black tracking-[0.2em] uppercase text-[var(--sl-t2)]">{wkFull}</span>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3.5 py-2 min-h-[36px] rounded-full text-xs font-bold transition-all select-none"
      style={active ? { background: '#22d96a', color: '#000' } : { background: 'var(--sl-pill-bg)', color: 'var(--sl-pill-text)' }}
    >{label}</button>
  );
}

function ClubPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3.5 py-2 min-h-[36px] rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none"
      style={active ? { background: 'var(--sl-t1)', color: 'var(--sl-bg)' } : { background: 'var(--sl-pill-bg)', color: 'var(--sl-pill-text)' }}
    >{label}</button>
  );
}

interface PlanningTimelineProps {
  currentUser?: Record<string, any> | null;
  managedClubs?: Record<string, any>[];
  isCoachOrManager?: boolean;
  isCommunicant?: boolean;
  isClubAdmin?: boolean;
  isAdmin?: boolean;
  followedClubIds?: (string | number)[];
  onOpenPoster?: (opts: Record<string, any>) => void;
  onConvocate?: (item: Record<string, any>) => void;
  onNavigateRides?: () => void;
  clubs?: Record<string, any>[];
  teamFilter?: string[];
  announcements?: MyAnnouncement[];
  readIds?: Set<string>;
  onMarkRead?: (id: string) => void;
}

export default function PlanningTimeline({
  currentUser,
  managedClubs = [],
  isCoachOrManager = false,
  isCommunicant = false,
  isClubAdmin = false,
  isAdmin = false,
  followedClubIds = [],
  onOpenPoster,
  onConvocate,
  onNavigateRides,
  clubs = [],
  teamFilter = [],
  announcements = [],
  readIds,
  onMarkRead,
}: PlanningTimelineProps) {
  const [viewDate,   setViewDate]   = useState(() => new Date());
  const [filter,     setFilter]     = useState('all');
  const [clubFilter, setClubFilter] = useState('all');
  const autoScrolledRef  = useRef(false);
  const autoAdvancedRef  = useRef(0); // nb de mois auto-avancés

  const isStaff = isCoachOrManager || isCommunicant || isClubAdmin || isAdmin;

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const managedClubIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedClubs]);

  const allClubIds = useMemo(() => {
    const ids = new Set([...followedClubIds.map(String), ...managedClubIds]);
    return [...ids];
  }, [followedClubIds, managedClubIds]);

  const knownClubs = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    clubs.forEach(c => { map[String(c.id)] = c; });
    managedClubs.forEach(c => { map[String(c.id)] = c; });
    return allClubIds.map(id => map[id]).filter(Boolean);
  }, [clubs, managedClubs, allClubIds]);

  const showClubFilter = knownClubs.length > 1;

  const { items, loading, respond, updateMatchScore } = useSeasonPlanning({
    userId: currentUser?.id, allClubIds, managedClubIds, managedClubs: managedClubs as any[], year, month, clubFilter, teamFilter,
  }) as any;

  const { items: feedRideItems } = useFeedRides(allClubIds, teamFilter);
  const ridesMap = useMemo(() => {
    const map: Record<string, { total: number; seats: number }> = {};
    feedRideItems.forEach(r => { map[r.eventId] = { total: r.totalRides, seats: r.availableSeats }; });
    return map;
  }, [feedRideItems]);

  // ── Auto-avance au prochain mois si le mois courant est vide (max 3 mois) ──
  useEffect(() => {
    if (loading) return;
    if (items.length > 0) return;
    if (autoAdvancedRef.current >= 3) return;
    autoAdvancedRef.current += 1;
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, [loading, items.length]);

  // ── Reset auto-avance quand l'utilisateur navigue manuellement ────────────
  const prevMonth = useCallback(() => {
    autoAdvancedRef.current = 0;
    autoScrolledRef.current = false;
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    autoAdvancedRef.current = 0;
    autoScrolledRef.current = false;
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const filteredItems: Record<string, any>[] = useMemo(() => {
    const planningItems =
      filter === 'match'    ? items.filter((i: any) => i.type === 'match') :
      filter === 'training' ? items.filter((i: any) => i.type === 'training') :
      items;

    // Annonces du mois courant — apparaissent dans tous les onglets
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const annItems = announcements
      .filter(ann => (ann.scheduledFor ?? ann.createdAt).slice(0, 7) === monthStr)
      .map(ann => ({
        ...ann,
        annType: ann.type,   // type d'annonce (urgent, info, event…)
        type: 'announcement',
        date: (ann.scheduledFor ?? ann.createdAt).slice(0, 10),
      }));

    return [...planningItems, ...annItems];
  }, [items, filter, announcements, year, month]);

  const groups: [string, Record<string, any>[]][] = useMemo(() => {
    const map: Record<string, Record<string, any>[]> = {};
    filteredItems.forEach(item => {
      if (!item.date || isNaN(new Date(item.date + 'T12:00:00').getTime())) return;
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  // ── Auto-scroll vers le premier événement ≥ aujourd'hui ───────────────────
  useEffect(() => {
    if (loading || groups.length === 0 || autoScrolledRef.current) return;
    const today = new Date().toISOString().slice(0, 10);
    const target = groups.find(([date]) => date >= today) ?? groups[groups.length - 1];
    if (!target) return;
    autoScrolledRef.current = true;
    // Petit délai pour que le DOM soit rendu
    const tid = setTimeout(() => {
      const el = document.getElementById(`planning-date-${target[0]}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(tid);
  }, [loading, groups]);

  const getClub    = useCallback((clubId: string | number) => knownClubs.find(c => String(c.id) === String(clubId)) ?? null, [knownClubs]);
  const withRespond = useCallback((item: Record<string, any>) => ({ ...item, onRespond: respond }), [respond]);

  const monthLabel = MONTHS_FR[month - 1] ?? '';
  const showTrainingFilter = isStaff || items.some((i: any) => i.type === 'training');

  return (
    <div className="flex flex-col bg-[var(--sl-bg)]">
      <div className="sticky top-0 z-20 px-4 pt-4 pb-2 space-y-3 border-b border-[var(--sl-border)] bg-[var(--sl-bg)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[var(--sl-t1)] leading-tight">Planning de la saison</h1>
            <p className="text-xs font-semibold text-[var(--sl-t3)] mt-0.5">Mois de {monthLabel}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} aria-label="Mois précédent" className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] text-lg hover:bg-[var(--sl-hover)] transition-colors">‹</button>
            <span className="text-sm font-bold text-[var(--sl-t1)] min-w-[48px] text-center">{String(month).padStart(2, '0')}/{String(year).slice(-2)}</span>
            <button onClick={nextMonth} aria-label="Mois suivant" className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] text-lg hover:bg-[var(--sl-hover)] transition-colors">›</button>
          </div>
        </div>

        {showClubFilter && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <ClubPill label="Tous" active={clubFilter === 'all'} onClick={() => setClubFilter('all')} />
            {knownClubs.map(c => (
              <ClubPill key={c.id} label={c.name} active={clubFilter === String(c.id)} onClick={() => setClubFilter(String(c.id))} />
            ))}
          </div>
        )}

        {(isStaff || items.some((i: any) => !i.isSupporter)) && (
          <div className="flex gap-2">
            <FilterPill label="Tout"           active={filter === 'all'}      onClick={() => setFilter('all')}      />
            <FilterPill label="Matchs"         active={filter === 'match'}    onClick={() => setFilter('match')}    />
            {showTrainingFilter && <FilterPill label="Entraînements" active={filter === 'training'} onClick={() => setFilter('training')} />}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-[var(--sl-surface)] animate-pulse" />)}
          </div>
        ) : groups.length === 0 ? (
          <div>
            <div className="flex flex-col items-center justify-center pt-10 pb-6 text-center">
              <span className="text-5xl mb-4">📅</span>
              <p className="text-sm font-bold text-[var(--sl-t2)]">Aucun événement ce mois-ci</p>
              <p className="text-xs text-[var(--sl-t3)] mt-1.5">{filter !== 'all' ? 'Essayez le filtre "Tout"' : 'Naviguez vers un autre mois'}</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: 27, background: 'linear-gradient(to bottom, #22d96a44, #22d96a, #22d96a44)' }} />
            <AnimatePresence mode="popLayout">
              {groups.map(([date, groupItems]) => (
                <motion.div key={date} id={`planning-date-${date}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="mb-6">
                  <DateBubble dateStr={date} />
                  {/* Un seul événement → pleine largeur ; plusieurs le même jour →
                      grille 2 colonnes sur grand écran (mobile reste 1 colonne). */}
                  <div className={`pl-[68px] ${groupItems.length > 1 ? 'grid grid-cols-1 lg:grid-cols-2 gap-3 items-start' : 'space-y-3 lg:max-w-[620px]'}`}>
                    {groupItems.map(item => {
                      if (item.type === 'announcement') return (
                        <AnnouncementPlanningCard
                          key={`ann-${item.id}`}
                          announcement={{ ...item, type: item.annType } as MyAnnouncement}
                          isRead={readIds?.has(item.id) ?? false}
                          onMarkRead={onMarkRead}
                        />
                      );
                      const club = getClub(item.club_id);
                      return item.type === 'training' ? (
                        <TrainingPlanningCard key={item.id} item={{ ...item, ...withRespond(item) } as any} userId={currentUser?.id} isStaff={item.isStaffClub} onOpenRides={onNavigateRides} />
                      ) : (
                        <MatchPlanningCard key={item.id} item={{ ...item, ...withRespond(item) } as any} userId={currentUser?.id} club={club} isStaff={item.isStaffClub} isCoach={item.isCoachClub} isCommunicant={item.isCommClub} isPresident={item.isOwnerClub} isGuardian={item.isGuardian} rides={ridesMap[String(item.id)] ?? null} onOpenPoster={onOpenPoster} onConvocate={onConvocate} onOpenRides={onNavigateRides} onScoreSaved={updateMatchScore} showClubBadge={showClubFilter && clubFilter === 'all'} />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
