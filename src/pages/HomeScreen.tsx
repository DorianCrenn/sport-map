import { type FC, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import ActualitesPage from './ActualitesPage.jsx';

const HomePage = lazy(() => import('./HomePage.jsx'));

interface HomeScreenProps {
  followedClubIds: string[];
  onNavigate: (tab: string) => void;
  stats?: Record<string, number>;
  clubs?: unknown[];
  allEvents?: unknown[];
  onOpenTrainings?: () => void;
  externalConvocations?: unknown[];
  onConvocationRespond?: (id: string, status: string, note?: string) => void;
  onShowLegal?: (section?: string) => void;
}

const HomeScreen: FC<HomeScreenProps> = ({ followedClubIds, onNavigate, stats, clubs, allEvents, onOpenTrainings, externalConvocations, onConvocationRespond, onShowLegal }) => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return (
      <ActualitesPage
        {...({} as any)}
        followedClubIds={followedClubIds}
        onNavigate={onNavigate}
        onOpenTrainings={onOpenTrainings}
        externalConvocations={externalConvocations}
        onConvocationRespond={onConvocationRespond}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <HomePage
        onNavigate={onNavigate}
        stats={stats}
        clubs={clubs ?? []}
        allEvents={allEvents ?? []}
        onShowLegal={onShowLegal}
      />
    </Suspense>
  );
};

export default HomeScreen;
