import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonPlanning }    from '../../hooks/useSeasonPlanning.js';
import TrainingPlanningCard     from './TrainingPlanningCard.jsx';
import MatchPlanningCard        from './MatchPlanningCard.jsx';

const CompositionPoster = lazy(() => import('./CompositionPoster.jsx'));

const WEEKDAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function DateBubble({ dateStr }) {
  const d = new Date((dateStr ?? '') + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const mon = (MONTHS_FR[d.getMonth()] ?? '').slice(0, 3).toUpperCase();
  const wk  = (WEEKDAYS_FR[d.getDay()] ?? '').toUpperCase();
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="w-12 h-12 rounded-full flex flex-col items-center justify-center flex-shrink-0 relative z-10"
        style={{ background: '#22d96a' }}
      >
        <span className="text-black font-black text-base leading-none">{day}</span>
        <span className="text-black/70 text-[8px] font-bold leading-none mt-0.5">{mon}</span>
      </div>
      <span className="text-[10px] font-black tracking-[0.18em] uppercase text-[var(--sl-t3)]">{wk}</span>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none"
      style={active
        ? { background: '#22d96a', color: '#000' }
        : { background: 'var(--sl-pill-bg)', color: 'var(--sl-pill-text)' }
      }
    >
      {label}
    </button>
  );
}

function ClubPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none"
      style={active
        ? { background: 'var(--sl-t1)', color: 'var(--sl-bg)' }
        : { background: 'var(--sl-pill-bg)', color: 'var(--sl-pill-text)' }
      }
    >
      {label}
    </button>
  );
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
}) {
  const [viewDate,   setViewDate]   = useState(() => new Date());
  const [filter,     setFilter]     = useState('all');   // 'all' | 'match' | 'training'
  const [clubFilter, setClubFilter] = useState('all');
  const [compPoster, setCompPoster] = useState(null);

  const isStaff = isCoachOrManager || isCommunicant || isClubAdmin || isAdmin;

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const managedClubIds = useMemo(() => managedClubs.map(c => String(c.id)), [managedClubs]);

  const allClubIds = useMemo(() => {
    const ids = new Set([...followedClubIds.map(String), ...managedClubIds]);
    return [...ids];
  }, [followedClubIds, managedClubIds]);

  // Déterminer les clubs distincts pour le filtre
  const knownClubs = useMemo(() => {
    const map = {};
    clubs.forEach(c => { map[String(c.id)] = c; });
    // Fallback : clubs managed
    managedClubs.forEach(c => { map[String(c.id)] = c; });
    return allClubIds.map(id => map[id]).filter(Boolean);
  }, [clubs, managedClubs, allClubIds]);

  const showClubFilter = knownClubs.length > 1;

  const { items, loading, respond } = useSeasonPlanning({
    userId:         currentUser?.id,
    allClubIds,
    managedClubIds,
    year,
    month,
    clubFilter,
  });

  // Filtrage par type (côté client — données déjà fetchées)
  const filteredItems = useMemo(() => {
    if (filter === 'all')      return items;
    if (filter === 'match')    return items.filter(i => i.type === 'match');
    if (filter === 'training') return items.filter(i => i.type === 'training');
    return items;
  }, [items, filter]);

  // Groupement par date — on ignore les items avec date invalide ou manquante
  const groups = useMemo(() => {
    const map = {};
    filteredItems.forEach(item => {
      if (!item.date || isNaN(new Date(item.date + 'T12:00:00').getTime())) return;
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const prevMonth = useCallback(() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)), []);
  const nextMonth = useCallback(() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)), []);

  const getClub = useCallback((clubId) => knownClubs.find(c => String(c.id) === String(clubId)) ?? null, [knownClubs]);

  // Injecte le handler respond dans chaque item
  const withRespond = useCallback((item) => ({ ...item, onRespond: respond }), [respond]);

  const monthLabel = `${MONTHS_FR[month - 1]} ${year}`;

  return (
    <div className="flex flex-col min-h-0">
      {/* ── En-tête planning ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] hover:bg-[var(--sl-hover)] transition-colors"
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <motion.h2
            key={monthLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base font-black text-[var(--sl-t1)] capitalize"
          >
            {monthLabel}
          </motion.h2>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] hover:bg-[var(--sl-hover)] transition-colors"
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>

        {/* Filtre clubs */}
        {showClubFilter && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <ClubPill label="Tous" active={clubFilter === 'all'} onClick={() => setClubFilter('all')} />
            {knownClubs.map(c => (
              <ClubPill
                key={c.id}
                label={c.name}
                active={clubFilter === String(c.id)}
                onClick={() => setClubFilter(String(c.id))}
              />
            ))}
          </div>
        )}

        {/* Pills filtre type (masqué pour supporters purs) */}
        {(isStaff || items.some(i => !i.isSupporter)) && (
          <div className="flex gap-2">
            <FilterPill label="Tout"           active={filter === 'all'}      onClick={() => setFilter('all')}      />
            <FilterPill label="Matchs"         active={filter === 'match'}    onClick={() => setFilter('match')}    />
            {(isStaff || items.some(i => i.type === 'training')) && (
              <FilterPill label="Entraînements" active={filter === 'training'} onClick={() => setFilter('training')} />
            )}
          </div>
        )}
      </div>

      {/* ── Timeline ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading ? (
          <div className="flex flex-col gap-3 mt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--sl-surface)] animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">📅</span>
            <p className="text-sm font-semibold text-[var(--sl-t2)]">Aucun événement ce mois-ci</p>
            <p className="text-xs text-[var(--sl-t3)] mt-1">
              {filter !== 'all' ? 'Essayez le filtre "Tout"' : 'Naviguez vers un autre mois'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Ligne verticale timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[var(--sl-border)] pointer-events-none" />

            <AnimatePresence mode="popLayout">
              {groups.map(([date, groupItems]) => (
                <motion.div
                  key={date}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-6 relative"
                >
                  <DateBubble dateStr={date} />
                  <div className="ml-15 space-y-2.5" style={{ marginLeft: '60px' }}>
                    {groupItems.map(item => {
                      const club = getClub(item.club_id);
                      return item.type === 'training' ? (
                        <TrainingPlanningCard
                          key={item.id}
                          item={withRespond(item)}
                          userId={currentUser?.id}
                          onOpenRides={onNavigateRides}
                        />
                      ) : (
                        <MatchPlanningCard
                          key={item.id}
                          item={withRespond(item)}
                          userId={currentUser?.id}
                          club={club}
                          onOpenPoster={onOpenPoster}
                          onConvocate={onConvocate}
                          onOpenRides={onNavigateRides}
                          onOpenCompoPoster={(players) => setCompPoster({ event: item, club, players })}
                          showClubBadge={showClubFilter && clubFilter === 'all'}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CompositionPoster lazy */}
      <AnimatePresence>
        {compPoster && (
          <Suspense fallback={null}>
            <CompositionPoster
              event={compPoster.event}
              club={compPoster.club}
              players={compPoster.players}
              onClose={() => setCompPoster(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
