import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSeasonPlanning }    from '../../hooks/useSeasonPlanning.js';
import TrainingPlanningCard     from './TrainingPlanningCard.jsx';
import MatchPlanningCard        from './MatchPlanningCard.jsx';

const CompositionPoster = lazy(() => import('./CompositionPoster.jsx'));

const WEEKDAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function DateBubble({ dateStr }) {
  const d = new Date((dateStr ?? '') + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const mon = (MONTHS_FR[d.getMonth()] ?? '').toUpperCase();
  const wkFull = WEEKDAYS_FULL[d.getDay()] ?? '';
  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Bulle date verte */}
      <div
        className="w-14 h-14 rounded-full flex flex-col items-center justify-center flex-shrink-0 relative z-10 shadow-lg"
        style={{ background: '#22d96a' }}
      >
        <span className="text-black font-black text-xl leading-none">{day}</span>
        <span className="text-black/75 text-[9px] font-black leading-tight tracking-wide">{mon}</span>
      </div>
      {/* Jour de la semaine */}
      <span className="text-[11px] font-black tracking-[0.2em] uppercase text-[var(--sl-t2)]">
        {wkFull}
      </span>
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none"
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
      className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none"
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
  const [filter,     setFilter]     = useState('all');
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

  const knownClubs = useMemo(() => {
    const map = {};
    clubs.forEach(c => { map[String(c.id)] = c; });
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

  const filteredItems = useMemo(() => {
    if (filter === 'match')    return items.filter(i => i.type === 'match');
    if (filter === 'training') return items.filter(i => i.type === 'training');
    return items;
  }, [items, filter]);

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
  const getClub   = useCallback(clubId => knownClubs.find(c => String(c.id) === String(clubId)) ?? null, [knownClubs]);
  const withRespond = useCallback(item => ({ ...item, onRespond: respond }), [respond]);

  const monthLabel = MONTHS_FR[month - 1] ?? '';

  const showTrainingFilter = isStaff || items.some(i => i.type === 'training');

  return (
    <div className="flex flex-col h-full bg-[var(--sl-bg)]">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 space-y-3 border-b border-[var(--sl-border)]">

        {/* Titre + navigation mois */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[var(--sl-t1)] leading-tight">
              Planning de la Saison
            </h1>
            <p className="text-xs font-semibold text-[var(--sl-t3)] mt-0.5 capitalize">
              Mois de {monthLabel}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              aria-label="Mois précédent"
              className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] text-lg hover:bg-[var(--sl-hover)] transition-colors"
            >‹</button>
            <span className="text-sm font-bold text-[var(--sl-t1)] min-w-[48px] text-center">
              {String(month).padStart(2, '0')}/{String(year).slice(-2)}
            </span>
            <button
              onClick={nextMonth}
              aria-label="Mois suivant"
              className="w-9 h-9 rounded-full bg-[var(--sl-surface)] flex items-center justify-center text-[var(--sl-t2)] text-lg hover:bg-[var(--sl-hover)] transition-colors"
            >›</button>
          </div>
        </div>

        {/* Filtre clubs (multi-clubs) */}
        {showClubFilter && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
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

        {/* Pills filtre type */}
        {(isStaff || items.some(i => !i.isSupporter)) && (
          <div className="flex gap-2">
            <FilterPill label="Tout"           active={filter === 'all'}      onClick={() => setFilter('all')}      />
            <FilterPill label="Matchs"         active={filter === 'match'}    onClick={() => setFilter('match')}    />
            {showTrainingFilter && (
              <FilterPill label="Entraînements" active={filter === 'training'} onClick={() => setFilter('training')} />
            )}
          </div>
        )}
      </div>

      {/* ── Timeline scrollable ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 rounded-2xl bg-[var(--sl-surface)] animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📅</span>
            <p className="text-sm font-bold text-[var(--sl-t2)]">Aucun événement ce mois-ci</p>
            <p className="text-xs text-[var(--sl-t3)] mt-1.5">
              {filter !== 'all' ? 'Essayez le filtre "Tout"' : 'Naviguez vers un autre mois'}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Ligne verticale verte */}
            <div
              className="absolute top-0 bottom-0 w-px pointer-events-none"
              style={{ left: 27, background: 'linear-gradient(to bottom, #22d96a44, #22d96a, #22d96a44)' }}
            />

            <AnimatePresence mode="popLayout">
              {groups.map(([date, groupItems]) => (
                <motion.div
                  key={date}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mb-6"
                >
                  <DateBubble dateStr={date} />
                  <div className="space-y-3 pl-[68px]">
                    {groupItems.map(item => {
                      const club = getClub(item.club_id);
                      return item.type === 'training' ? (
                        <TrainingPlanningCard
                          key={item.id}
                          item={withRespond(item)}
                          userId={currentUser?.id}
                          isStaff={item.isStaffClub}
                          onOpenRides={onNavigateRides}
                        />
                      ) : (
                        <MatchPlanningCard
                          key={item.id}
                          item={withRespond(item)}
                          userId={currentUser?.id}
                          club={club}
                          isStaff={item.isStaffClub}
                          onOpenPoster={onOpenPoster}
                          onConvocate={onConvocate}
                          onOpenRides={onNavigateRides}
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
              onClose={() => setCompPoster(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
