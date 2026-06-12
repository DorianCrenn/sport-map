import { AnimatePresence } from 'framer-motion';
import TrainingCard from './TrainingCard.jsx';
import CoachMatchCard from './CoachMatchCard.jsx';
import CommunicantPosterCard from './CommunicantPosterCard.jsx';

// Skeleton pendant le chargement
function QuickActionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-20 h-2.5 rounded-full bg-[var(--sl-card)] animate-pulse" />
      </div>
      {[1, 2].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-[var(--sl-card)] animate-pulse" />
      ))}
    </div>
  );
}

/**
 * QuickActionsSection — Cartes d'actions contextuelles par rôle.
 * Affichée en haut de la colonne Agenda dans NewsPage.
 */
export default function QuickActionsSection({
  quickActions,
  isCoachOrManager,
  isCommunicant,
  isPresident,
  managedClubs = [],
  onNavigate,
  onOpenTrainings,
  onOpenPoster,
  onConvocate,
}) {
  const {
    todayTraining,
    coachMatches,
    loading,
  } = quickActions;

  if (loading) return <QuickActionsSkeleton />;

  // Le président hérite des cartes coach/comm si aucun manager assigné
  const hasCoach       = managedClubs.some(c => ['owner','manager','editor'].includes(c.managerRole));
  const hasCommunicant = managedClubs.some(c => c.managerRole === 'communicant');
  const showCoachCards = isCoachOrManager || (isPresident && !hasCoach);
  const showCommCards  = isCommunicant    || (isPresident && !hasCommunicant);

  const hasAnything  = (showCoachCards || showCommCards) && coachMatches.length > 0;
  const hasTodayTrain = showCoachCards && todayTraining;

  if (!hasAnything && !hasTodayTrain) return null;

  // Les cartes s'animent elles-mêmes (spring interne) —
  // on les wraps dans de simples div pour éviter la double animation.
  const cards = [];

  if (hasTodayTrain) {
    cards.push(
      <div key="training">
        <TrainingCard training={todayTraining} onOpenTrainings={onOpenTrainings} />
      </div>
    );
  }

  for (const m of coachMatches) {
    if (showCoachCards) {
      cards.push(
        <div key={`coach-${m.event.id}`}>
          <CoachMatchCard
            event={m.event}
            matchScore={m.matchScore}
            convocationCounts={m.convocationCounts}
            onNavigate={onNavigate}
            onOpenPoster={onOpenPoster}
            onConvocate={onConvocate}
          />
        </div>
      );
    }
    if (showCommCards) {
      cards.push(
        <div key={`comm-${m.event.id}`}>
          <CommunicantPosterCard
            event={m.event}
            matchScore={m.matchScore}
            convocationCounts={m.convocationCounts}
            onOpenPoster={onOpenPoster}
          />
        </div>
      );
    }
  }

  if (!cards.length) return null;

  return (
    <div className="space-y-3">
      {/* En-tête section */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black tracking-[0.15em] uppercase text-[var(--sl-t3)]">
          Actions requises
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>

      {/* Cartes — AnimatePresence pour les entrées/sorties */}
      <AnimatePresence mode="popLayout">
        {cards}
      </AnimatePresence>
    </div>
  );
}
