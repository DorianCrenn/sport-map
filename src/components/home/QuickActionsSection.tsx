import { AnimatePresence } from 'framer-motion';
import TrainingCard from './TrainingCard.jsx';
import CoachMatchCard from './CoachMatchCard.jsx';
import CommunicantPosterCard from './CommunicantPosterCard.jsx';

function QuickActionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><span className="w-20 h-2.5 rounded-full bg-[var(--sl-card)] animate-pulse" /></div>
      {[1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-[var(--sl-card)] animate-pulse" />)}
    </div>
  );
}

interface QuickActions {
  todayTraining?: Record<string, any> | null;
  coachMatches: Record<string, any>[];
  loading: boolean;
}

interface ManagedClub { managerRole?: string }

interface QuickActionsSectionProps {
  quickActions: QuickActions;
  isCoachOrManager?: boolean;
  isCommunicant?: boolean;
  isPresident?: boolean;
  managedClubs?: ManagedClub[];
  onNavigate?: (tab: string) => void;
  onOpenTrainings?: () => void;
  onOpenPoster?: (opts: Record<string, any>) => void;
  onConvocate?: (event: Record<string, any>) => void;
}

export default function QuickActionsSection({ quickActions, isCoachOrManager, isCommunicant, isPresident, managedClubs = [], onNavigate, onOpenTrainings, onOpenPoster, onConvocate }: QuickActionsSectionProps) {
  const { todayTraining, coachMatches, loading } = quickActions;

  if (loading) return <QuickActionsSkeleton />;

  const hasCoach       = managedClubs.some(c => ['owner', 'manager', 'editor'].includes(c.managerRole ?? ''));
  const hasCommunicant = managedClubs.some(c => c.managerRole === 'communicant');
  const showCoachCards = isCoachOrManager || (isPresident && !hasCoach);
  const showCommCards  = isCommunicant    || (isPresident && !hasCommunicant);

  const hasAnything   = (showCoachCards || showCommCards) && coachMatches.length > 0;
  const hasTodayTrain = showCoachCards && todayTraining;

  if (!hasAnything && !hasTodayTrain) return null;

  const cards: React.ReactNode[] = [];

  if (hasTodayTrain) {
    cards.push(<div key="training"><TrainingCard training={todayTraining!} onOpenTrainings={onOpenTrainings ?? (() => {})} /></div>);
  }

  for (const m of coachMatches) {
    if (showCoachCards) {
      cards.push(
        <div key={`coach-${m.event.id}`}>
          <CoachMatchCard event={m.event} matchScore={m.matchScore} convocationCounts={m.convocationCounts} onNavigate={onNavigate} onOpenPoster={onOpenPoster} onConvocate={onConvocate} />
        </div>
      );
    }
    if (showCommCards) {
      cards.push(
        <div key={`comm-${m.event.id}`}>
          <CommunicantPosterCard event={m.event} matchScore={m.matchScore} convocationCounts={m.convocationCounts} onOpenPoster={onOpenPoster} />
        </div>
      );
    }
  }

  if (!cards.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black tracking-[0.15em] uppercase text-[var(--sl-t3)]">Actions requises</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      </div>
      <AnimatePresence mode="popLayout">{cards}</AnimatePresence>
    </div>
  );
}
